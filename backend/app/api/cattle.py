from fastapi import APIRouter, HTTPException
import os
from typing import List, Optional
from app.models.cattle import Cattle, CattleCreate, CattleUpdate
from app.models.sensor_data import SensorReading
from app.services.firebase_service import firebase_service
from app.models.alerts import Alert, AlertType, AlertSeverity
from app.services.synthetic_data_engine import synthetic_engine
from datetime import datetime

router = APIRouter()

# Helper to generate weight alerts based on thresholds
def _generate_weight_alert(tag_id: str, weight: float) -> Alert | None:
    """Return an Alert if weight is under/over thresholds, else None."""
    under_thresh = int(os.getenv("UNDERWEIGHT_THRESHOLD", "450"))
    over_thresh = int(os.getenv("OVERWEIGHT_THRESHOLD", "900"))
    if weight < under_thresh:
        return Alert(
            id=f"underweight_{tag_id}_{int(datetime.utcnow().timestamp())}",
            cattle_id=tag_id,
            alert_type=AlertType.UNDERWEIGHT,
            severity=AlertSeverity.WARNING,
            title="Underweight Cattle",
            description=f"Weight {weight}kg is below the underweight threshold ({under_thresh}kg).",
            recommended_action="Check nutrition and health status."
        )
    if weight > over_thresh:
        return Alert(
            id=f"overweight_{tag_id}_{int(datetime.utcnow().timestamp())}",
            cattle_id=tag_id,
            alert_type=AlertType.OVERWEIGHT,
            severity=AlertSeverity.WARNING,
            title="Overweight Cattle",
            description=f"Weight {weight}kg exceeds the overweight threshold ({over_thresh}kg).",
            recommended_action="Review diet and activity levels."
        )
    return None

async def _determine_dynamic_status(tag_id: str, current_weight: float) -> str:
    try:
        active_alerts = await firebase_service.query_documents("alerts", "cattle_id", "==", tag_id)
        active_alerts = [a for a in active_alerts if not a.get("dismissed", False)]
    except Exception:
        active_alerts = []
    
    has_active_health_alerts = any(
        a.get("severity") in ("critical", "warning") and a.get("alert_type") not in ("underweight", "overweight") 
        for a in active_alerts
    )

    under_thresh = int(os.getenv("UNDERWEIGHT_THRESHOLD", "450"))
    over_thresh = int(os.getenv("OVERWEIGHT_THRESHOLD", "900"))
    
    if has_active_health_alerts:
        return "alert"
    elif current_weight < under_thresh:
        return "underweight"
    elif current_weight > over_thresh:
        return "overweight"
    
    if tag_id in synthetic_engine.last_readings:
        last = synthetic_engine.last_readings[tag_id]
        if last.get("heat_score", 0) > 75:
            return "in_heat"
        if last.get("pregnancy_days") is not None:
            return "pregnant"
            
    return "healthy"

@router.get("/", response_model=List[Cattle])
async def get_all_cattle():
    """Get all cattle with latest sensor readings"""
    try:
        # Get all cattle from Firebase
        cattle_list = await firebase_service.get_collection("cattle")
        
        # If no cattle exist, initialize with synthetic data
        if not cattle_list:
            await initialize_cattle_data()
            cattle_list = await firebase_service.get_collection("cattle")

            # Final fallback for environments running in mock mode.
            if not cattle_list and synthetic_engine.cattle_profiles:
                now = datetime.utcnow()
                cattle_list = [
                    {
                        "tag_id": profile["tag_id"],
                        "name": profile["name"],
                        "breed": profile["breed"].value if hasattr(profile["breed"], "value") else profile["breed"],
                        "date_of_birth": profile["date_of_birth"],
                        "weight": profile["weight"],
                        "status": "healthy",
                        "notes": "",
                        "created_at": now,
                        "updated_at": now,
                    }
                    for profile in synthetic_engine.cattle_profiles.values()
                ]
        
        # Ensure all cattle are registered in synthetic engine and status is dynamic
        for c in cattle_list:
            tag_id = c.get("tag_id")
            synthetic_engine.register_cattle_if_missing(
                tag_id=tag_id,
                name=c.get("name", tag_id),
                breed=c.get("breed", "holstein"),
                date_of_birth=c.get("date_of_birth"),
                weight=c.get("weight", 500.0)
            )
            computed_status = await _determine_dynamic_status(tag_id, c.get("weight", 500.0))
            if c.get("status") != computed_status:
                c["status"] = computed_status
                await firebase_service.update_document("cattle", tag_id, {"status": computed_status})

        return cattle_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching cattle: {str(e)}")

