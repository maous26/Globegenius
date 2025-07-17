import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config, ROUTE_CONFIGURATIONS } from '../config';
import { logger } from '../utils/logger';
import { connectDatabase } from './connection';
import { addDays, subDays } from 'date-fns';

interface SeedData {
  users: Array<{
    email: string;
    password: string;
    status: string;
    departureAirport: string;
    preferences: any;
  }>;
  historicalPrices: number;
  anomalies: number;
}

// Données de seed
const seedData: SeedData = {
  users: [
    {
      email: 'demo@globegenius.com',
      password: 'DemoPass123!',
      status: 'premium',
      departureAirport: 'CDG',
      preferences: {
        destinations: ['JFK', 'LAX', 'BKK'],
        maxPrice: 1000,
        travelTypes: ['leisure', 'business'],
        errorDetectionEnabled: true,
        alertFrequency: 'immediate',
      },
    },
    {
      email: 'free@globegenius.com',
      password: 'FreeUser123!',
      status: 'free',
      departureAirport: 'LYS',
      preferences: {
        destinations: ['BCN', 'FCO'],
        errorDetectionEnabled: false,
        alertFrequency: 'weekly',
      },
    },
  ],
  historicalPrices: 1000, // Nombre de prix historiques à générer
  anomalies: 50, // Nombre d'anomalies à générer
};

// Générateur de prix réalistes
function generateRealisticPrice(
  basePrice: number,
  daysUntilDeparture: number,
  isWeekend: boolean = false
): number {
  // Prix augmente à l'approche du départ
  const urgencyMultiplier = Math.max(0.8, 1.5 - (daysUntilDeparture / 100));
  
  // Weekend plus cher
  const weekendMultiplier = isWeekend ? 1.15 : 1;
  
  // Variation aléatoire ±20%
  const randomVariation = 0.8 + Math.random() * 0.4;
  
  return Math.round(basePrice * urgencyMultiplier * weekendMultiplier * randomVariation);
}

