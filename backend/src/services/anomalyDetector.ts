import { Pool } from 'pg';
import axios from 'axios';
import { logger } from '../utils/logger';
import { config } from '../config';
import { redis } from './redis';
import { addHours, differenceInDays, format } from 'date-fns';

interface PriceData {
  id: string;
  routeId: string;
  price: number;
  currency: string;
  departureDate: Date;
  returnDate: Date;
  airline: string;
  bookingClass: string;
  stops: number;
  rawData: any;
}

interface AnomalyResult {
  isAnomaly: boolean;
  score: number;
  confidence: number;
  normalPrice: number;
  discountPercentage: number;
  features: AnomalyFeatures;
  mlPrediction: MLPrediction;
}

interface AnomalyFeatures {
  priceRatio: number;
  zScore: number;
  dayOfWeek: number;
  daysUntilDeparture: number;
  tripDuration: number;
  seasonalFactor: number;
  historicalMin: number;
  historicalMax: number;
  historicalMedian: number;
  priceVariance: number;
  recentTrend: number;
}

interface MLPrediction {
  isolationScore: number;
  predictedNormalPrice: number;
  anomalyProbability: number;
  confidenceInterval: [number, number];
}

export class AnomalyDetector {
  private db: Pool;
  private mlServiceUrl: string;
  private confidenceThreshold: number;
  private minDiscountPercentage: number;

  constructor(database: Pool) {
    this.db = database;
    this.mlServiceUrl = config.ml.serviceUrl;
    this.confidenceThreshold = config.ml.confidenceThreshold;
    this.minDiscountPercentage = config.business.minDiscountPercentage;
  }

  /**
   * Analyser un nouveau prix pour détecter une anomalie
   */
  async detectAnomaly(priceData: PriceData): Promise<AnomalyResult | null> {
    try {
      logger.debug(`Analyse du prix pour ${priceData.airline} - ${priceData.price}€`);

      // 1. Récupérer l'historique des prix
      const priceHistory = await this.getPriceHistory(
        priceData.routeId,
        priceData.departureDate,
        priceData.returnDate
      );

      if (priceHistory.length < 10) {
        logger.info('Historique insuffisant pour analyse ML');
        // Utiliser des règles simples si pas assez d'historique
        return this.simpleAnomalyDetection(priceData, priceHistory);
      }

      // 2. Calculer les features
      const features = await this.extractFeatures(priceData, priceHistory);

      // 3. Appeler le service ML
      const mlPrediction = await this.callMLService(features);

      // 4. Combiner ML + règles métier
      const anomalyResult = this.combineMLAndBusinessRules(
        priceData,
        features,
        mlPrediction
      );

      // 5. Sauvegarder si anomalie détectée
      if (anomalyResult.isAnomaly && anomalyResult.confidence >= this.confidenceThreshold) {
        await this.saveAnomaly(priceData, anomalyResult);
      }

      return anomalyResult;
    } catch (error) {
      logger.error('Erreur détection anomalie:', error);
      return null;
    }
  }

  /**
   * Extraire les features pour le ML
   */
  private async extractFeatures(
    priceData: PriceData,
    history: any[]
  ): Promise<AnomalyFeatures> {
    const prices = history.map(h => h.price);
    const currentPrice = priceData.price;

    // Statistiques de base
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const median = this.calculateMedian(prices);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    // Z-Score
    const zScore = stdDev > 0 ? (currentPrice - mean) / stdDev : 0;

    // Temporal features
    const daysUntilDeparture = differenceInDays(priceData.departureDate, new Date());
    const tripDuration = differenceInDays(priceData.returnDate, priceData.departureDate);
    const dayOfWeek = priceData.departureDate.getDay();

    // Tendance récente (7 derniers jours)
    const recentPrices = history
      .filter(h => differenceInDays(new Date(), new Date(h.created_at)) <= 7)
      .map(h => h.price);
    
    const recentTrend = recentPrices.length >= 2
      ? (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0]
      : 0;

    // Facteur saisonnier
    const seasonalFactor = this.calculateSeasonalFactor(priceData.departureDate);

    return {
      priceRatio: currentPrice / median,
      zScore,
      dayOfWeek,
      daysUntilDeparture,
      tripDuration,
      seasonalFactor,
      historicalMin: min,
      historicalMax: max,
      historicalMedian: median,
      priceVariance: variance,
      recentTrend
    };
  }

