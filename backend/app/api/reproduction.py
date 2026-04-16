from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
from app.services.firebase_service import firebase_service
from app.services.synthetic_data_engine import synthetic_engine

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


def _sort_timestamp(value) -> float:
    parsed = _to_datetime(value)
    return parsed.timestamp() if parsed else 0.0

@router.get("/heat-detection")
async def get_heat_detection():
    """Get cattle currently in heat or approaching heat"""
    try:
        # Get all cattle
        all_cattle = await firebase_service.get_collection("cattle")
        heat_list = []
        
        for cattle in all_cattle:
            tag_id = cattle.get("tag_id")
            
            # Get latest synthetic data for heat score
            if tag_id in synthetic_engine.last_readings:
                last_reading = synthetic_engine.last_readings[tag_id]
                heat_score = last_reading.get("heat_score", 0)
                
                # Determine if in heat or approaching
                if heat_score > 75:
                    status = "in_heat"
                    optimal_ai = True
                elif heat_score > 40:
                    status = "approaching"
                    optimal_ai = heat_score > 60
                else:
                    continue  # Not in heat cycle
                
                # Calculate days since last heat (simplified)
                heat_cycle_day = synthetic_engine.cattle_profiles[tag_id].get("heat_cycle_day", 1)
                days_since_last_heat = heat_cycle_day
                
                heat_list.append({
                    "cattle_id": tag_id,
                    "name": cattle.get("name", tag_id),
                    "breed": cattle.get("breed"),
                    "heat_score": heat_score,
                    "status": status,
                    "days_since_last_heat": days_since_last_heat,
                    "optimal_ai_window": optimal_ai,
                    "last_heat_date": datetime.utcnow() - timedelta(days=days_since_last_heat)
                })
        
        # Sort by heat score (highest first)
        heat_list.sort(key=lambda x: x["heat_score"], reverse=True)
        
        return heat_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching heat detection data: {str(e)}")

@router.get("/pregnancy-tracker")
async def get_pregnancy_tracker():
    """Get pregnancy tracking information"""
    try:
        # Get all AI events to determine pregnancies
        ai_events = await firebase_service.get_collection("ai_events")
        pregnancy_list = []
        
        for event in ai_events:
            cattle_id = event.get("cattle_id")
            conception_date = _to_datetime(event.get("date"))
            
            if not conception_date:
                continue
            
            # Calculate pregnancy metrics
            days_pregnant = (datetime.utcnow() - conception_date).days
            expected_calving = conception_date + timedelta(days=285)
            
            # Determine pregnancy stage
            if days_pregnant < 90:
                stage = "early"
            elif days_pregnant < 180:
                stage = "mid"
            elif days_pregnant < 285:
                stage = "late"
            else:
                stage = "overdue"
            
            # Get cattle details
            cattle = await firebase_service.get_document("cattle", cattle_id)
            if cattle:
                pregnancy_list.append({
                    "cattle_id": cattle_id,
                    "name": cattle.get("name", cattle_id),
                    "breed": cattle.get("breed"),
                    "conception_date": conception_date,
                    "expected_calving_date": expected_calving,
                    "days_pregnant": days_pregnant,
                    "stage": stage,
                    "ai_event_id": event.get("id"),
                    "bull_semen_reference": event.get("bull_semen_reference")
                })
        
        # Sort by days pregnant (closest to calving first)
        pregnancy_list.sort(key=lambda x: x["days_pregnant"], reverse=True)
        
        return pregnancy_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching pregnancy tracker: {str(e)}")

