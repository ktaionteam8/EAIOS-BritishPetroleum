"""Unit tests for Downtime Prevention health endpoint."""
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/v1/downtime-prevention/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "downtime-prevention"
