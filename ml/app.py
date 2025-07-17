from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Tuple, Dict
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import asyncio
import asyncpg
import redis.asyncio as redis
from datetime import datetime, timedelta
import logging
import os
from contextlib import asynccontextmanager

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://globegenius:dev_password_change_in_prod@localhost:5432/globegenius')
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
MODEL_PATH = 'models/'

# Modèles Pydantic
class AnomalyFeatures(BaseModel):
    price_ratio: float
    z_score: float
    day_of_week: int
    days_until_departure: int
    trip_duration: int
    seasonal_factor: float
    price_variance: float
    recent_trend: float

class AnomalyRequest(BaseModel):
    features: AnomalyFeatures

class AnomalyResponse(BaseModel):
    isolation_score: float
    predicted_price: float
    anomaly_probability: float
    confidence_interval: Tuple[float, float]

class TrainingRequest(BaseModel):
    route_id: str
    retrain_all: bool = False

# Variables globales pour les modèles
models = {}
scalers = {}
db_pool = None
redis_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application"""
    global db_pool, redis_client
    
    # Démarrage
    logger.info("Démarrage du service ML...")
    
    # Connexion base de données
    db_pool = await asyncpg.create_pool(DATABASE_URL)
    logger.info("✅ Connexion PostgreSQL établie")
    
    # Connexion Redis
    redis_client = await redis.from_url(REDIS_URL)
    logger.info("✅ Connexion Redis établie")
    
    # Charger les modèles existants
    await load_existing_models()
    logger.info("✅ Modèles ML chargés")
    
    # Lancer la tâche de réentraînement périodique
    asyncio.create_task(periodic_retraining())
    
    yield
    
    # Arrêt
    logger.info("Arrêt du service ML...")
    await db_pool.close()
    await redis_client.close()

# Création de l'application FastAPI
app = FastAPI(
    title="GlobeGenius ML Service",
    version="1.0.0",
    lifespan=lifespan
)

async def load_existing_models():
    """Charger les modèles sauvegardés depuis le disque"""
    global models, scalers
    
    if not os.path.exists(MODEL_PATH):
        os.makedirs(MODEL_PATH)
        logger.info("Dossier modèles créé")
        return
    
    # Charger le modèle global si existant
    global_model_path = os.path.join(MODEL_PATH, 'global_model.pkl')
    global_scaler_path = os.path.join(MODEL_PATH, 'global_scaler.pkl')
    
    if os.path.exists(global_model_path):
        models['global'] = joblib.load(global_model_path)
        scalers['global'] = joblib.load(global_scaler_path)
        logger.info("Modèle global chargé")
    else:
        # Créer un modèle par défaut
        models['global'] = IsolationForest(
            contamination=0.05,
            random_state=42,
            n_estimators=100
        )
        scalers['global'] = StandardScaler()
        logger.info("Modèle global par défaut créé")

async def get_training_data(route_id: str = None) -> pd.DataFrame:
    """Récupérer les données d'entraînement depuis la DB"""
    query = """
        WITH price_stats AS (
            SELECT 
                ph.id,
                ph.route_id,
                ph.price,
                ph.departure_date,
                ph.return_date,
                ph.created_at,
                r.origin,
                r.destination,
                AVG(ph.price) OVER (
                    PARTITION BY ph.route_id 
                    ORDER BY ph.created_at 
                    ROWS BETWEEN 30 PRECEDING AND 1 PRECEDING
                ) as avg_price_30d,
                STDDEV(ph.price) OVER (
                    PARTITION BY ph.route_id 
                    ORDER BY ph.created_at 
                    ROWS BETWEEN 30 PRECEDING AND 1 PRECEDING
                ) as std_price_30d,
                MIN(ph.price) OVER (
                    PARTITION BY ph.route_id 
                    ORDER BY ph.created_at 
                    ROWS BETWEEN 90 PRECEDING AND 1 PRECEDING
                ) as min_price_90d,
                MAX(ph.price) OVER (
                    PARTITION BY ph.route_id 
                    ORDER BY ph.created_at 
                    ROWS BETWEEN 90 PRECEDING AND 1 PRECEDING
                ) as max_price_90d,
                a.id IS NOT NULL as is_anomaly
            FROM price_history ph
            JOIN routes r ON ph.route_id = r.id
            LEFT JOIN anomalies a ON ph.id = a.price_history_id 
                AND a.status IN ('detected', 'verified')
            WHERE ph.created_at > NOW() - INTERVAL '180 days'
    """
    
    if route_id:
        query += f" AND ph.route_id = '{route_id}'"
    
    query += """
        )
        SELECT * FROM price_stats 
        WHERE avg_price_30d IS NOT NULL
    """
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(query)
        
    if not rows:
        return pd.DataFrame()
    
    df = pd.DataFrame([dict(row) for row in rows])
    
    # Feature engineering
    df['departure_date'] = pd.to_datetime(df['departure_date'])
    df['return_date'] = pd.to_datetime(df['return_date'])
    df['created_at'] = pd.to_datetime(df['created_at'])
    
    df['price_ratio'] = df['price'] / df['avg_price_30d']
    df['z_score'] = (df['price'] - df['avg_price_30d']) / df['std_price_30d'].fillna(1)
    df['day_of_week'] = df['departure_date'].dt.dayofweek
    df['days_until_departure'] = (df['departure_date'] - df['created_at']).dt.days
    df['trip_duration'] = (df['return_date'] - df['departure_date']).dt.days
    df['month'] = df['departure_date'].dt.month
    df['price_variance'] = df['std_price_30d'] / df['avg_price_30d']
    
    # Facteur saisonnier
    df['seasonal_factor'] = df['month'].apply(calculate_seasonal_factor)
    
    # Tendance récente (simplifiée pour l'entraînement)
    df['recent_trend'] = 0  # À calculer avec plus de données
    
    return df

