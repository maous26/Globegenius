import cron from 'node-cron';
import Bull from 'bull';
import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { config } from '../config';
import { connectDatabase } from '../database/connection';
import { RouteOptimizer } from '../services/routeOptimizer';
import { PriceScanner } from '../services/priceScanner';
import { AlertService } from '../services/alertService';
import { redis } from '../services/redis';

// Queues Bull pour les jobs asynchrones
const scanQueue = new Bull('price-scanning', config.redis.url);
const alertQueue = new Bull('alert-sending', config.redis.url);
const optimizationQueue = new Bull('route-optimization', config.redis.url);
const cleanupQueue = new Bull('data-cleanup', config.redis.url);

// Services
let routeOptimizer: RouteOptimizer;
let priceScanner: PriceScanner;
let alertServiceInstance: AlertService;

/**
 * Initialiser tous les jobs et workers
 */
export async function initializeJobs(): Promise<void> {
  const db = await connectDatabase.getPool();
  
  // Initialiser les services
  routeOptimizer = new RouteOptimizer(db);
  priceScanner = new PriceScanner(db);
  alertServiceInstance = new AlertService(db);

  // Configurer les workers
  setupWorkers();

  // Configurer les cron jobs
  setupCronJobs();

  // Listener pour les événements Redis
  setupEventListeners();

  logger.info('✅ Jobs et workers initialisés');
}

/**
 * Configurer les workers Bull
 */
function setupWorkers(): void {
  // Worker de scan de prix
  scanQueue.process('scan-route', 5, async (job) => {
    const { routeId } = job.data;
    logger.info(`🔍 Scan de la route ${routeId}`);
    
    try {
      await priceScanner.scanRoute(routeId);
      return { status: 'completed', routeId };
    } catch (error) {
      logger.error(`Erreur scan route ${routeId}:`, error);
      throw error;
    }
  });

  // Worker d'envoi d'alertes
  alertQueue.process('send-anomaly-alerts', 10, async (job) => {
    const { anomalyId } = job.data;
    logger.info(`📧 Envoi des alertes pour l'anomalie ${anomalyId}`);
    
    try {
      await alertServiceInstance.sendAnomalyAlerts(anomalyId);
      return { status: 'completed', anomalyId };
    } catch (error) {
      logger.error(`Erreur envoi alertes ${anomalyId}:`, error);
      throw error;
    }
  });

  // Worker d'optimisation des routes
  optimizationQueue.process('optimize-routes', async (job) => {
    logger.info('🎯 Optimisation des routes en cours...');
    
    try {
      const result = await routeOptimizer.optimizeRouteAllocation();
      return { 
        status: 'completed', 
        reallocations: result.reallocations.length,
        estimatedCalls: result.estimatedMonthlyCalls 
      };
    } catch (error) {
      logger.error('Erreur optimisation routes:', error);
      throw error;
    }
  });

  // Worker de nettoyage
  cleanupQueue.process('cleanup-old-data', async (job) => {
    logger.info('🧹 Nettoyage des données anciennes...');
    
    try {
      const result = await cleanupOldData();
      return { status: 'completed', ...result };
    } catch (error) {
      logger.error('Erreur nettoyage:', error);
      throw error;
    }
  });

  // Gestion des erreurs et événements
  [scanQueue, alertQueue, optimizationQueue, cleanupQueue].forEach(queue => {
    queue.on('completed', (job, result) => {
      logger.info(`✅ Job ${job.name} complété:`, result);
    });

    queue.on('failed', (job, err) => {
      logger.error(`❌ Job ${job.name} échoué:`, err);
    });

    queue.on('stalled', (job) => {
      logger.warn(`⚠️ Job ${job.name} bloqué`);
    });
  });
}

/**
 * Configurer les tâches cron
 */
