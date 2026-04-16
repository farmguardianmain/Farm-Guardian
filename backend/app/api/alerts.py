from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime, timezone
from app.models.alerts import Alert, AlertCreate
from app.services.firebase_service import firebase_service

router = APIRouter()


def _to_datetime(value):
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).replace(tzinfo=None) if value.tzinfo else value
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return parsed.astimezone(timezone.utc).replace(tzinfo=None) if parsed.tzinfo else parsed
        except ValueError:
            return None
    return None


def _timestamp_for_sort(value) -> float:
    parsed = _to_datetime(value)
    return parsed.timestamp() if parsed else 0.0

@router.get("/", response_model=List[Alert])
async def get_alerts(status: Optional[str] = None):
    """Get alerts with optional status filter"""
    try:
        if status == "active":
            alerts = await firebase_service.query_documents("alerts", "dismissed", "==", False)
        elif status == "resolved":
            alerts = await firebase_service.query_documents("alerts", "dismissed", "==", True)
        else:
            alerts = await firebase_service.get_collection("alerts")
        
        # Sort by timestamp (newest first) and severity
        severity_order = {"critical": 0, "warning": 1, "info": 2}
        alerts.sort(key=lambda x: (
            x.get("dismissed", False),  # Active alerts first
            severity_order.get(x.get("severity", "info"), 3),  # By severity
            -_timestamp_for_sort(x.get("timestamp"))  # Newest first
        ))
        
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alerts: {str(e)}")

@router.get("/{alert_id}", response_model=Alert)
async def get_alert_detail(alert_id: str):
    """Get detailed alert information"""
    try:
        alert = await firebase_service.get_document("alerts", alert_id)
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        return alert
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alert detail: {str(e)}")

@router.patch("/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str):
    """Dismiss an alert"""
    try:
        # Check if alert exists
        alert = await firebase_service.get_document("alerts", alert_id)
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        # Update alert
        update_data = {
            "dismissed": True,
            "dismissed_at": datetime.utcnow()
        }
        
        success = await firebase_service.update_document("alerts", alert_id, update_data)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to dismiss alert")
        
        return {"message": "Alert dismissed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error dismissing alert: {str(e)}")

@router.get("/stats/summary")
async def get_alert_stats():
    """Get alert statistics for dashboard"""
    try:
        all_alerts = await firebase_service.get_collection("alerts")
        today = datetime.utcnow().date()

        resolved_today = 0
        for alert in all_alerts:
            if not alert.get("dismissed"):
                continue

            dismissed_at = _to_datetime(alert.get("dismissed_at"))
            if dismissed_at and dismissed_at.date() == today:
                resolved_today += 1
        
        stats = {
            "total_alerts": len(all_alerts),
            "active_alerts": len([a for a in all_alerts if not a.get("dismissed", False)]),
            "critical_alerts": len([a for a in all_alerts if a.get("severity") == "critical" and not a.get("dismissed", False)]),
            "warning_alerts": len([a for a in all_alerts if a.get("severity") == "warning" and not a.get("dismissed", False)]),
            "info_alerts": len([a for a in all_alerts if a.get("severity") == "info" and not a.get("dismissed", False)]),
            "resolved_today": resolved_today
        }
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alert stats: {str(e)}")
