import { Pool } from 'pg';
import { logger } from '../utils/logger';
import { config } from '../config';
import { redis } from './redis';
import { createTransport } from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface AlertData {
  userId: string;
  anomalyId: string;
  route: string;
  price: number;
  originalPrice: number;
  discount: number;
  departureDate: string;
  returnDate: string;
  airline: string;
  expiresAt: string;
  bookingUrl?: string;
}

export class AlertService {
  private db: Pool;
  private emailTransporter: any;

  constructor(database: Pool) {
    this.db = database;
    this.setupEmailTransporter();
  }

  private setupEmailTransporter() {
    // Configuration email selon l'environnement
    if (process.env.NODE_ENV === 'development') {
      // Utiliser Mailhog pour le développement
      this.emailTransporter = createTransport({
        host: config.email?.dev?.host || 'localhost',
        port: config.email?.dev?.port || 1025,
        secure: false,
        ignoreTLS: true
      });
    } else {
      // Utiliser SendGrid pour la production
      this.emailTransporter = createTransport({
        host: config.email?.smtp?.host || 'smtp.sendgrid.net',
        port: config.email?.smtp?.port || 587,
        secure: false,
        auth: {
          user: config.email?.smtp?.user || 'apikey',
          pass: config.email?.smtp?.pass || process.env.SENDGRID_API_KEY
        }
      });
    }
  }

  /**
   * Envoyer des alertes pour une anomalie détectée
   */
  async sendAnomalyAlerts(anomalyId: string): Promise<void> {
    try {
      logger.info(`📧 Envoi des alertes pour l'anomalie ${anomalyId}`);

      // Récupérer les données de l'anomalie
      const anomalyData = await this.getAnomalyData(anomalyId);
      if (!anomalyData) {
        logger.warn(`Anomalie ${anomalyId} non trouvée`);
        return;
      }

      // Récupérer les utilisateurs à notifier
      const users = await this.getUsersToNotify(anomalyData);
      
      let sentCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          await this.sendAlertEmail(user, anomalyData);
          await this.createAlertRecord(user.id, anomalyId);
          sentCount++;
          
          // Petite pause pour éviter le spam
          await this.delay(100);
        } catch (error) {
          logger.error(`Erreur envoi alerte à ${user.email}:`, error);
          errorCount++;
        }
      }

