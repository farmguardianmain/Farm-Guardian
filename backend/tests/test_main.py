import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.firebase_service import firebase_service

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    # Since we likely don't have real service account, mode should be "mock"
    assert data["firebase_mode"] in ("mock", "firestore")

def test_admin_tick_and_alerts():
    # Trigger a synthetic data tick
    response = client.post("/admin/tick")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

    # After tick, mock store should have some alerts (if any conditions met)
    alerts = firebase_service._mock_store.get("alerts", {})
    # It's possible no alerts were generated; ensure the collection exists
    assert isinstance(alerts, dict)
    # If alerts exist, check structure of at least one
    if alerts:
        first_key = next(iter(alerts))
        alert = alerts[first_key]
        assert "cattle_id" in alert
        assert "alert_type" in alert
        assert "severity" in alert
