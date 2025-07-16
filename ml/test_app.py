import pytest
from app_simple import app

def test_app_creation():
    """Test that the app can be created"""
    assert app is not None

def test_health_endpoint():
    """Test the health endpoint"""
    with app.test_client() as client:
        response = client.get('/health')
        assert response.status_code == 200

def test_predict_endpoint():
    """Test the predict endpoint with sample data"""
    with app.test_client() as client:
        response = client.post('/predict', json={'data': 'test'})
        # Should return 200 or 400 depending on validation
        assert response.status_code in [200, 400]
