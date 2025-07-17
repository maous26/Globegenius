import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { config, ROUTE_CONFIGURATIONS } from '../config';
import { redis } from './redis';
// import { mlService } from './mlService';
import { differenceInMinutes, addMinutes, startOfMonth } from 'date-fns';

interface Route {
  id: string;
  origin: string;
  destination: string;
  tier: '1' | '2' | '3';
  scanFrequency: number;
  lastScanAt: Date | null;
  nextScanAt: Date | null;
  priorityScore: number;
  detectionRate: number;
  monthlyCallsUsed: number;
  isActive: boolean;
}

interface RoutePerformance {
  routeId: string;
  detectionRate: number;
  avgDiscount: number;
  userInterest: number;
  revenueGenerated: number;
  score: number;
}

interface OptimizationResult {
  reallocations: Array<{
    routeId: string;
    oldTier: string;
    newTier: string;
    reason: string;
  }>;
  newSchedule: Map<string, Date>;
  estimatedMonthlyCalls: number;
}

export class RouteOptimizer {
  private db: Pool;
  private monthlyLimit: number;
  private bufferPercentage: number;

  constructor(database: Pool) {
    this.db = database;
    this.monthlyLimit = config.limits.api.monthlyLimit;
    this.bufferPercentage = config.limits.api.bufferPercentage;
  }