  /**
   * Appeler le service ML Python
   */
  private async callMLService(features: AnomalyFeatures): Promise<MLPrediction> {
    try {
      const response = await axios.post(`${this.mlServiceUrl}/api/anomaly/detect`, {
        features: {
          price_ratio: features.priceRatio,
          z_score: features.zScore,
          day_of_week: features.dayOfWeek,
          days_until_departure: features.daysUntilDeparture,
          trip_duration: features.tripDuration,
          seasonal_factor: features.seasonalFactor,
          price_variance: features.priceVariance,
          recent_trend: features.recentTrend
        }
      }, {
        timeout: 5000
      });

      return {
        isolationScore: response.data.isolation_score,
        predictedNormalPrice: response.data.predicted_price,
        anomalyProbability: response.data.anomaly_probability,
        confidenceInterval: response.data.confidence_interval
      };
    } catch (error) {
      logger.error('Erreur appel ML service:', error);
      // Fallback sur détection simple
      return {
        isolationScore: features.zScore < -2 ? -0.8 : 0,
        predictedNormalPrice: features.historicalMedian,
        anomalyProbability: features.zScore < -2 ? 0.9 : 0.1,
        confidenceInterval: [
          features.historicalMedian * 0.8,
          features.historicalMedian * 1.2
        ]
      };
    }
  }

  /**
   * Combiner prédictions ML et règles métier
   */
  private combineMLAndBusinessRules(
    priceData: PriceData,
    features: AnomalyFeatures,
    mlPrediction: MLPrediction
  ): AnomalyResult {
    const discountPercentage = ((mlPrediction.predictedNormalPrice - priceData.price) / 
                                mlPrediction.predictedNormalPrice) * 100;

    // Règles métier
    const businessRules = {
      minDiscountMet: discountPercentage >= this.minDiscountPercentage,
      priceInRange: priceData.price >= features.historicalMin * 0.5 && 
                    priceData.price <= features.historicalMax * 1.5,
      notTooFar: features.daysUntilDeparture >= 14 && features.daysUntilDeparture <= 300,
      validDuration: features.tripDuration >= 2 && features.tripDuration <= 30
    };

    // Score final pondéré
    const mlScore = mlPrediction.anomalyProbability;
    const businessScore = Object.values(businessRules).filter(v => v).length / 
                         Object.keys(businessRules).length;
    
    const finalScore = 0.7 * mlScore + 0.3 * businessScore;
    
    // Boost pour les très grosses réductions
    const megaDealBoost = discountPercentage > 70 ? 0.2 : 0;
    
    const isAnomaly = finalScore + megaDealBoost > 0.5 && 
                      businessRules.minDiscountMet &&
                      businessRules.priceInRange;

    // Calcul de la confiance
    let confidence = mlPrediction.anomalyProbability;
    if (features.zScore < -3) confidence = Math.min(confidence + 0.2, 1);
    if (discountPercentage > 60) confidence = Math.min(confidence + 0.15, 1);
    if (!businessRules.notTooFar) confidence *= 0.8;

    return {
      isAnomaly,
      score: finalScore + megaDealBoost,
      confidence,
      normalPrice: mlPrediction.predictedNormalPrice,
      discountPercentage,
      features,
      mlPrediction
    };
  }

  /**
   * Détection simple sans ML (fallback)
   */
  private async simpleAnomalyDetection(
    priceData: PriceData,
    history: any[]
  ): Promise<AnomalyResult> {
    const prices = history.map(h => h.price);
    
    if (prices.length === 0) {
      return {
        isAnomaly: false,
        score: 0,
        confidence: 0,
        normalPrice: priceData.price,
        discountPercentage: 0,
        features: {} as AnomalyFeatures,
        mlPrediction: {} as MLPrediction
      };
    }

    const median = this.calculateMedian(prices);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const normalPrice = median > 0 ? median : mean;
    
    const discountPercentage = ((normalPrice - priceData.price) / normalPrice) * 100;
    const isAnomaly = discountPercentage >= this.minDiscountPercentage;
    
    return {
      isAnomaly,
      score: isAnomaly ? 0.7 : 0.3,
      confidence: 0.6,
      normalPrice,
      discountPercentage,
      features: {
        priceRatio: priceData.price / normalPrice,
        zScore: 0,
        dayOfWeek: priceData.departureDate.getDay(),
        daysUntilDeparture: differenceInDays(priceData.departureDate, new Date()),
        tripDuration: differenceInDays(priceData.returnDate, priceData.departureDate),
        seasonalFactor: 1,
        historicalMin: Math.min(...prices),
        historicalMax: Math.max(...prices),
        historicalMedian: median,
        priceVariance: 0,
        recentTrend: 0
      },
      mlPrediction: {
        isolationScore: 0,
        predictedNormalPrice: normalPrice,
        anomalyProbability: isAnomaly ? 0.7 : 0.3,
        confidenceInterval: [normalPrice * 0.8, normalPrice * 1.2]
      }
    };
  }