@router.post("/", response_model=Cattle)
async def create_cattle(cattle: CattleCreate):
    """Create a new cattle record"""
    try:
        # Check if tag ID already exists
        existing = await firebase_service.get_document("cattle", cattle.tag_id)
        if existing:
            raise HTTPException(status_code=400, detail="Tag ID already exists")
        
        # Create cattle object
        # Determine status based on weight thresholds
        if cattle.weight < int(os.getenv("UNDERWEIGHT_THRESHOLD", "450")):
            status = "underweight"
        elif cattle.weight > int(os.getenv("OVERWEIGHT_THRESHOLD", "900")):
            status = "overweight"
        else:
            status = "healthy"
        new_cattle = Cattle(
            tag_id=cattle.tag_id,
            name=cattle.name,
            breed=cattle.breed,
            date_of_birth=cattle.date_of_birth,
            weight=cattle.weight,
            status=status,
            notes=cattle.notes
        )
        
        # Save to Firebase
        success = await firebase_service.create_document("cattle", cattle.tag_id, new_cattle.model_dump())
        if not success:
            raise HTTPException(status_code=500, detail="Failed to create cattle record")
        # Generate weight alert if applicable
        weight_alert = _generate_weight_alert(cattle.tag_id, cattle.weight)
        if weight_alert:
            await firebase_service.create_document("alerts", weight_alert.id, weight_alert.dict())
        
        # Add to synthetic engine
        synthetic_engine.register_cattle_if_missing(
            tag_id=cattle.tag_id,
            name=cattle.name,
            breed=cattle.breed,
            date_of_birth=cattle.date_of_birth,
            weight=cattle.weight
        )
        
        # After creating the cattle, generate an initial sensor reading and evaluate alerts
        # Generate a synthetic sensor reading for the new cattle
        reading = synthetic_engine.generate_sensor_reading(cattle.tag_id)
        # Check for any alert conditions based on this reading
        alerts = await synthetic_engine.check_alert_conditions(cattle.tag_id, reading)
        # Persist any generated alerts to Firebase
        for alert in alerts:
            await firebase_service.create_document("alerts", alert.id, alert.dict())
        return new_cattle
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating cattle: {str(e)}")