def calculate_seasonal_factor(month: int) -> float:
    """Calculer le facteur saisonnier selon le mois"""
    if month in [6, 7, 8]:  # Été
        return 1.3
    elif month == 12:  # Décembre
        return 1.4
    elif month in [2, 11]:  # Basse saison
        return 0.8
    return 1.0

async def train_model(route_id: str = None):
    """Entraîner un modèle pour une route ou globalement"""
    logger.info(f"Début de l'entraînement du modèle {'global' if not route_id else f'route {route_id}'}")
    
    # Récupérer les données
    df = await get_training_data(route_id)
    
    if len(df) < 100:
        logger.warning(f"Pas assez de données pour l'entraînement ({len(df)} lignes)")
        return
    
    # Features pour l'entraînement
    feature_cols = [
        'price_ratio', 'z_score', 'day_of_week', 
        'days_until_departure', 'trip_duration', 
        'seasonal_factor', 'price_variance'
    ]
    
    X = df[feature_cols].fillna(0)
    y = df['is_anomaly'].astype(int)
    
    # Scaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Modèle Isolation Forest
    contamination = y.mean() if y.mean() > 0 else 0.05
    model = IsolationForest(
        contamination=contamination,
        random_state=42,
        n_estimators=200,
        max_samples='auto'
    )
    
    # Entraînement
    model.fit(X_scaled)
    
    # Évaluation simple
    predictions = model.predict(X_scaled)
    anomaly_scores = model.score_samples(X_scaled)
    
    # Sauvegarder le modèle
    model_key = route_id if route_id else 'global'
    models[model_key] = model
    scalers[model_key] = scaler
    
    # Sauvegarder sur disque
    model_path = os.path.join(MODEL_PATH, f'{model_key}_model.pkl')
    scaler_path = os.path.join(MODEL_PATH, f'{model_key}_scaler.pkl')
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    # Métriques
    detected_anomalies = (predictions == -1).sum()
    logger.info(f"Modèle entraîné: {detected_anomalies} anomalies détectées sur {len(df)} échantillons")
    
    # Sauvegarder les métriques dans Redis
    await redis_client.setex(
        f'ml:model:metrics:{model_key}',
        86400,  # 24h
        f'{{"contamination": {contamination}, "samples": {len(df)}, "anomalies": {detected_anomalies}}}'
    )

