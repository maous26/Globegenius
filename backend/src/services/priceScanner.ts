import axios, { AxiosInstance } from 'axios';
import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { config } from '../config';
import { redis } from './redis';
import { AnomalyDetector } from './anomalyDetector';
import { addMonths, format, addDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  adults?: number;
  currency?: string;
  cabinClass?: 'economy' | 'business' | 'first';
}

interface FlightResult {
  price: number;
  currency: string;
  airline: string;
  flightNumber: string;
  departureDate: string;
  returnDate: string;
  stops: number;
  bookingClass: string;
  deepLink?: string;
  segments: any[];
}

export class PriceScanner {
  private db: Pool;
  private flightLabsClient: AxiosInstance;
  private anomalyDetector: AnomalyDetector;
  private apiCallsToday: number = 0;
  private lastResetDate: Date;

  constructor(database: Pool) {
    this.db = database;
    this.anomalyDetector = new AnomalyDetector(database);
    this.lastResetDate = new Date();

    // Configurer le client FlightLabs
    this.flightLabsClient = axios.create({
      baseURL: config.apis.flightLabs.baseUrl,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Intercepteur pour ajouter l'API key
    this.flightLabsClient.interceptors.request.use((axiosConfig) => {
      axiosConfig.params = {
        ...axiosConfig.params,
        access_key: config.apis.flightLabs.key
      };
      return axiosConfig;
    });

    // Intercepteur pour logger les réponses
    this.flightLabsClient.interceptors.response.use(
      (response) => {
        logger.debug(`FlightLabs API: ${response.config.url} - Status: ${response.status}`);
        return response;
      },
      (error) => {
        logger.error(`FlightLabs API Error: ${error.message}`);
        throw error;
      }
    );
  }

  /**
   * Scanner une route spécifique
   */
  async scanRoute(routeId: string): Promise<void> {
    try {
      // Vérifier les quotas
      await this.checkApiQuota();

      // Récupérer les infos de la route
      const route = await this.getRoute(routeId);
      if (!route) {
        logger.error(`Route ${routeId} non trouvée`);
        return;
      }

      logger.info(`🔍 Scan de la route ${route.origin} → ${route.destination}`);

      // Générer les dates de recherche (2-10 mois dans le futur)
      const searchDates = this.generateSearchDates();

      // Scanner chaque période
      for (const { departure, return: returnDate } of searchDates) {
        try {
          const results = await this.searchFlights({
            origin: route.origin,
            destination: route.destination,
            departureDate: departure,
            returnDate: returnDate,
            adults: 1,
            currency: 'EUR',
            cabinClass: 'economy'
          });

          // Traiter chaque résultat
          for (const flight of results) {
            await this.processFlight(route, flight);
          }

          // Pause pour éviter le rate limiting
          await this.delay(1000);

        } catch (error) {
          logger.error(`Erreur scan ${route.origin}-${route.destination} ${departure}:`, error);
        }
      }

      // Mettre à jour le statut de la route
      await this.updateRouteStatus(routeId, true);

    } catch (error) {
      logger.error(`Erreur scan route ${routeId}:`, error);
      await this.updateRouteStatus(routeId, false);
    }
  }

  /**
   * Rechercher des vols via FlightLabs
   */
  private async searchFlights(params: FlightSearchParams): Promise<FlightResult[]> {
    try {
      const response = await this.flightLabsClient.get('/advanced-future-flight-search', {
        params: {
          iataOrigin: params.origin,
          iataDestination: params.destination,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          adults: params.adults || 1,
          currency: params.currency || 'EUR',
          cabin: params.cabinClass || 'economy',
          // Options spécifiques FlightLabs
          onlyDirectFlights: false,
          includeCarriers: true,
          limit: 20
        }
      });

      // Enregistrer l'appel API
      await this.logApiCall('flightlabs', true);

      if (!response.data || !response.data.data) {
        return [];
      }

      // Parser les résultats FlightLabs
      return this.parseFlightLabsResults(response.data.data);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logApiCall('flightlabs', false, errorMessage);
      
      // Si quota dépassé, lever une exception
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as any).response?.status === 429
      ) {
        throw new Error('Quota API FlightLabs dépassé');
      }
      
      return [];
    }
  }

  /**
   * Parser les résultats FlightLabs
   */
  private parseFlightLabsResults(data: any[]): FlightResult[] {
    const results: FlightResult[] = [];

    for (const item of data) {
      try {
        // Structure FlightLabs
        const outboundSegment = item.route[0];
        const returnSegment = item.route[1];

        results.push({
          price: parseFloat(item.price.total),
          currency: item.price.currency,
          airline: outboundSegment.airline,
          flightNumber: outboundSegment.flight_number,
          departureDate: outboundSegment.departure_date,
          returnDate: returnSegment?.departure_date || outboundSegment.arrival_date,
          stops: item.route.length - 1,
          bookingClass: outboundSegment.booking_class || 'economy',
          deepLink: item.deep_link,
          segments: item.route
        });
      } catch (error) {
        logger.warn('Erreur parsing résultat FlightLabs:', error);
      }
    }

    return results;
  }