@router.post("/log-ai-event")
async def log_ai_event(ai_data: Dict[str, Any]):
    """Log an artificial insemination event"""
    try:
        # Validate required fields
        if not all(key in ai_data for key in ["cattle_id", "bull_semen_reference"]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Check if cattle exists
        cattle = await firebase_service.get_document("cattle", ai_data["cattle_id"])
        if not cattle:
            raise HTTPException(status_code=404, detail="Cattle not found")

        ai_date = _to_datetime(ai_data.get("date")) or datetime.utcnow()
        
        # Create AI event
        ai_event = {
            "id": f"ai_{ai_data['cattle_id']}_{int(datetime.now().timestamp())}",
            "cattle_id": ai_data["cattle_id"],
            "date": ai_date,
            "bull_semen_reference": ai_data["bull_semen_reference"],
            "notes": ai_data.get("notes"),
            "created_at": datetime.utcnow()
        }
        
        # Save to Firebase
        success = await firebase_service.create_document("ai_events", ai_event["id"], ai_event)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to log AI event")
        
        # Update synthetic engine to track pregnancy
        if ai_data["cattle_id"] in synthetic_engine.last_readings:
            synthetic_engine.last_readings[ai_data["cattle_id"]]["pregnancy_days"] = 0
        
        return {"message": "AI event logged successfully", "event": ai_event}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging AI event: {str(e)}")

@router.post("/confirm-calving")
async def confirm_calving(calving_data: Dict[str, Any]):
    """Confirm calving event"""
    try:
        cattle_id = calving_data.get("cattle_id")
        if not cattle_id:
            raise HTTPException(status_code=400, detail="Cattle ID required")
        
        # Check if cattle exists
        cattle = await firebase_service.get_document("cattle", cattle_id)
        if not cattle:
            raise HTTPException(status_code=404, detail="Cattle not found")

        calving_date = _to_datetime(calving_data.get("calving_date")) or datetime.utcnow()
        
        # Reset pregnancy in synthetic engine
        if cattle_id in synthetic_engine.last_readings:
            synthetic_engine.last_readings[cattle_id]["pregnancy_days"] = None
        
        # Reset heat cycle
        if cattle_id in synthetic_engine.cattle_profiles:
            synthetic_engine.cattle_profiles[cattle_id]["heat_cycle_day"] = 1
        
        # Create calving record
        calving_record = {
            "id": f"calving_{cattle_id}_{int(datetime.now().timestamp())}",
            "cattle_id": cattle_id,
            "calving_date": calving_date,
            "notes": calving_data.get("notes"),
            "created_at": datetime.utcnow()
        }
        
        # Save to Firebase
        success = await firebase_service.create_document("calving_records", calving_record["id"], calving_record)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to confirm calving")
        
        return {"message": "Calving confirmed successfully", "record": calving_record}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error confirming calving: {str(e)}")

@router.get("/cattle/{tag_id}/history")
async def get_cattle_reproduction_history(tag_id: str):
    """Get reproduction history for a specific cattle"""
    try:
        # Check if cattle exists
        cattle = await firebase_service.get_document("cattle", tag_id)
        if not cattle:
            raise HTTPException(status_code=404, detail="Cattle not found")
        
        # Get AI events
        ai_events = await firebase_service.query_documents("ai_events", "cattle_id", "==", tag_id)
        
        # Get calving records
        calving_records = await firebase_service.query_documents("calving_records", "cattle_id", "==", tag_id)
        
        # Get current synthetic data
        current_data = {}
        if tag_id in synthetic_engine.last_readings:
            last_reading = synthetic_engine.last_readings[tag_id]
            current_data = {
                "heat_score": last_reading.get("heat_score", 0),
                "pregnancy_days": last_reading.get("pregnancy_days"),
                "heat_cycle_day": synthetic_engine.cattle_profiles[tag_id].get("heat_cycle_day", 1)
            }
        
        # Combine and sort timeline
        timeline = []
        
        # Add AI events
        for event in ai_events:
            timeline.append({
                "type": "ai_event",
                "date": event.get("date"),
                "data": event
            })
        
        # Add calving records
        for record in calving_records:
            timeline.append({
                "type": "calving",
                "date": record.get("calving_date"),
                "data": record
            })
        
        # Sort by date
        timeline.sort(key=lambda x: _sort_timestamp(x.get("date")), reverse=True)
        
        return {
            "cattle": cattle,
            "current_status": current_data,
            "timeline": timeline,
            "ai_events_count": len(ai_events),
            "calving_count": len(calving_records)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching reproduction history: {str(e)}")
