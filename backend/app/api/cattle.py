from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models.cattle import Cattle, CattleCreate, CattleUpdate
from app.models.sensor_data import SensorReading
from app.services.firebase_service import firebase_service
from app.services.synthetic_data_engine import synthetic_engine
from datetime import datetime

router = APIRouter()

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
        new_cattle = Cattle(
            tag_id=cattle.tag_id,
            name=cattle.name,
            breed=cattle.breed,
            date_of_birth=cattle.date_of_birth,
            weight=cattle.weight,
            notes=cattle.notes
        )
        
        # Save to Firebase
        success = await firebase_service.create_document("cattle", cattle.tag_id, new_cattle.dict())
        if not success:
            raise HTTPException(status_code=500, detail="Failed to create cattle record")
        
        # Add to synthetic engine
        synthetic_engine.cattle_profiles[cattle.tag_id] = {
            "tag_id": cattle.tag_id,
            "name": cattle.name,
            "breed": cattle.breed,
            "date_of_birth": cattle.date_of_birth,
            "weight": cattle.weight,
            "base_milk_yield": 25.0,  # Default
            "heat_cycle_day": 1
        }
        
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
        update_data = cattle_update.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            success = await firebase_service.update_document("cattle", tag_id, update_data)
            if not success:
                raise HTTPException(status_code=500, detail="Failed to update cattle")
        
        # Return updated cattle
        updated = await firebase_service.get_document("cattle", tag_id)
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