// Seed principal
async function seed() {
  logger.info('🌱 Début du seeding de la base de données...');
  
  const db = await connectDatabase.getPool();
  
  try {
    // 1. Créer les utilisateurs de test
    logger.info('Création des utilisateurs de test...');
    for (const userData of seedData.users) {
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash(userData.password, 10);
      
      await db.query(`
        INSERT INTO users (
          id, email, password_hash, status, departure_airport, 
          preferences, email_verified, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
        ON CONFLICT (email) DO UPDATE
        SET 
          password_hash = EXCLUDED.password_hash,
          status = EXCLUDED.status,
          preferences = EXCLUDED.preferences
      `, [
        userId,
        userData.email,
        passwordHash,
        userData.status,
        userData.departureAirport,
        JSON.stringify(userData.preferences),
      ]);
      
      logger.info(`✅ Utilisateur créé: ${userData.email}`);
    }

    // 2. Initialiser les routes depuis la configuration
    logger.info('Initialisation des routes...');
    let routeCount = 0;
    
    for (const [tierName, tierConfig] of Object.entries(ROUTE_CONFIGURATIONS)) {
      const tier = tierName.replace('tier', '') as '1' | '2' | '3';
      
      for (const route of tierConfig.routes) {
        const routeId = uuidv4();
        
        await db.query(`
          INSERT INTO routes (
            id, origin, destination, tier, scan_frequency, 
            priority_score, passenger_volume, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
          ON CONFLICT (origin, destination) DO UPDATE
          SET 
            tier = EXCLUDED.tier,
            scan_frequency = EXCLUDED.scan_frequency,
            passenger_volume = EXCLUDED.passenger_volume
        `, [
          routeId,
          route.origin,
          route.destination,
          tier,
          tierConfig.scanFrequency,
          0.5 + Math.random() * 0.3, // Score initial aléatoire entre 0.5 et 0.8
          route.avgVolume || 0,
        ]);
        
        routeCount++;
      }
    }
    logger.info(`✅ ${routeCount} routes initialisées`);

    // 3. Générer l'historique de prix
    logger.info('Génération de l\'historique des prix...');
    const routes = await db.query('SELECT id, origin, destination FROM routes LIMIT 20');
    
    // Mapping des prix de base par type de route
    const basePrices: Record<string, number> = {
      // Domestique
      'CDG-NCE': 120,
      'CDG-TLS': 110,
      'CDG-LYS': 100,
      'CDG-MRS': 115,
      'CDG-BOD': 105,
      
      // Europe
      'CDG-MAD': 180,
      'CDG-BCN': 160,
      'CDG-LHR': 150,
      'CDG-FCO': 170,
      'CDG-AMS': 140,
      'CDG-FRA': 130,
      
      // Long-courrier
      'CDG-JFK': 800,
      'CDG-LAX': 900,
      'CDG-DXB': 600,
      'CDG-BKK': 700,
      'CDG-NRT': 1000,
    };

    let priceCount = 0;
    for (const route of routes.rows) {
      const routeKey = `${route.origin}-${route.destination}`;
      const basePrice = basePrices[routeKey] || 200; // Prix par défaut
      
      // Générer des prix pour les 90 derniers jours
      for (let i = 0; i < seedData.historicalPrices / routes.rows.length; i++) {
        const createdAt = subDays(new Date(), Math.random() * 90);
        const daysUntilDeparture = Math.floor(20 + Math.random() * 180);
        const departureDate = addDays(createdAt, daysUntilDeparture);
        const tripDuration = Math.floor(3 + Math.random() * 14);
        const returnDate = addDays(departureDate, tripDuration);
        
        const isWeekend = departureDate.getDay() === 5 || departureDate.getDay() === 6;
        const price = generateRealisticPrice(basePrice, daysUntilDeparture, isWeekend);
        
        const airlines = ['Air France', 'EasyJet', 'Ryanair', 'Lufthansa', 'KLM', 'Iberia'];
        const airline = airlines[Math.floor(Math.random() * airlines.length)];
        
        await db.query(`
          INSERT INTO price_history (
            id, route_id, price, currency, departure_date, return_date,
            trip_duration, airline, booking_class, stops, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          uuidv4(),
          route.id,
          price,
          'EUR',
          departureDate,
          returnDate,
          tripDuration,
          airline,
          'economy',
          Math.random() > 0.7 ? 1 : 0, // 30% de vols avec escale
          createdAt,
        ]);
        
        priceCount++;
      }
    }
    logger.info(`✅ ${priceCount} prix historiques générés`);

    // 4. Générer quelques anomalies (erreurs de prix)
    logger.info('Génération d\'anomalies de prix...');
    
    for (let i = 0; i < seedData.anomalies; i++) {
      // Sélectionner une route aléatoire
      const routeResult = await db.query(
        'SELECT id, origin, destination FROM routes ORDER BY RANDOM() LIMIT 1'
      );
      const route = routeResult.rows[0];
      
      // Obtenir le prix médian pour cette route
      const priceStats = await db.query(`
        SELECT 
          AVG(price) as avg_price,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price) as median_price
        FROM price_history
        WHERE route_id = $1
          AND created_at > NOW() - INTERVAL '30 days'
      `, [route.id]);
      
      const normalPrice = priceStats.rows[0]?.median_price || 200;
      const discountPercentage = 30 + Math.random() * 50; // 30-80% de réduction
      const errorPrice = Math.round(normalPrice * (1 - discountPercentage / 100));
      
      const departureDate = addDays(new Date(), Math.floor(30 + Math.random() * 150));
      const returnDate = addDays(departureDate, Math.floor(5 + Math.random() * 10));
      
      // Créer l'entrée price_history
      const priceHistoryId = uuidv4();
      await db.query(`
        INSERT INTO price_history (
          id, route_id, price, currency, departure_date, return_date,
          airline, booking_class, stops, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      `, [
        priceHistoryId,
        route.id,
        errorPrice,
        'EUR',
        departureDate,
        returnDate,
        'Air France',
        'economy',
        0,
      ]);
      
      // Créer l'anomalie
      const expiresAt = addDays(new Date(), Math.random() > 0.5 ? 2 : 1);
      
      await db.query(`
        INSERT INTO anomalies (
          id, route_id, price_history_id, normal_price, detected_price,
          discount_percentage, anomaly_score, ml_confidence,
          status, expires_at, detected_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      `, [
        uuidv4(),
        route.id,
        priceHistoryId,
        normalPrice,
        errorPrice,
        discountPercentage,
        0.85 + Math.random() * 0.15, // Score entre 0.85 et 1
        0.8 + Math.random() * 0.2, // Confiance entre 0.8 et 1
        'detected',
        expiresAt,
      ]);
    }
    logger.info(`✅ ${seedData.anomalies} anomalies générées`);

    // 5. Générer quelques alertes pour l'utilisateur premium
    logger.info('Génération d\'alertes pour l\'utilisateur de démo...');
    
    const demoUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo@globegenius.com']
    );
    
    if (demoUser.rows.length > 0) {
      const userId = demoUser.rows[0].id;
      
      // Récupérer les dernières anomalies
      const anomalies = await db.query(`
        SELECT id FROM anomalies 
        WHERE status = 'detected' 
        ORDER BY detected_at DESC 
        LIMIT 10
      `);
      
      for (const anomaly of anomalies.rows) {
        await db.query(`
          INSERT INTO alerts (
            id, user_id, anomaly_id, status, sent_at
          ) VALUES ($1, $2, $3, $4, NOW())
        `, [
          uuidv4(),
          userId,
          anomaly.id,
          'sent',
        ]);
      }
      
      logger.info(`✅ ${anomalies.rows.length} alertes créées pour l'utilisateur de démo`);
    }

    // 6. Initialiser les métriques quotidiennes
    logger.info('Initialisation des métriques...');
    
    await db.query(`
      INSERT INTO metrics_daily (date, total_users, new_users, active_users)
      VALUES (CURRENT_DATE, 2, 2, 2)
      ON CONFLICT (date) DO UPDATE
      SET total_users = EXCLUDED.total_users
    `);

    logger.info('🎉 Seeding terminé avec succès !');
    logger.info('');
    logger.info('Comptes de test créés :');
    logger.info('- Email: demo@globegenius.com | Mot de passe: DemoPass123! (Premium)');
    logger.info('- Email: free@globegenius.com | Mot de passe: FreeUser123! (Gratuit)');
    
  } catch (error) {
    logger.error('Erreur lors du seeding:', error);
    throw error;
  }
}

// Fonction pour reset la base de données
async function reset() {
  logger.warn('⚠️  Réinitialisation de la base de données...');
  
  const db = await connectDatabase.getPool();
  
  try {
    // Supprimer toutes les données dans l'ordre inverse des dépendances
    await db.query('TRUNCATE TABLE alerts CASCADE');
    await db.query('TRUNCATE TABLE anomalies CASCADE');
    await db.query('TRUNCATE TABLE price_history CASCADE');
    await db.query('TRUNCATE TABLE routes CASCADE');
    await db.query('TRUNCATE TABLE user_events CASCADE');
    await db.query('TRUNCATE TABLE users CASCADE');
    await db.query('TRUNCATE TABLE api_calls CASCADE');
    await db.query('TRUNCATE TABLE metrics_daily CASCADE');
    
    logger.info('✅ Base de données réinitialisée');
  } catch (error) {
    logger.error('Erreur lors de la réinitialisation:', error);
    throw error;
  }
}

// Script principal
async function main() {
  try {
    await connectDatabase.connect();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--reset')) {
      await reset();
    }
    
    await seed();
    
    process.exit(0);
  } catch (error) {
    logger.error('Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

export { seed, reset, main };