function setupCronJobs(): void {
  // Scan continu des routes (toutes les 30 minutes)
  cron.schedule('*/30 * * * *', async () => {
    logger.info('⏰ Démarrage du scan périodique des routes');
    
    try {
      // Vérifier le quota API
      const usage = await routeOptimizer.getMonthlyApiUsage();
      const remaining = config.limits.api.monthlyLimit - usage;
      
      if (remaining < 100) {
        logger.warn('Quota API trop bas, scan annulé');
        return;
      }

      // Récupérer les routes à scanner
      const routes = await routeOptimizer.getNextRoutesToScan(10);
      
      // Ajouter les jobs de scan
      for (const route of routes) {
        await scanQueue.add('scan-route', {
          routeId: route.id
        }, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: true,
          removeOnFail: false
        });
        
        // Mettre à jour le statut
        await routeOptimizer.updateRouteAfterScan(route.id, true);
      }
      
      logger.info(`📋 ${routes.length} routes ajoutées à la queue de scan`);
    } catch (error) {
      logger.error('Erreur scan périodique:', error);
    }
  });

  // Optimisation des routes (tous les jours à 3h)
  cron.schedule('0 3 * * *', async () => {
    logger.info('⏰ Optimisation quotidienne des routes');
    
    await optimizationQueue.add('optimize-routes', {}, {
      attempts: 1,
      removeOnComplete: true
    });
  });

  // Envoi des digests quotidiens (tous les jours à 8h)
  cron.schedule('0 8 * * *', async () => {
    logger.info('⏰ Envoi des digests quotidiens');
    
    try {
      const db = await connectDatabase.getPool();
      const users = await db.query(`
        SELECT id FROM users 
        WHERE email_verified = true 
          AND (preferences->>'alert_frequency')::text = 'daily'
          AND status != 'free'
      `);
      
      for (const user of users.rows) {
        await alertQueue.add('send-digest', {
          userId: user.id,
          frequency: 'daily'
        }, {
          delay: Math.random() * 3600000, // Étaler sur 1h
          attempts: 2
        });
      }
      
      logger.info(`📊 ${users.rows.length} digests quotidiens programmés`);
    } catch (error) {
      logger.error('Erreur programmation digests:', error);
    }
  });

  // Envoi des digests hebdomadaires (tous les lundis à 9h)
  cron.schedule('0 9 * * 1', async () => {
    logger.info('⏰ Envoi des digests hebdomadaires');
    
    try {
      const db = await connectDatabase.getPool();
      const users = await db.query(`
        SELECT id FROM users 
        WHERE email_verified = true 
          AND (preferences->>'alert_frequency')::text = 'weekly'
      `);
      
      for (const user of users.rows) {
        await alertQueue.add('send-digest', {
          userId: user.id,
          frequency: 'weekly'
        }, {
          delay: Math.random() * 7200000, // Étaler sur 2h
          attempts: 2
        });
      }
      
      logger.info(`📊 ${users.rows.length} digests hebdomadaires programmés`);
    } catch (error) {
      logger.error('Erreur programmation digests hebdo:', error);
    }
  });

  // Nettoyage des données (tous les jours à 4h)
  cron.schedule('0 4 * * *', async () => {
    logger.info('⏰ Nettoyage quotidien des données');
    
    await cleanupQueue.add('cleanup-old-data', {}, {
      attempts: 1,
      removeOnComplete: true
    });
  });

  // Calcul des métriques quotidiennes (tous les jours à 1h)
  cron.schedule('0 1 * * *', async () => {
    logger.info('⏰ Calcul des métriques quotidiennes');
    
    try {
      await calculateDailyMetrics();
    } catch (error) {
      logger.error('Erreur calcul métriques:', error);
    }
  });

  // Rafraîchissement du cache des métriques (toutes les 5 minutes)
  cron.schedule('*/5 * * * *', async () => {
    try {
      const db = await connectDatabase.getPool();
      await db.query('REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics');
      logger.debug('📊 Vue matérialisée rafraîchie');
    } catch (error) {
      logger.error('Erreur refresh metrics:', error);
    }
  });

  logger.info('✅ Cron jobs configurés');
}

/**
 * Configurer les listeners d'événements Redis
 */
function setupEventListeners(): void {
  const subscriber = redis.duplicate();
  
  subscriber.on('message', async (channel, message) => {
    try {
      const data = JSON.parse(message);
      
      switch (channel) {
        case 'anomaly:detected':
          // Nouvelle anomalie détectée, envoyer les alertes
          await alertQueue.add('send-anomaly-alerts', {
            anomalyId: data.anomalyId
          }, {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000
            }
          });
          break;
          
        case 'price:anomaly':
          // Log pour monitoring
          logger.info(`🎯 Anomalie prix: ${data.route} à ${data.price}€ (-${data.discount}%)`);
          break;
          
        default:
          logger.debug(`Message reçu sur ${channel}:`, data);
      }
    } catch (error) {
      logger.error('Erreur traitement message Redis:', error);
    }
  });

  subscriber.subscribe('anomaly:detected', 'price:anomaly');
  logger.info('✅ Listeners Redis configurés');
}

/**
 * Nettoyer les données anciennes
 */
async function cleanupOldData(): Promise<any> {
  const db = await connectDatabase.getPool();
  const results = {
    priceHistory: 0,
    expiredAnomalies: 0,
    oldAlerts: 0,
    apiCalls: 0
  };

  try {
    // Nettoyer l'historique des prix > 180 jours
    const ph = await db.query(`
      DELETE FROM price_history 
      WHERE created_at < NOW() - INTERVAL '180 days'
    `);
    results.priceHistory = ph.rowCount || 0;

    // Nettoyer les anomalies expirées > 30 jours
    const an = await db.query(`
      DELETE FROM anomalies 
      WHERE expires_at < NOW() - INTERVAL '30 days'
    `);
    results.expiredAnomalies = an.rowCount || 0;

    // Nettoyer les alertes > 90 jours
    const al = await db.query(`
      DELETE FROM alerts 
      WHERE created_at < NOW() - INTERVAL '90 days'
    `);
    results.oldAlerts = al.rowCount || 0;

    // Nettoyer les logs API > 30 jours
    const ac = await db.query(`
      DELETE FROM api_calls 
      WHERE created_at < NOW() - INTERVAL '30 days'
    `);
    results.apiCalls = ac.rowCount || 0;

    logger.info('🧹 Nettoyage terminé:', results);
    return results;
  } catch (error) {
    logger.error('Erreur nettoyage données:', error);
    throw error;
  }
}

/**
 * Calculer les métriques quotidiennes
 */
async function calculateDailyMetrics(): Promise<void> {
  const db = await connectDatabase.getPool();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  try {
    await db.query('SELECT calculate_daily_metrics($1)', [yesterday]);
    logger.info(`📊 Métriques calculées pour ${yesterday.toISOString().split('T')[0]}`);
  } catch (error) {
    logger.error('Erreur calcul métriques quotidiennes:', error);
    throw error;
  }
}

/**
 * Arrêt propre des jobs
 */
export async function shutdownJobs(): Promise<void> {
  logger.info('Arrêt des jobs...');
  
  // Arrêter les cron jobs
  cron.getTasks().forEach((task) => task.stop());
  
  // Fermer les queues Bull
  await Promise.all([
    scanQueue.close(),
    alertQueue.close(),
    optimizationQueue.close(),
    cleanupQueue.close()
  ]);
  
  logger.info('✅ Jobs arrêtés proprement');
}