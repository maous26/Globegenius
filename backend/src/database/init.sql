-- GlobeGenius Database Schema
-- Version: 1.0.0
-- Description: Schéma complet pour le service d'alertes voyage avec ML

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
CREATE TYPE user_status AS ENUM ('free', 'essential', 'premium', 'premium_plus');
CREATE TYPE alert_status AS ENUM ('pending', 'sent', 'failed', 'expired');
CREATE TYPE anomaly_status AS ENUM ('detected', 'verified', 'expired', 'false_positive');
CREATE TYPE route_tier AS ENUM ('1', '2', '3');

-- Table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255),
    status user_status DEFAULT 'free',
    departure_airport VARCHAR(3),
    secondary_airports VARCHAR(3)[] DEFAULT '{}',
    
    -- Préférences utilisateur
    preferences JSONB DEFAULT '{
        "destinations": [],
        "travel_types": ["leisure"],
        "max_price": null,
        "advance_days": 30,
        "flexible_dates": true,
        "error_detection_enabled": true,
        "alert_frequency": "immediate",
        "language": "fr"
    }',
    
    -- Profil ML
    ml_profile JSONB DEFAULT '{
        "cluster_id": null,
        "price_sensitivity": 0.5,
        "travel_frequency": 0,
        "preferred_airlines": [],
        "avg_booking_advance": 30
    }',
    
    -- Métadonnées
    subscription_started_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: routes
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin VARCHAR(3) NOT NULL,
    destination VARCHAR(3) NOT NULL,
    tier route_tier NOT NULL,
    
    -- Configuration scanning
    scan_frequency INTEGER NOT NULL, -- minutes entre scans
    last_scan_at TIMESTAMP,
    next_scan_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Métriques performance
    priority_score DECIMAL(3,2) DEFAULT 0.50,
    detection_rate DECIMAL(3,2) DEFAULT 0.00,
    passenger_volume INTEGER DEFAULT 0,
    price_variance DECIMAL(5,2) DEFAULT 0.00,
    
    -- Statistiques
    total_scans INTEGER DEFAULT 0,
    total_anomalies INTEGER DEFAULT 0,
    monthly_calls INTEGER DEFAULT 0,
    last_anomaly_at TIMESTAMP,
    
    -- Saisonnalité
    seasonal_config JSONB DEFAULT '{
        "summer_boost": false,
        "winter_boost": false,
        "holiday_periods": []
    }',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_route UNIQUE(origin, destination)
);

-- Table: price_history
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    
    -- Données de prix
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    departure_date DATE NOT NULL,
    return_date DATE NOT NULL,
    trip_duration INTEGER, -- jours
    
    -- Détails vol
    airline VARCHAR(50),
    flight_number VARCHAR(20),
    booking_class VARCHAR(20),
    stops INTEGER DEFAULT 0,
    
    -- Données brutes API
    raw_data JSONB,
    api_source VARCHAR(50), -- 'flightlabs' ou 'travelpayout'
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: anomalies
CREATE TABLE anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    price_history_id UUID REFERENCES price_history(id) ON DELETE CASCADE,
    
    -- Détection
    normal_price DECIMAL(10,2) NOT NULL,
    detected_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2) NOT NULL,
    savings_amount DECIMAL(10,2) GENERATED ALWAYS AS (normal_price - detected_price) STORED,
    
    -- Scoring ML
    anomaly_score DECIMAL(3,2) NOT NULL,
    ml_confidence DECIMAL(3,2) NOT NULL,
    isolation_forest_score DECIMAL(3,2),
    z_score DECIMAL(5,2),
    
    -- Métadonnées
    status anomaly_status DEFAULT 'detected',
    verified_by VARCHAR(50), -- 'travelpayout' si vérifié
    verification_attempts INTEGER DEFAULT 0,
    
    -- Temporalité
    detected_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    
    -- Features pour ML
    ml_features JSONB,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    anomaly_id UUID REFERENCES anomalies(id) ON DELETE CASCADE,
    
    -- Statut envoi
    status alert_status DEFAULT 'pending',
    send_attempts INTEGER DEFAULT 0,
    
    -- Personnalisation
    personalized_content JSONB,
    priority INTEGER DEFAULT 5, -- 1-10, 10 = plus urgent
    
    -- Tracking
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    unsubscribed_at TIMESTAMP,
    
    -- Conversion
    converted BOOLEAN DEFAULT FALSE,
    converted_at TIMESTAMP,
    booking_value DECIMAL(10,2),
    commission_earned DECIMAL(10,2),
    
    -- Métadonnées email
    sendgrid_message_id VARCHAR(255),
    email_metadata JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: api_calls (monitoring)
CREATE TABLE api_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_name VARCHAR(50) NOT NULL, -- 'flightlabs', 'travelpayout', 'sendgrid'
    endpoint VARCHAR(255),
    route_id UUID REFERENCES routes(id),
    
    -- Métriques
    response_time_ms INTEGER,
    status_code INTEGER,
    success BOOLEAN,
    error_message TEXT,
    
    -- Quota tracking
    credits_used INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: user_events (analytics)