  /**
   * Sauvegarder une anomalie détectée
   */
  private async saveAnomaly(priceData: PriceData, result: AnomalyResult): Promise<void> {
    const expiresAt = addHours(new Date(), config.business.alertExpiryHours);

    const query = `
      INSERT INTO anomalies (
        route_id, price_history_id, normal_price, detected_price,
        discount_percentage, anomaly_score, ml_confidence,
        isolation_forest_score, z_score, status, expires_at, ml_features
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const values = [
      priceData.routeId,
      priceData.id,
      result.normalPrice,
      priceData.price,
      result.discountPercentage,
      result.score,
      result.confidence,
      result.mlPrediction.isolationScore,
      result.features.zScore,
      'detected',
      expiresAt,
      JSON.stringify(result.features)
    ];

    try {
      const res = await this.db.query(query, values);
      logger.info(`✈️ Anomalie détectée et sauvegardée: ${res.rows[0].id} - ${result.discountPercentage.toFixed(0)}% de réduction!`);
      
      // Invalider le cache des métriques
      await redis.del('dashboard_metrics:anomalies_count');
      
      // Publier l'événement pour notification immédiate
      await redis.publish('anomaly:detected', JSON.stringify({
        anomalyId: res.rows[0].id,
        routeId: priceData.routeId,
        discount: result.discountPercentage,
        price: priceData.price
      }));
    } catch (error) {
      logger.error('Erreur sauvegarde anomalie:', error);
      throw error;
    }
  }

  /**
   * Récupérer l'historique des prix pour une route
   */
  private async getPriceHistory(
    routeId: string,
    departureDate: Date,
    returnDate: Date
  ): Promise<any[]> {
    const cacheKey = `price_history:${routeId}:${format(departureDate, 'yyyy-MM')}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Récupérer les prix similaires (même mois de départ, durée similaire)
    const query = `
      SELECT 
        price, currency, departure_date, return_date, 
        airline, created_at, trip_duration
      FROM price_history
      WHERE route_id = $1
        AND EXTRACT(MONTH FROM departure_date) = EXTRACT(MONTH FROM $2::date)
        AND trip_duration BETWEEN $3 - 3 AND $3 + 3
        AND created_at > NOW() - INTERVAL '90 days'
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const tripDuration = differenceInDays(returnDate, departureDate);
    const result = await this.db.query(query, [routeId, departureDate, tripDuration]);
    
    // Cache pour 4 heures
    await redis.setex(cacheKey, 14400, JSON.stringify(result.rows));
    
    return result.rows;
  }

  /**
   * Vérifier une anomalie avec une API tierce (TravelPayout)
   */
  async verifyAnomaly(anomalyId: string): Promise<boolean> {
    try {
      const anomaly = await this.db.query(
        'SELECT * FROM anomalies WHERE id = $1',
        [anomalyId]
      );

      if (anomaly.rows.length === 0) {
        return false;
      }

      // TODO: Implémenter la vérification avec TravelPayout
      // Pour l'instant, on simule une vérification réussie
      const verified = Math.random() > 0.2; // 80% de vérifications réussies

      await this.db.query(
        'UPDATE anomalies SET status = $1, verified_at = NOW() WHERE id = $2',
        [verified ? 'verified' : 'false_positive', anomalyId]
      );

      return verified;
    } catch (error) {
      logger.error('Erreur vérification anomalie:', error);
      return false;
    }
  }

  // Méthodes utilitaires
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private calculateSeasonalFactor(date: Date): number {
    const month = date.getMonth();
    // Haute saison été (juin-août) et fêtes (décembre)
    if (month >= 5 && month <= 7) return 1.3;
    if (month === 11) return 1.4;
    // Basse saison
    if (month === 1 || month === 10) return 0.8;
    return 1;
  }
}