async def periodic_retraining():
    """Réentraîner les modèles périodiquement"""
    while True:
        try:
            # Attendre 6 heures
            await asyncio.sleep(6 * 3600)
            
            logger.info("Début du réentraînement périodique...")
            
            # Réentraîner le modèle global
            await train_model()
            
            # Réentraîner les modèles des routes principales
            async with db_pool.acquire() as conn:
                top_routes = await conn.fetch("""
                    SELECT id FROM routes 
                    WHERE tier = '1' 
                    ORDER BY priority_score DESC 
                    LIMIT 10
                """)
            
            for route in top_routes:
                await train_model(route['id'])
                await asyncio.sleep(10)  # Pause entre les entraînements
            
            logger.info("Réentraînement périodique terminé")
            
        except Exception as e:
            logger.error(f"Erreur durant le réentraînement: {e}")

@app.get("/health")
async def health_check():
    """Vérification de santé du service"""
    return {
        "status": "healthy",
        "models_loaded": len(models),
        "database": "connected" if db_pool else "disconnected",
        "redis": "connected" if redis_client else "disconnected"
    }

@app.post("/api/anomaly/detect", response_model=AnomalyResponse)
async def detect_anomaly(request: AnomalyRequest):
    """Détecter une anomalie de prix"""
    try:
        # Préparer les features
        features = np.array([[
            request.features.price_ratio,
            request.features.z_score,
            request.features.day_of_week,
            request.features.days_until_departure,
            request.features.trip_duration,
            request.features.seasonal_factor,
            request.features.price_variance
        ]])
        
        # Utiliser le modèle global par défaut
        model = models.get('global')
        scaler = scalers.get('global')
        
        if not model or not scaler:
            raise HTTPException(status_code=503, detail="Modèle non disponible")
        
        # Normaliser les features
        features_scaled = scaler.transform(features)
        
        # Prédiction
        anomaly_score = model.score_samples(features_scaled)[0]
        prediction = model.predict(features_scaled)[0]
        
        # Calculer la probabilité (transformation du score)
        # Les scores Isolation Forest sont négatifs, plus c'est négatif plus c'est anormal
        anomaly_probability = 1 / (1 + np.exp(anomaly_score * 10))
        
        # Prix prédit (basé sur le ratio)
        predicted_price = 1 / request.features.price_ratio if request.features.price_ratio > 0 else 1
        
        # Intervalle de confiance
        confidence_interval = (
            predicted_price * 0.85,
            predicted_price * 1.15
        )
        
        return AnomalyResponse(
            isolation_score=float(anomaly_score),
            predicted_price=float(predicted_price),
            anomaly_probability=float(anomaly_probability),
            confidence_interval=confidence_interval
        )
        
    except Exception as e:
        logger.error(f"Erreur détection anomalie: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/model/train")
async def trigger_training(request: TrainingRequest):
    """Déclencher l'entraînement d'un modèle"""
    try:
        if request.retrain_all:
            # Entraîner tous les modèles
            await train_model()  # Global
            
            # Routes principales
            async with db_pool.acquire() as conn:
                routes = await conn.fetch("SELECT id FROM routes WHERE tier IN ('1', '2')")
            
            for route in routes:
                await train_model(route['id'])
        else:
            # Entraîner un modèle spécifique
            await train_model(request.route_id)
        
        return {"status": "success", "message": "Entraînement lancé"}
        
    except Exception as e:
        logger.error(f"Erreur entraînement: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/model/metrics/{model_id}")
async def get_model_metrics(model_id: str):
    """Récupérer les métriques d'un modèle"""
    metrics = await redis_client.get(f'ml:model:metrics:{model_id}')
    
    if not metrics:
        raise HTTPException(status_code=404, detail="Métriques non trouvées")
    
    return {"model_id": model_id, "metrics": metrics}

@app.post("/api/anomaly/feedback")
async def submit_feedback(anomaly_id: str, is_correct: bool):
    """Soumettre un feedback sur une détection"""
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO ml_predictions (
                    model_version, route_id, price_history_id,
                    predicted_anomaly, actual_anomaly, feedback_received_at
                )
                SELECT 
                    'v1.0', route_id, price_history_id,
                    true, $2, NOW()
                FROM anomalies
                WHERE id = $1
            """, anomaly_id, is_correct)
        
        return {"status": "success", "message": "Feedback enregistré"}
        
    except Exception as e:
        logger.error(f"Erreur feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)