"""
Basic tests for Career AI backend
"""
import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import app
from utils.db import _load, _save

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    """Test health check endpoint"""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'ok'
    assert 'Career AI API' in data['message']

def test_register_validation(client):
    """Test registration input validation"""
    # Test missing fields
    response = client.post('/api/auth/register', json={})
    assert response.status_code == 400

    # Test invalid email
    response = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'invalid-email',
        'password': 'password123'
    })
    assert response.status_code == 400

    # Test weak password
    response = client.post('/api/auth/register', json={
        'name': 'Test User',
        'email': 'test@example.com',
        'password': '123'
    })
    assert response.status_code == 400

def test_community_endpoints(client):
    """Test basic community endpoints"""
    # Test getting communities (should return empty list initially)
    response = client.get('/api/community/communities')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)

    # Test leaderboard endpoint
    response = client.get('/api/community/leaderboard')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)

if __name__ == '__main__':
    pytest.main([__file__])