  /**
   * Obtenir les prochaines routes à scanner selon la priorité et les quotas
   */
  async getNextRoutesToScan(limit: number = 10): Promise<Route[]> {
    const cacheKey = 'routes:next_scan';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      // Vérifier d'abord le quota mensuel
      const monthlyUsage = await this.getMonthlyApiUsage();
      const remaining = this.monthlyLimit - monthlyUsage;
      
      if (remaining < this.monthlyLimit * 0.05) {
        logger.warn(`API quota critique: ${remaining} appels restants`);
        // Ne scanner que les routes Tier 1 en mode économie
        const query = `
          SELECT * FROM routes 
          WHERE is_active = true 
            AND tier = '1'
            AND (next_scan_at IS NULL OR next_scan_at <= NOW())
          ORDER BY priority_score DESC, last_scan_at ASC NULLS FIRST
          LIMIT $1
        `;
        const result = await this.db.query(query, [Math.min(limit, 5)]);
        return result.rows;
      }

      // Sélection normale avec priorité
      const query = `
        WITH route_scores AS (
          SELECT 
            r.*,
            CASE 
              WHEN r.last_scan_at IS NULL THEN 1000
              ELSE EXTRACT(EPOCH FROM (NOW() - r.last_scan_at)) / 3600
            END as hours_since_scan,
            COALESCE(
              (SELECT COUNT(*) FROM anomalies WHERE route_id = r.id AND detected_at > NOW() - INTERVAL '7 days'),
              0
            ) as recent_anomalies
          FROM routes r
          WHERE r.is_active = true
        )
        SELECT * FROM route_scores
        WHERE next_scan_at IS NULL OR next_scan_at <= NOW()
        ORDER BY 
          tier ASC,
          priority_score DESC,
          hours_since_scan DESC
        LIMIT $1
      `;

      const result = await this.db.query(query, [limit]);
      const routes = result.rows;

      // Mettre en cache pour 1 minute
      await redis.setex(cacheKey, 60, JSON.stringify(routes));

      return routes;
    } catch (error) {
      logger.error('Erreur lors de la récupération des routes:', error);
      throw error;
    }
  }

  /**
   * Optimiser dynamiquement l'allocation des routes selon les performances
   */
  async optimizeRouteAllocation(): Promise<OptimizationResult> {
    logger.info('Début de l\'optimisation des routes');

    try {
      // 1. Calculer les performances de toutes les routes
      const performances = await this.calculateRoutePerformances();

      // 2. Trier par score de performance
      performances.sort((a, b) => b.score - a.score);

      // 3. Réallouer les tiers
      const reallocations: OptimizationResult['reallocations'] = [];
      const newSchedule = new Map<string, Date>();

      // Top 20 → Tier 1
      const newTier1 = performances.slice(0, 20);
      // Next 25 → Tier 2  
      const newTier2 = performances.slice(20, 45);
      // Next 15 → Tier 3
      const newTier3 = performances.slice(45, 60);

      // 4. Détecter les changements
      for (const perf of newTier1) {
        const route = await this.getRouteById(perf.routeId);
        if (route.tier !== '1') {
          reallocations.push({
            routeId: perf.routeId,
            oldTier: route.tier,
            newTier: '1',
            reason: `Performance élevée: score ${perf.score.toFixed(2)}`
          });
        }
      }

      // 5. Calculer le nouveau planning
      const now = new Date();
      let estimatedCalls = 0;

      // Tier 1: 6 scans/jour
      for (const route of newTier1) {
        const nextScan = addMinutes(now, config.scanning.frequencies.tier1);
        newSchedule.set(route.routeId, nextScan);
        estimatedCalls += 30 * 6; // 30 jours * 6 scans/jour
      }

      // Tier 2: 4 scans/jour
      for (const route of newTier2) {
        const nextScan = addMinutes(now, config.scanning.frequencies.tier2);
        newSchedule.set(route.routeId, nextScan);
        estimatedCalls += 30 * 4;
      }

      // Tier 3: 2 scans/jour
      for (const route of newTier3) {
        const nextScan = addMinutes(now, config.scanning.frequencies.tier3);
        newSchedule.set(route.routeId, nextScan);
        estimatedCalls += 30 * 2;
      }

      // 6. Appliquer les changements si dans les limites
      if (estimatedCalls <= this.monthlyLimit * (1 - this.bufferPercentage)) {
        await this.applyReallocations(reallocations, newSchedule);
        logger.info(`Optimisation terminée: ${reallocations.length} réallocations, ${estimatedCalls} appels/mois estimés`);
      } else {
        logger.warn(`Optimisation annulée: ${estimatedCalls} appels dépassent la limite`);
      }

      return {
        reallocations,
        newSchedule,
        estimatedMonthlyCalls: estimatedCalls
      };
    } catch (error) {
      logger.error('Erreur lors de l\'optimisation:', error);
      throw error;
    }
  }

  /**
   * Calculer le score de performance pour chaque route
   */
  private async calculateRoutePerformances(): Promise<RoutePerformance[]> {
    const query = `
      WITH route_stats AS (
        SELECT 
          r.id as route_id,
          r.origin,
          r.destination,
          r.detection_rate,
          COUNT(DISTINCT an.id) as anomalies_30d,
          AVG(an.discount_percentage) as avg_discount,
          COUNT(DISTINCT al.user_id) as interested_users,
          SUM(CASE WHEN al.converted THEN al.booking_value ELSE 0 END) as revenue
        FROM routes r
        LEFT JOIN anomalies an ON r.id = an.route_id 
          AND an.detected_at > NOW() - INTERVAL '30 days'
        LEFT JOIN alerts al ON an.id = al.anomaly_id
        GROUP BY r.id, r.origin, r.destination, r.detection_rate
      )
      SELECT 
        route_id,
        origin,
        destination,
        COALESCE(anomalies_30d, 0) as anomaly_count,
        COALESCE(avg_discount, 0) as avg_discount,
        COALESCE(interested_users, 0) as user_interest,
        COALESCE(revenue, 0) as revenue_generated,
        detection_rate
      FROM route_stats
    `;

    const result = await this.db.query(query);
    
    // Calculer le score composite pour chaque route
    return result.rows.map(row => {
      // Normaliser les métriques (0-1)
      const normalizedDetection = Math.min(row.anomaly_count / 10, 1); // Max 10 anomalies/mois
      const normalizedDiscount = row.avg_discount / 100; // Pourcentage → 0-1
      const normalizedInterest = Math.min(row.user_interest / 100, 1); // Max 100 users
      const normalizedRevenue = Math.min(row.revenue_generated / 1000, 1); // Max 1000€
      
      // Score pondéré
      const score = (
        0.35 * normalizedDetection +    // Taux de détection
        0.25 * normalizedDiscount +      // Qualité des deals
        0.25 * normalizedInterest +      // Intérêt utilisateurs
        0.15 * normalizedRevenue         // Revenue généré
      );

      // Boost saisonnier
      const seasonalBoost = this.getSeasonalBoost(row.origin, row.destination);
      
      return {
        routeId: row.route_id,
        detectionRate: row.detection_rate,
        avgDiscount: row.avg_discount,
        userInterest: row.user_interest,
        revenueGenerated: row.revenue_generated,
        score: score * (1 + seasonalBoost)
      };
    });
  }

  /**
   * Calculer le boost saisonnier pour une route
   */
  private getSeasonalBoost(origin: string, destination: string): number {
    const now = new Date();
    const month = now.getMonth();
    
    // Destinations été (mai-septembre)
    const summerDestinations = ['PMI', 'IBZ', 'HER', 'RHO', 'DBV', 'SPU', 'NCE', 'NAP'];
    if (month >= 4 && month <= 8 && summerDestinations.includes(destination)) {
      return 0.3; // +30% boost
    }
    
    // Destinations hiver (décembre-mars)
    const winterDestinations = ['GVA', 'ZRH', 'INN', 'MUC', 'VIE'];
    if ((month >= 11 || month <= 2) && winterDestinations.includes(destination)) {
      return 0.25; // +25% boost
    }
    
    // Long-courrier fêtes (novembre-janvier)
    const holidayLongHaul = ['JFK', 'LAX', 'DXB', 'BKK', 'NRT'];
    if ((month >= 10 || month <= 0) && holidayLongHaul.includes(destination)) {
      return 0.2; // +20% boost
    }
    
    return 0;
  }

  /**
   * Mettre à jour le statut après un scan
   */
  async updateRouteAfterScan(routeId: string, success: boolean): Promise<void> {
    const now = new Date();
    
    try {
      // Récupérer la route
      const route = await this.getRouteById(routeId);
      
      // Calculer le prochain scan
      const scanFrequency = this.getScanFrequency(route.tier);
      const nextScan = addMinutes(now, scanFrequency);
      
      // Mettre à jour
      const query = `
        UPDATE routes 
        SET 
          last_scan_at = $1,
          next_scan_at = $2,
          total_scans = total_scans + 1,
          monthly_calls = monthly_calls + 1,
          updated_at = NOW()
        WHERE id = $3
      `;
      
      await this.db.query(query, [now, nextScan, routeId]);
      
      // Invalider le cache
      await redis.del('routes:next_scan');
      
      logger.debug(`Route ${routeId} mise à jour après scan`);
    } catch (error) {
      logger.error(`Erreur mise à jour route ${routeId}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir l'usage API du mois en cours
   */
  async getMonthlyApiUsage(): Promise<number> {
    const cacheKey = 'metrics:api_usage:monthly';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return parseInt(cached);
    }

    const query = `
      SELECT COUNT(*) as total
      FROM api_calls
      WHERE created_at >= DATE_TRUNC('month', NOW())
        AND api_name = 'flightlabs'
    `;
    
    const result = await this.db.query(query);
    const usage = parseInt(result.rows[0].total);
    
    // Cache pour 5 minutes
    await redis.setex(cacheKey, 300, usage.toString());
    
    return usage;
  }

  /**
   * Initialiser les routes au démarrage
   */
  async initializeRoutes(): Promise<void> {
    logger.info('Initialisation des routes...');
    
    try {
      // Parcourir toutes les configurations de routes
      for (const [tier, config] of Object.entries(ROUTE_CONFIGURATIONS)) {
        for (const route of config.routes) {
          await this.db.query(`
            INSERT INTO routes (origin, destination, tier, scan_frequency, priority_score, passenger_volume)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (origin, destination) 
            DO UPDATE SET 
              tier = EXCLUDED.tier,
              scan_frequency = EXCLUDED.scan_frequency,
              passenger_volume = EXCLUDED.passenger_volume
          `, [
            route.origin,
            route.destination,
            tier.replace('tier', ''),
            config.scanFrequency,
            0.5, // Score initial
            route.avgVolume || 0
          ]);
        }
      }
      
      logger.info('Routes initialisées avec succès');
    } catch (error) {
      logger.error('Erreur initialisation routes:', error);
      throw error;
    }
  }

  // Méthodes utilitaires privées
  private async getRouteById(id: string): Promise<Route> {
    const result = await this.db.query('SELECT * FROM routes WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new Error(`Route ${id} non trouvée`);
    }
    return result.rows[0];
  }

  private getScanFrequency(tier: string): number {
    switch (tier) {
      case '1': return config.scanning.frequencies.tier1;
      case '2': return config.scanning.frequencies.tier2;
      case '3': return config.scanning.frequencies.tier3;
      default: return config.scanning.frequencies.tier3;
    }
  }

  private async applyReallocations(
    reallocations: OptimizationResult['reallocations'],
    newSchedule: Map<string, Date>
  ): Promise<void> {
    // Transaction pour appliquer tous les changements
    const client = await this.db.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const realloc of reallocations) {
        await client.query(
          'UPDATE routes SET tier = $1, updated_at = NOW() WHERE id = $2',
          [realloc.newTier, realloc.routeId]
        );
      }
      
      for (const [routeId, nextScan] of newSchedule) {
        await client.query(
          'UPDATE routes SET next_scan_at = $1 WHERE id = $2',
          [nextScan, routeId]
        );
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}