      logger.info(`✅ Alertes envoyées: ${sentCount} succès, ${errorCount} erreurs`);

    } catch (error) {
      logger.error('Erreur sendAnomalyAlerts:', error);
      throw error;
    }
  }

  /**
   * Récupérer les données d'une anomalie
   */
  private async getAnomalyData(anomalyId: string): Promise<AlertData | null> {
    const query = `
      SELECT 
        a.id,
        a.route_id,
        a.detected_price,
        a.normal_price,
        a.discount_percentage,
        a.expires_at,
        ph.departure_date,
        ph.return_date,
        ph.airline,
        ph.raw_data->>'deepLink' as booking_url,
        CONCAT(r.origin, ' → ', r.destination) as route
      FROM anomalies a
      JOIN price_history ph ON a.price_history_id = ph.id
      JOIN routes r ON a.route_id = r.id
      WHERE a.id = $1 AND a.status = 'detected'
    `;

    const result = await this.db.query(query, [anomalyId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      userId: '', // Sera rempli par getUsersToNotify
      anomalyId,
      route: row.route,
      price: parseFloat(row.detected_price),
      originalPrice: parseFloat(row.normal_price),
      discount: parseFloat(row.discount_percentage),
      departureDate: row.departure_date,
      returnDate: row.return_date,
      airline: row.airline,
      expiresAt: row.expires_at,
      bookingUrl: row.booking_url
    };
  }

  /**
   * Récupérer les utilisateurs à notifier
   */
  private async getUsersToNotify(anomalyData: AlertData): Promise<Array<{id: string, email: string, preferences: any}>> {
    const query = `
      SELECT 
        u.id,
        u.email,
        u.preferences,
        u.departure_airport,
        u.secondary_airports
      FROM users u
      JOIN routes r ON (
        r.origin = u.departure_airport OR 
        r.origin = ANY(u.secondary_airports)
      )
      WHERE u.status IN ('basic', 'premium', 'premium_plus')
        AND (u.preferences->>'emailNotifications')::boolean != false
        AND r.id = (
          SELECT route_id FROM anomalies WHERE id = $1
        )
        AND NOT EXISTS (
          SELECT 1 FROM alerts al 
          WHERE al.user_id = u.id 
            AND al.anomaly_id = $1
        )
    `;

    const result = await this.db.query(query, [anomalyData.anomalyId]);
    return result.rows;
  }

  /**
   * Envoyer un email d'alerte
   */
  private async sendAlertEmail(user: {id: string, email: string, preferences: any}, alertData: AlertData): Promise<void> {
    const template = this.generateEmailTemplate(alertData);
    
    const mailOptions = {
      from: {
        name: config.email?.fromName || 'GlobeGenius',
        address: config.email?.from || 'alerts@globegenius.com'
      },
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    };

    await this.emailTransporter.sendMail(mailOptions);
    
    // Logger l'envoi
    await this.logEmailSent(user.id, alertData.anomalyId, 'alert');
  }

  /**
   * Générer le template email
   */
  private generateEmailTemplate(alertData: AlertData): EmailTemplate {
    const savings = alertData.originalPrice - alertData.price;
    const expiresAt = new Date(alertData.expiresAt);
    const formattedExpiry = expiresAt.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });

    const subject = `🚨 Prix exceptionnel ${alertData.route} - ${alertData.price}€ (-${alertData.discount}%)`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Alerte GlobeGenius</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .alert-box { background: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; padding: 20px; margin: 20px 0; }
          .price-section { text-align: center; margin: 30px 0; }
          .price-main { font-size: 36px; font-weight: bold; color: #28a745; }
          .price-old { font-size: 18px; color: #6c757d; text-decoration: line-through; }
          .discount { background: #dc3545; color: white; padding: 5px 10px; border-radius: 20px; font-weight: bold; }
          .cta-button { display: inline-block; background: #007bff; color: white; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .details { background: #f8f9fa; border-radius: 6px; padding: 15px; margin: 20px 0; }
          .footer { background: #343a40; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 GlobeGenius</h1>
            <p>Votre deal exceptionnel vous attend !</p>
          </div>
          
          <div class="content">
            <div class="alert-box">
              <h2>✈️ ${alertData.route}</h2>
              <p><strong>Économisez ${savings}€</strong> sur ce vol !</p>
            </div>
            
            <div class="price-section">
              <div class="price-main">${alertData.price}€</div>
              <div class="price-old">Prix habituel: ${alertData.originalPrice}€</div>
              <div style="margin-top: 10px;">
                <span class="discount">-${alertData.discount}%</span>
              </div>
            </div>
            
            <div class="details">
              <h3>Détails du vol</h3>
              <p><strong>Dates:</strong> ${new Date(alertData.departureDate).toLocaleDateString('fr-FR')} - ${new Date(alertData.returnDate).toLocaleDateString('fr-FR')}</p>
              <p><strong>Compagnie:</strong> ${alertData.airline}</p>
              <p><strong>⏰ Expire le:</strong> ${formattedExpiry}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${alertData.bookingUrl || '#'}" class="cta-button">
                Réserver maintenant
              </a>
            </div>
            
            <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
              Cette alerte a été générée automatiquement par notre système d'intelligence artificielle.
              Les prix peuvent varier et sont soumis à disponibilité.
            </p>
          </div>
          
          <div class="footer">
            <p>GlobeGenius - Votre assistant voyage intelligent</p>
            <p>Pour vous désabonner, <a href="#" style="color: #17a2b8;">cliquez ici</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
GlobeGenius - Alerte prix exceptionnel !

${alertData.route}
Prix: ${alertData.price}€ (au lieu de ${alertData.originalPrice}€)
Économie: ${savings}€ (-${alertData.discount}%)

Détails:
- Dates: ${new Date(alertData.departureDate).toLocaleDateString('fr-FR')} - ${new Date(alertData.returnDate).toLocaleDateString('fr-FR')}
- Compagnie: ${alertData.airline}
- Expire le: ${formattedExpiry}

Réserver: ${alertData.bookingUrl || 'Consultez votre tableau de bord'}

Cette alerte expire bientôt, ne la manquez pas !
    `;

    return { subject, html, text };
  }

  /**
   * Créer un enregistrement d'alerte
   */
  private async createAlertRecord(userId: string, anomalyId: string): Promise<void> {
    const alertId = uuidv4();
    
    const query = `
      INSERT INTO alerts (
        id, user_id, anomaly_id, status, sent_at
      ) VALUES ($1, $2, $3, 'sent', NOW())
    `;

    await this.db.query(query, [alertId, userId, anomalyId]);
  }

  /**
   * Logger l'envoi d'email
   */
  private async logEmailSent(userId: string, anomalyId: string, type: string): Promise<void> {
    const query = `
      INSERT INTO email_logs (
        id, user_id, anomaly_id, email_type, sent_at
      ) VALUES ($1, $2, $3, $4, NOW())
    `;

    await this.db.query(query, [uuidv4(), userId, anomalyId, type]);
  }

  /**
   * Envoyer un digest quotidien/hebdomadaire
   */
  async sendDigest(userId: string, frequency: 'daily' | 'weekly'): Promise<void> {
    try {
      logger.info(`📊 Envoi digest ${frequency} pour utilisateur ${userId}`);

      const user = await this.getUserById(userId);
      if (!user) {
        logger.warn(`Utilisateur ${userId} non trouvé`);
        return;
      }

      const digestData = await this.generateDigestData(userId, frequency);
      
      if (digestData.alerts.length === 0) {
        logger.info(`Pas d'alertes pour le digest ${frequency} de ${userId}`);
        return;
      }

      const template = this.generateDigestTemplate(digestData, frequency);
      
      const mailOptions = {
        from: {
          name: config.email?.fromName || 'GlobeGenius',
          address: config.email?.from || 'alerts@globegenius.com'
        },
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      await this.emailTransporter.sendMail(mailOptions);
      await this.logEmailSent(userId, 'digest', `digest_${frequency}`);

      logger.info(`✅ Digest ${frequency} envoyé à ${user.email}`);

    } catch (error) {
      logger.error(`Erreur envoi digest ${frequency}:`, error);
      throw error;
    }
  }

  /**
   * Récupérer un utilisateur par ID
   */
  private async getUserById(userId: string): Promise<{id: string, email: string, preferences: any} | null> {
    const result = await this.db.query(
      'SELECT id, email, preferences FROM users WHERE id = $1',
      [userId]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Générer les données pour un digest
   */
  private async generateDigestData(userId: string, frequency: 'daily' | 'weekly'): Promise<{alerts: any[], stats: any}> {
    const interval = frequency === 'daily' ? '1 day' : '7 days';
    
    const alertsQuery = `
      SELECT 
        al.id,
        al.sent_at,
        an.discount_percentage,
        an.detected_price,
        an.normal_price,
        CONCAT(r.origin, ' → ', r.destination) as route,
        ph.airline
      FROM alerts al
      JOIN anomalies an ON al.anomaly_id = an.id
      JOIN price_history ph ON an.price_history_id = ph.id
      JOIN routes r ON an.route_id = r.id
      WHERE al.user_id = $1
        AND al.sent_at > NOW() - INTERVAL '${interval}'
      ORDER BY al.sent_at DESC
      LIMIT 10
    `;

    const alertsResult = await this.db.query(alertsQuery, [userId]);
    
    const statsQuery = `
      SELECT 
        COUNT(*) as total_alerts,
        AVG(an.discount_percentage) as avg_discount,
        SUM(an.normal_price - an.detected_price) as total_savings
      FROM alerts al
      JOIN anomalies an ON al.anomaly_id = an.id
      WHERE al.user_id = $1
        AND al.sent_at > NOW() - INTERVAL '${interval}'
    `;

    const statsResult = await this.db.query(statsQuery, [userId]);

    return {
      alerts: alertsResult.rows,
      stats: statsResult.rows[0]
    };
  }

  /**
   * Générer le template pour un digest
   */
  private generateDigestTemplate(data: {alerts: any[], stats: any}, frequency: 'daily' | 'weekly'): EmailTemplate {
    const period = frequency === 'daily' ? 'aujourd\'hui' : 'cette semaine';
    const subject = `📊 Votre résumé ${frequency === 'daily' ? 'quotidien' : 'hebdomadaire'} GlobeGenius`;

    const alertsHtml = data.alerts.map(alert => `
      <div style="border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin: 10px 0;">
        <h4 style="margin: 0 0 10px 0;">${alert.route}</h4>
        <p style="margin: 5px 0;">
          <span style="font-size: 18px; font-weight: bold; color: #28a745;">${alert.detected_price}€</span>
          <span style="color: #6c757d; text-decoration: line-through; margin-left: 10px;">${alert.normal_price}€</span>
          <span style="background: #dc3545; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">-${alert.discount_percentage}%</span>
        </p>
        <p style="margin: 5px 0; color: #6c757d; font-size: 14px;">${alert.airline}</p>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Digest GlobeGenius</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .stats { background: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0; }
          .footer { background: #343a40; color: white; padding: 20px; text-align: center; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 GlobeGenius</h1>
            <p>Votre résumé ${frequency === 'daily' ? 'quotidien' : 'hebdomadaire'}</p>
          </div>
          
          <div class="content">
            <div class="stats">
              <h3>Statistiques ${period}</h3>
              <p><strong>${data.stats.total_alerts}</strong> alertes reçues</p>
              <p><strong>${Math.round(data.stats.avg_discount || 0)}%</strong> de réduction moyenne</p>
              <p><strong>${Math.round(data.stats.total_savings || 0)}€</strong> d'économies potentielles</p>
            </div>
            
            <h3>Meilleures offres ${period}</h3>
            ${alertsHtml}
          </div>
          
          <div class="footer">
            <p>GlobeGenius - Votre assistant voyage intelligent</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
GlobeGenius - Résumé ${frequency === 'daily' ? 'quotidien' : 'hebdomadaire'}

Statistiques ${period}:
- ${data.stats.total_alerts} alertes reçues
- ${Math.round(data.stats.avg_discount || 0)}% de réduction moyenne
- ${Math.round(data.stats.total_savings || 0)}€ d'économies potentielles

Meilleures offres:
${data.alerts.map(alert => `
${alert.route}
${alert.detected_price}€ (au lieu de ${alert.normal_price}€) - ${alert.airline}
`).join('')}
    `;

    return { subject, html, text };
  }

  /**
   * Utilitaire de délai
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export d'une instance par défaut
export const alertService = new AlertService(null as any); // Sera initialisé dans jobs/index.ts