CREATE TABLE user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: ml_predictions (historique ML)
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_version VARCHAR(50) NOT NULL,
    route_id UUID REFERENCES routes(id),
    price_history_id UUID REFERENCES price_history(id),
    
    -- Prédiction
    predicted_anomaly BOOLEAN NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    features_used JSONB NOT NULL,
    
    -- Résultat réel
    actual_anomaly BOOLEAN,
    feedback_received_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: metrics_daily (agrégations)
CREATE TABLE metrics_daily (
    date DATE PRIMARY KEY,
    
    -- API Usage
    api_calls_total INTEGER DEFAULT 0,
    api_calls_by_provider JSONB DEFAULT '{}',
    api_errors_count INTEGER DEFAULT 0,
    
    -- Users
    total_users INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    users_by_status JSONB DEFAULT '{}',
    
    -- Alerts
    alerts_sent INTEGER DEFAULT 0,
    alerts_opened INTEGER DEFAULT 0,
    alerts_clicked INTEGER DEFAULT 0,
    alerts_converted INTEGER DEFAULT 0,
    
    -- Anomalies
    anomalies_detected INTEGER DEFAULT 0,
    anomalies_verified INTEGER DEFAULT 0,
    avg_discount_percentage DECIMAL(5,2),
    
    -- Revenue
    revenue_total DECIMAL(10,2) DEFAULT 0,
    revenue_by_plan JSONB DEFAULT '{}',
    new_subscriptions INTEGER DEFAULT 0,
    churned_users INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_departure ON users(departure_airport);

CREATE INDEX idx_routes_tier ON routes(tier);
CREATE INDEX idx_routes_active ON routes(is_active);
CREATE INDEX idx_routes_next_scan ON routes(next_scan_at) WHERE is_active = TRUE;

CREATE INDEX idx_price_history_route_date ON price_history(route_id, created_at);
CREATE INDEX idx_price_history_dates ON price_history(departure_date, return_date);

CREATE INDEX idx_anomalies_status ON anomalies(status);
CREATE INDEX idx_anomalies_score ON anomalies(anomaly_score) WHERE status = 'detected';
CREATE INDEX idx_anomalies_expires ON anomalies(expires_at) WHERE status = 'detected';

CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_sent ON alerts(sent_at);

CREATE INDEX idx_api_calls_date ON api_calls(created_at);
CREATE INDEX idx_api_calls_name ON api_calls(api_name);

CREATE INDEX idx_user_events_user ON user_events(user_id);
CREATE INDEX idx_user_events_type ON user_events(event_type);

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anomalies_updated_at BEFORE UPDATE ON anomalies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vue matérialisée pour dashboard temps réel
CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT 
    -- API Usage
    COUNT(DISTINCT ac.id) FILTER (WHERE ac.created_at > NOW() - INTERVAL '24 hours') as api_calls_24h,
    COUNT(DISTINCT ac.id) FILTER (WHERE ac.created_at > DATE_TRUNC('month', NOW())) as api_calls_month,
    10000 - COUNT(DISTINCT ac.id) FILTER (WHERE ac.created_at > DATE_TRUNC('month', NOW())) as api_calls_remaining,
    
    -- Users
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT u.id) FILTER (WHERE u.status != 'free') as paid_users,
    COUNT(DISTINCT u.id) FILTER (WHERE u.created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
    
    -- Alerts Performance
    COUNT(DISTINCT a.id) FILTER (WHERE a.sent_at > NOW() - INTERVAL '24 hours') as alerts_sent_24h,
    AVG(CASE WHEN a.opened_at IS NOT NULL THEN 1 ELSE 0 END) as open_rate,
    AVG(CASE WHEN a.clicked_at IS NOT NULL THEN 1 ELSE 0 END) as click_rate,
    
    -- Anomalies
    COUNT(DISTINCT an.id) FILTER (WHERE an.detected_at > NOW() - INTERVAL '24 hours') as anomalies_24h,
    AVG(an.discount_percentage) FILTER (WHERE an.detected_at > NOW() - INTERVAL '7 days') as avg_discount_7d
    
FROM users u
CROSS JOIN alerts a
CROSS JOIN anomalies an
CROSS JOIN api_calls ac;

-- Fonction pour calculer les métriques quotidiennes
CREATE OR REPLACE FUNCTION calculate_daily_metrics(target_date DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO metrics_daily (date, api_calls_total, total_users, alerts_sent, anomalies_detected)
    SELECT 
        target_date,
        COUNT(DISTINCT ac.id),
        COUNT(DISTINCT u.id),
        COUNT(DISTINCT a.id),
        COUNT(DISTINCT an.id)
    FROM api_calls ac
    CROSS JOIN users u
    CROSS JOIN alerts a
    CROSS JOIN anomalies an
    WHERE DATE(ac.created_at) = target_date
    ON CONFLICT (date) DO UPDATE
    SET 
        api_calls_total = EXCLUDED.api_calls_total,
        total_users = EXCLUDED.total_users,
        alerts_sent = EXCLUDED.alerts_sent,
        anomalies_detected = EXCLUDED.anomalies_detected;
END;
$$ LANGUAGE plpgsql;

-- Permissions (pour sécurité)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO globegenius;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO globegenius;