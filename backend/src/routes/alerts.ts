import { Router } from 'express';
import Joi from 'joi';
import { Pool } from 'pg';
import { connectDatabase } from '../database/connection';
import { logger } from '../utils/logger';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { redis } from '../services/redis';

const router = Router();

// Schémas de validation
const preferencesSchema = Joi.object({
  destinations: Joi.array().items(Joi.string().length(3).uppercase()).max(10).optional(),
  maxPrice: Joi.number().min(0).max(10000).optional(),
  travelTypes: Joi.array().items(Joi.string().valid('leisure', 'business', 'family')).optional(),
  advanceDays: Joi.number().min(7).max(365).optional(),
  flexibleDates: Joi.boolean().optional(),
  errorDetectionEnabled: Joi.boolean().optional(),
  alertFrequency: Joi.string().valid('immediate', 'daily', 'weekly').optional(),
  language: Joi.string().valid('fr', 'en').optional()
});

const feedbackSchema = Joi.object({
  useful: Joi.boolean().required(),
  reason: Joi.string().valid('not_interested', 'too_expensive', 'bad_dates', 'already_booked', 'other').optional(),
  comment: Joi.string().max(500).optional()
});

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Type guard pour vérifier que req.user existe
function ensureAuthenticated(req: any): asserts req is { user: { userId: string; email: string; status: string } } {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
}

/**
 * GET /api/alerts
 * Récupérer les alertes de l'utilisateur
 */