@router.get("/{tag_id}", response_model=dict)
async def get_cattle_detail(tag_id: str):
    """Get detailed cattle information with history"""
    try:
        # Get cattle basic info
        cattle = await firebase_service.get_document("cattle", tag_id)
        if not cattle:
            raise HTTPException(status_code=404, detail="Cattle not found")
        
        # Register in synthetic engine if not already present
        synthetic_engine.register_cattle_if_missing(
            tag_id=tag_id,
            name=cattle.get("name", tag_id),
            breed=cattle.get("breed", "holstein"),
            date_of_birth=cattle.get("date_of_birth"),
            weight=cattle.get("weight", 500.0)
        )
        # Get latest sensor reading
        latest_reading = await get_latest_sensor_reading(tag_id)
        
        # Get health events
        health_events = await firebase_service.query_documents(
            "health_events", "cattle_id", "==", tag_id
        )
        
        # Get milk records (last 30 days)
        milk_records = await firebase_service.query_documents(
            "milk_records", "cattle_id", "==", tag_id
        )
        # Filter by date (would need more complex query in real implementation)
        
        # Get reproduction events
        ai_events = await firebase_service.query_documents(
            "ai_events", "cattle_id", "==", tag_id
        )
        
        return {
            "cattle": cattle,
            "latest_reading": latest_reading,
            "health_events": sorted(health_events, key=lambda x: x.get("date", ""), reverse=True),
            "milk_records": sorted(milk_records, key=lambda x: x.get("date", ""), reverse=True)[:30],
            "reproduction_events": sorted(ai_events, key=lambda x: x.get("date", ""), reverse=True)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching cattle detail: {str(e)}")

@router.put("/{tag_id}", response_model=Cattle)
async def update_cattle(tag_id: str, cattle_update: CattleUpdate):
    """Update cattle information"""
    try:
        # Check if cattle exists
        existing = await firebase_service.get_document("cattle", tag_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Cattle not found")
        
        # Prepare update data (only non-None fields)
        update_data = cattle_update.model_dump(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            
            # Calculate dynamic status based on updated or existing weight
            current_weight = update_data.get("weight") if "weight" in update_data else existing.get("weight", 500.0)
            new_status = await _determine_dynamic_status(tag_id, current_weight)
            update_data["status"] = new_status
            
            success = await firebase_service.update_document("cattle", tag_id, update_data)
            if not success:
                raise HTTPException(status_code=500, detail="Failed to update cattle")
            
            # If weight changed, generate weight alert
            if "weight" in update_data:
                weight_alert = _generate_weight_alert(tag_id, update_data["weight"])
                if weight_alert:
                    await firebase_service.create_document("alerts", weight_alert.id, weight_alert.dict())
        
        # Return updated cattle
        updated = await firebase_service.get_document("cattle", tag_id)
        # After updating the cattle, generate a sensor reading to evaluate any new alerts
        reading = synthetic_engine.generate_sensor_reading(tag_id)
        alerts = await synthetic_engine.check_alert_conditions(tag_id, reading)
        for alert in alerts:
            await firebase_service.create_document("alerts", alert.id, alert.model_dump())
        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating cattle: {str(e)}")

@router.delete("/{tag_id}")
async def delete_cattle(tag_id: str):
    """Delete a cattle record"""
    try:
        # Check if cattle exists
        existing = await firebase_service.get_document("cattle", tag_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Cattle not found")
        
        # Delete from Firebase
        success = await firebase_service.delete_document("cattle", tag_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete cattle")
        
        # Remove from synthetic engine
        if tag_id in synthetic_engine.cattle_profiles:
            del synthetic_engine.cattle_profiles[tag_id]
        if tag_id in synthetic_engine.last_readings:
            del synthetic_engine.last_readings[tag_id]
        if tag_id in synthetic_engine.alert_conditions:
            del synthetic_engine.alert_conditions[tag_id]
        
        return {"message": "Cattle deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting cattle: {str(e)}")

@router.post("/{tag_id}/milk")
async def log_milk_session(tag_id: str, milk_data: dict):
    """Log a milk session for a cattle"""
    try:
        # Check if cattle exists
        existing = await firebase_service.get_document("cattle", tag_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Cattle not found")
        
        # Create milk record
        milk_record = {
            "id": f"milk_{tag_id}_{int(datetime.now().timestamp())}",
            "cattle_id": tag_id,
            "date": milk_data.get("date", datetime.utcnow()),
            "session": milk_data.get("session", "morning"),
            "yield_liters": milk_data.get("yield_liters"),
            "notes": milk_data.get("notes"),
            "created_at": datetime.utcnow()
        }
        
        # Save to Firebase
        success = await firebase_service.create_document("milk_records", milk_record["id"], milk_record)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to log milk session")
        
        return {"message": "Milk session logged successfully", "record": milk_record}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging milk session: {str(e)}")

@router.post("/{tag_id}/health-event")
async def add_health_event(tag_id: str, health_data: dict):
    """Add a health event for a cattle"""
    try:
        # Check if cattle exists
        existing = await firebase_service.get_document("cattle", tag_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Cattle not found")
        
        # Create health event
        health_event = {
            "id": f"health_{tag_id}_{int(datetime.now().timestamp())}",
            "cattle_id": tag_id,
            "event_type": health_data.get("event_type"),
            "date": health_data.get("date", datetime.utcnow()),
            "notes": health_data.get("notes"),
            "treated_by": health_data.get("treated_by"),
            "created_at": datetime.utcnow()
        }
        
        # Save to Firebase
        success = await firebase_service.create_document("health_events", health_event["id"], health_event)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to add health event")
        
        return {"message": "Health event added successfully", "event": health_event}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding health event: {str(e)}")

# Helper functions
async def initialize_cattle_data():
    """Initialize cattle data with synthetic profiles"""
    await synthetic_engine.initialize_cattle_profiles()
    
    for tag_id, profile in synthetic_engine.cattle_profiles.items():
        breed = profile.get("breed")
        breed_value = breed.value if hasattr(breed, "value") else breed

        cattle_data = {
            "tag_id": profile["tag_id"],
            "name": profile["name"],
            "breed": breed_value,
            "date_of_birth": profile["date_of_birth"],
            "weight": profile["weight"],
            "status": "healthy",
            "notes": "",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        created = await firebase_service.create_document("cattle", tag_id, cattle_data)
        if not created:
            print(f"⚠️ Failed to initialize cattle document for {tag_id}")

async def get_latest_sensor_reading(tag_id: str) -> Optional[dict]:
    """Get the latest sensor reading for a cattle"""
    try:
        # In a real implementation, you'd query for the latest reading
        # For now, return the last reading from synthetic engine
        if tag_id in synthetic_engine.last_readings:
            last = synthetic_engine.last_readings[tag_id]
            return {
                "cattle_id": tag_id,
                "timestamp": datetime.utcnow(),
                "body_temperature": last["temperature"],
                "activity_level": last["activity"],
                "rumination_hours_24h": last["rumination_24h"],
                "eating_hours_24h": last["eating_24h"],
                "milk_yield_liters": last["milk_yield"],
                "heat_score": last["heat_score"],
                "pregnancy_days": last.get("pregnancy_days")
            }
        return None
    except Exception:
        return None