  /**
   * Traiter un vol trouvé
   */
  private async processFlight(route: any, flight: FlightResult): Promise<void> {
    try {
      // Sauvegarder dans l'historique des prix
      const priceHistoryId = await this.savePriceHistory(route.id, flight);

      // Préparer les données pour la détection d'anomalie
      const priceData = {
        id: priceHistoryId,
        routeId: route.id,
        price: flight.price,
        currency: flight.currency,
        departureDate: new Date(flight.departureDate),
        returnDate: new Date(flight.returnDate),
        airline: flight.airline,
        bookingClass: flight.bookingClass,
        stops: flight.stops,
        rawData: flight
      };

      // Détecter les anomalies
      const anomalyResult = await this.anomalyDetector.detectAnomaly(priceData);

      if (anomalyResult && anomalyResult.isAnomaly) {
        logger.info(`✈️ ANOMALIE DÉTECTÉE! ${route.origin}→${route.destination} : ${flight.price}€ (-${anomalyResult.discountPercentage.toFixed(0)}%)`);
        
        // Publier l'événement pour notification immédiate
        await redis.publish('price:anomaly', JSON.stringify({
          route: `${route.origin}-${route.destination}`,
          price: flight.price,
          discount: anomalyResult.discountPercentage,
          confidence: anomalyResult.confidence
        }));
      }

    } catch (error) {
      logger.error('Erreur traitement vol:', error);
    }
  }

  /**
   * Sauvegarder dans l'historique des prix
   */
  private async savePriceHistory(routeId: string, flight: FlightResult): Promise<string> {
    const id = uuidv4();
    
    const query = `
      INSERT INTO price_history (
        id, route_id, price, currency, departure_date, return_date,
        trip_duration, airline, flight_number, booking_class, stops,
        raw_data, api_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;

    const tripDuration = Math.ceil(
      (new Date(flight.returnDate).getTime() - new Date(flight.departureDate).getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    await this.db.query(query, [
      id,
      routeId,
      flight.price,
      flight.currency,
      flight.departureDate,
      flight.returnDate,
      tripDuration,
      flight.airline,
      flight.flightNumber,
      flight.bookingClass,
      flight.stops,
      JSON.stringify(flight),
      'flightlabs'
    ]);

    return id;
  }

  /**
   * Générer les dates de recherche
   */
  private generateSearchDates(): Array<{departure: string, return: string}> {
    const dates = [];
    const today = new Date();

    // Stratégie de recherche optimisée
    const searchStrategy = [
      { monthsAhead: 2, duration: 7 },   // Court séjour dans 2 mois
      { monthsAhead: 2, duration: 14 },  // Long séjour dans 2 mois
      { monthsAhead: 3, duration: 7 },   // Court séjour dans 3 mois
      { monthsAhead: 4, duration: 10 },  // Moyen séjour dans 4 mois
      { monthsAhead: 6, duration: 7 },   // Court séjour dans 6 mois
      { monthsAhead: 8, duration: 14 },  // Long séjour dans 8 mois
    ];

    for (const strategy of searchStrategy) {
      const departureDate = addMonths(today, strategy.monthsAhead);
      const returnDate = addDays(departureDate, strategy.duration);

      dates.push({
        departure: format(departureDate, 'yyyy-MM-dd'),
        return: format(returnDate, 'yyyy-MM-dd')
      });
    }

    return dates;
  }

  /**
   * Vérifier les quotas API
   */
  private async checkApiQuota(): Promise<void> {
    // Reset quotidien
    const today = new Date();
    if (today.getDate() !== this.lastResetDate.getDate()) {
      this.apiCallsToday = 0;
      this.lastResetDate = today;
    }

    // Vérifier quota mensuel
    const monthlyUsage = await this.getMonthlyApiUsage();
    const remaining = config.limits.api.monthlyLimit - monthlyUsage;

    if (remaining <= 0) {
      throw new Error('Quota mensuel API épuisé');
    }

    if (remaining < 500) {
      logger.warn(`⚠️ Quota API critique: ${remaining} appels restants ce mois`);
    }

    // Vérifier quota journalier (warning)
    if (this.apiCallsToday >= config.limits.api.dailyWarning) {
      logger.warn(`⚠️ ${this.apiCallsToday} appels API aujourd'hui`);
    }
  }

  /**
   * Enregistrer un appel API
   */
  private async logApiCall(
    apiName: string, 
    success: boolean, 
    errorMessage?: string
  ): Promise<void> {
    this.apiCallsToday++;

    const query = `
      INSERT INTO api_calls (
        api_name, endpoint, success, error_message, credits_used
      ) VALUES ($1, $2, $3, $4, $5)
    `;

    await this.db.query(query, [
      apiName,
      '/advanced-future-flight-search',
      success,
      errorMessage || null,
      1
    ]);

    // Invalider le cache des métriques
    await redis.del('metrics:api_usage:monthly');
  }

  /**
   * Obtenir l'usage mensuel
   */
  private async getMonthlyApiUsage(): Promise<number> {
    const query = `
      SELECT COUNT(*) as total
      FROM api_calls
      WHERE api_name = 'flightlabs'
        AND created_at >= DATE_TRUNC('month', NOW())
    `;

    const result = await this.db.query(query);
    return parseInt(result.rows[0].total);
  }

  /**
   * Mettre à jour le statut de la route
   */
  private async updateRouteStatus(routeId: string, success: boolean): Promise<void> {
    const query = `
      UPDATE routes 
      SET 
        last_scan_at = NOW(),
        total_scans = total_scans + 1,
        monthly_calls = monthly_calls + $1
      WHERE id = $2
    `;

    // Chaque scan utilise environ 6 appels (6 périodes de dates)
    await this.db.query(query, [6, routeId]);
  }

  /**
   * Récupérer une route
   */
  private async getRoute(routeId: string): Promise<any> {
    const result = await this.db.query(
      'SELECT * FROM routes WHERE id = $1',
      [routeId]
    );
    return result.rows[0];
  }

  /**
   * Utilitaire de délai
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}