router.get('/', async (req, res, next) => {
  try {
    ensureAuthenticated(req);
    const userId = req.user.userId;
    const { status = 'active', limit = 50, offset = 0 } = req.query;
    
    const db = await connectDatabase.getPool();
    
    // Requête selon le statut demandé
    let query: string;
    let params: any[];
    
    if (status === 'active') {
      // Alertes actives (anomalies non expirées)
      query = `
        SELECT 
          al.id,
          al.sent_at,
          al.opened_at,
          al.clicked_at,
          an.discount_percentage,
          an.detected_price as price,
          an.normal_price as original_price,
          an.expires_at,
          ph.departure_date,
          ph.return_date,
          ph.airline,
          CONCAT(r.origin, ' → ', r.destination) as route
        FROM alerts al
        JOIN anomalies an ON al.anomaly_id = an.id
        JOIN price_history ph ON an.price_history_id = ph.id
        JOIN routes r ON an.route_id = r.id
        WHERE al.user_id = $1
          AND an.expires_at > NOW()
        ORDER BY al.sent_at DESC
        LIMIT $2 OFFSET $3
      `;
      params = [userId, limit, offset];
    } else {
      // Historique complet
      query = `
        SELECT 
          al.id,
          al.sent_at,
          al.opened_at,
          al.clicked_at,
          al.converted,
          an.discount_percentage,
          an.detected_price as price,
          an.normal_price as original_price,
          an.expires_at,
          ph.departure_date,
          ph.return_date,
          ph.airline,
          CONCAT(r.origin, ' → ', r.destination) as route
        FROM alerts al
        JOIN anomalies an ON al.anomaly_id = an.id
        JOIN price_history ph ON an.price_history_id = ph.id
        JOIN routes r ON an.route_id = r.id
        WHERE al.user_id = $1
        ORDER BY al.sent_at DESC
        LIMIT $2 OFFSET $3
      `;
      params = [userId, limit, offset];
    }
    
    const result = await db.query(query, params);
    
    // Compter le total
    const countResult = await db.query(
      'SELECT COUNT(*) FROM alerts WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      alerts: result.rows.map(formatAlert),
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts/preferences
 * Récupérer les préférences d'alertes
 */
router.get('/preferences', async (req, res, next) => {
  try {
    ensureAuthenticated(req);
    const userId = req.user.userId;
    
    const db = await connectDatabase.getPool();
    const result = await db.query(
      'SELECT preferences, departure_airport, secondary_airports FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    const preferences = user.preferences || {};
    
    res.json({
      departureAirport: user.departure_airport,
      secondaryAirports: user.secondary_airports || [],
      ...preferences
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/alerts/preferences
 * Mettre à jour les préférences d'alertes
 */
router.put('/preferences', validateRequest(preferencesSchema), async (req, res, next) => {
  try {
    ensureAuthenticated(req);
    const userId = req.user.userId;
    const updates = req.body;
    
    const db = await connectDatabase.getPool();
    
    // Récupérer les préférences actuelles
    const currentResult = await db.query(
      'SELECT preferences FROM users WHERE id = $1',
      [userId]
    );
    
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentPrefs = currentResult.rows[0].preferences || {};
    const newPrefs = { ...currentPrefs, ...updates };
    
    // Mettre à jour
    await db.query(
      'UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(newPrefs), userId]
    );
    
    // Invalider le cache
    await redis.del(`user:${userId}:preferences`);
    
    // Log l'événement
    await logUserEvent(userId, 'preferences_updated', { 
      changes: Object.keys(updates) 
    });
    
    res.json({
      message: 'Preferences updated successfully',
      preferences: newPrefs
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/alerts/:id/open
 * Marquer une alerte comme ouverte
 */
router.post('/:id/open', async (req, res, next) => {
  try {
    ensureAuthenticated(req);
    const userId = req.user.userId;
    const alertId = req.params.id;
    
    const db = await connectDatabase.getPool();
    
    // Vérifier que l'alerte appartient à l'utilisateur
    const check = await db.query(
      'SELECT id FROM alerts WHERE id = $1 AND user_id = $2',
      [alertId, userId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    // Marquer comme ouverte
    await db.query(
      'UPDATE alerts SET opened_at = COALESCE(opened_at, NOW()) WHERE id = $1',
      [alertId]
    );
    
    res.json({ message: 'Alert marked as opened' });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/alerts/:id/click
 * Marquer une alerte comme cliquée
 */
router.post('/:id/click', async (req, res, next) => {
  try {
    ensureAuthenticated(req);
    const userId = req.user.userId;
    const alertId = req.params.id;
    
    const db = await connectDatabase.getPool();
    
    // Vérifier et mettre à jour
    const result = await db.query(`
      UPDATE alerts 
      SET 
        clicked_at = COALESCE(clicked_at, NOW()),
        opened_at = COALESCE(opened_at, NOW())
      WHERE id = $1 AND user_id = $2
      RETURNING anomaly_id
    `, [alertId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    // Récupérer le lien de réservation
    const anomalyId = result.rows[0].anomaly_id;
    const booking = await db.query(`
      SELECT ph.raw_data->>'deepLink' as deep_link
      FROM anomalies a
      JOIN price_history ph ON a.price_history_id = ph.id
      WHERE a.id = $1
    `, [anomalyId]);
    
    const bookingUrl = booking.rows[0]?.deep_link || generateBookingUrl(anomalyId);
    
    res.json({ 
      message: 'Alert marked as clicked',
      bookingUrl 
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/alerts/:id/feedback
 * Donner un feedback sur une alerte
 */
router.post('/:id/feedback', validateRequest(feedbackSchema), async (req, res, next) => {
  try {
    ensureAuthenticated(req);
    const userId = req.user.userId;
    const alertId = req.params.id;
    const { useful, reason, comment } = req.body;
    
    const db = await connectDatabase.getPool();
    
    // Vérifier que l'alerte appartient à l'utilisateur
    const check = await db.query(
      'SELECT anomaly_id FROM alerts WHERE id = $1 AND user_id = $2',
      [alertId, userId]
    );
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    const anomalyId = check.rows[0].anomaly_id;
    
    // Enregistrer le feedback
    await db.query(`
      INSERT INTO user_events (user_id, event_type, event_data)
      VALUES ($1, 'alert_feedback', $2)
    `, [
      userId,
      JSON.stringify({
        alertId,
        anomalyId,
        useful,
        reason,
        comment
      })
    ]);
    
    // Si feedback négatif sur une anomalie, mettre à jour son statut
    if (!useful && reason === 'not_interested') {
      await db.query(
        'UPDATE anomalies SET status = $1 WHERE id = $2',
        ['false_positive', anomalyId]
      );
    }
    
    res.json({ message: 'Feedback recorded successfully' });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts/stats
 * Statistiques des alertes de l'utilisateur
 */
router.get('/stats', async (req, res, next) => {
  try {
    ensureAuthenticated(req);
    const userId = req.user.userId;
    
    const db = await connectDatabase.getPool();
    
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_alerts,
        COUNT(opened_at) as opened_alerts,
        COUNT(clicked_at) as clicked_alerts,
        COUNT(CASE WHEN converted THEN 1 END) as conversions,
        AVG(an.discount_percentage) as avg_discount,
        SUM(an.normal_price - an.detected_price) as total_savings
      FROM alerts al
      JOIN anomalies an ON al.anomaly_id = an.id
      WHERE al.user_id = $1
        AND al.sent_at > NOW() - INTERVAL '30 days'
    `, [userId]);
    
    const topRoutes = await db.query(`
      SELECT 
        CONCAT(r.origin, ' → ', r.destination) as route,
        COUNT(*) as alert_count,
        AVG(an.discount_percentage) as avg_discount
      FROM alerts al
      JOIN anomalies an ON al.anomaly_id = an.id
      JOIN routes r ON an.route_id = r.id
      WHERE al.user_id = $1
        AND al.sent_at > NOW() - INTERVAL '90 days'
      GROUP BY r.origin, r.destination
      ORDER BY alert_count DESC
      LIMIT 5
    `, [userId]);
    
    res.json({
      summary: {
        totalAlerts: parseInt(stats.rows[0].total_alerts),
        openedAlerts: parseInt(stats.rows[0].opened_alerts),
        clickedAlerts: parseInt(stats.rows[0].clicked_alerts),
        conversions: parseInt(stats.rows[0].conversions),
        openRate: stats.rows[0].total_alerts > 0 
          ? (stats.rows[0].opened_alerts / stats.rows[0].total_alerts * 100).toFixed(1) 
          : 0,
        clickRate: stats.rows[0].opened_alerts > 0
          ? (stats.rows[0].clicked_alerts / stats.rows[0].opened_alerts * 100).toFixed(1)
          : 0,
        avgDiscount: parseFloat(stats.rows[0].avg_discount).toFixed(1),
        totalSavings: parseFloat(stats.rows[0].total_savings).toFixed(0)
      },
      topRoutes: topRoutes.rows.map(r => ({
        route: r.route,
        alertCount: parseInt(r.alert_count),
        avgDiscount: parseFloat(r.avg_discount).toFixed(1)
      }))
    });
    
  } catch (error) {
    next(error);
  }
});

// Fonctions utilitaires

function formatAlert(alert: any) {
  return {
    id: alert.id,
    route: alert.route,
    price: parseFloat(alert.price),
    originalPrice: parseFloat(alert.original_price),
    discount: parseFloat(alert.discount_percentage),
    savings: parseFloat(alert.original_price) - parseFloat(alert.price),
    departureDate: alert.departure_date,
    returnDate: alert.return_date,
    airline: alert.airline,
    expiresAt: alert.expires_at,
    sentAt: alert.sent_at,
    isOpened: !!alert.opened_at,
    isClicked: !!alert.clicked_at,
    isConverted: !!alert.converted
  };
}

function generateBookingUrl(anomalyId: string): string {
  // URL de fallback si pas de deepLink
  return `https://www.kayak.fr/flights?aid=${anomalyId}`;
}

async function logUserEvent(userId: string, eventType: string, eventData: any = {}): Promise<void> {
  try {
    const db = await connectDatabase.getPool();
    await db.query(
      'INSERT INTO user_events (user_id, event_type, event_data) VALUES ($1, $2, $3)',
      [userId, eventType, JSON.stringify(eventData)]
    );
  } catch (error) {
    logger.error('Erreur log user event:', error);
  }
}

export default router;