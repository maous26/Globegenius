from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Tuple, Dict
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import logging
import os
from contextlib import asynccontextmanager

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestion du cycle de vie de l'application"""
    
    # Démarrage
    logger.info("Démarrage du service ML...")
    
    # Charger les modèles existants
    await load_existing_models()
    logger.info("✅ Modèles ML chargés")
    
    yield
    
    # Arrêt
    logger.info("Arrêt du service ML...")

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
    
    # Charger les modèles depuis le disque
    for filename in os.listdir(MODEL_PATH):
        if filename.endswith('_model.pkl'):
            route_id = filename.replace('_model.pkl', '')
            model_path = os.path.join(MODEL_PATH, filename)
            scaler_path = os.path.join(MODEL_PATH, f"{route_id}_scaler.pkl")
            
            if os.path.exists(scaler_path):
                models[route_id] = joblib.load(model_path)
                scalers[route_id] = joblib.load(scaler_path)
                logger.info(f"Modèle chargé pour la route: {route_id}")

def create_sample_model(route_id: str):
    """Créer un modèle d'exemple pour les tests"""
    # Données d'exemple
    sample_data = np.random.normal(0, 1, (1000, 8))
    
    # Entraîner le modèle
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(sample_data)
    
    model = IsolationForest(contamination=0.1, random_state=42)
    model.fit(scaled_data)
    
    # Sauvegarder
    models[route_id] = model
    scalers[route_id] = scaler
    
    model_path = os.path.join(MODEL_PATH, f"{route_id}_model.pkl")
    scaler_path = os.path.join(MODEL_PATH, f"{route_id}_scaler.pkl")
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    logger.info(f"Modèle créé et sauvegardé pour la route: {route_id}")
    return model, scaler

@app.get("/health")
async def health_check():
    """Vérification de l'état de santé du service"""
    return {
        "status": "healthy",
        "service": "GlobeGenius ML Service",
        "version": "1.0.0",
        "models_loaded": len(models),
        "timestamp": pd.Timestamp.now().isoformat()
    }

@app.post("/predict/anomaly/{route_id}")
async def predict_anomaly(route_id: str, request: AnomalyRequest) -> AnomalyResponse:
    """Prédire si un prix est anormal pour une route donnée"""
    
    # Vérifier si le modèle existe
    if route_id not in models:
        logger.warning(f"Modèle non trouvé pour la route {route_id}, création d'un modèle d'exemple")
        create_sample_model(route_id)
    
    model = models[route_id]
    scaler = scalers[route_id]
    
    # Préparer les données
    features = np.array([[
        request.features.price_ratio,
        request.features.z_score,
        request.features.day_of_week,
        request.features.days_until_departure,
        request.features.trip_duration,
        request.features.seasonal_factor,
        request.features.price_variance,
        request.features.recent_trend
    ]])
    
    # Normaliser les données
    scaled_features = scaler.transform(features)
    
    # Prédiction
    isolation_score = model.decision_function(scaled_features)[0]
    is_anomaly = model.predict(scaled_features)[0] == -1
    
    # Calculer la probabilité d'anomalie
    anomaly_probability = 1 / (1 + np.exp(isolation_score))
    
    # Prix prédit (simulation basée sur les caractéristiques)
    predicted_price = 100 * (1 + request.features.price_ratio * 0.5)
    
    # Intervalle de confiance (simulation)
    confidence_interval = (
        predicted_price * 0.9,
        predicted_price * 1.1
    )
    
    return AnomalyResponse(
        isolation_score=float(isolation_score),
        predicted_price=float(predicted_price),
        anomaly_probability=float(anomaly_probability),
        confidence_interval=confidence_interval
    )

@app.post("/train/{route_id}")
async def train_model(route_id: str, request: TrainingRequest):
    """Entraîner ou réentraîner un modèle pour une route"""
    
    try:
        # Pour cet exemple, on crée un modèle avec des données simulées
        model, scaler = create_sample_model(route_id)
        
        return {
            "message": f"Modèle entraîné avec succès pour la route {route_id}",
            "route_id": route_id,
            "model_type": "IsolationForest",
            "timestamp": pd.Timestamp.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Erreur lors de l'entraînement du modèle pour {route_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur d'entraînement: {str(e)}")

@app.get("/models")
async def list_models():
    """Lister tous les modèles disponibles"""
    return {
        "models": list(models.keys()),
        "total": len(models),
        "timestamp": pd.Timestamp.now().isoformat()
    }

@app.delete("/models/{route_id}")
async def delete_model(route_id: str):
    """Supprimer un modèle"""
    if route_id not in models:
        raise HTTPException(status_code=404, detail=f"Modèle non trouvé pour la route {route_id}")
    
    # Supprimer du cache
    del models[route_id]
    del scalers[route_id]
    
    # Supprimer les fichiers
    model_path = os.path.join(MODEL_PATH, f"{route_id}_model.pkl")
    scaler_path = os.path.join(MODEL_PATH, f"{route_id}_scaler.pkl")
    
    if os.path.exists(model_path):
        os.remove(model_path)
    if os.path.exists(scaler_path):
        os.remove(scaler_path)
    
    return {
        "message": f"Modèle supprimé pour la route {route_id}",
        "route_id": route_id,
        "timestamp": pd.Timestamp.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
