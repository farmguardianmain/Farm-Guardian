from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime, timedelta, timezone
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

@router.get("/summary")
async def get_milk_summary():
    """Get herd milk production summary"""
    try:
        # Get all milk records for today
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        # In a real implementation, you'd use date range queries
        all_records = await firebase_service.get_collection("milk_records")
        
        # Filter for today's records
        today_records = []
        for record in all_records:
            record_date = _to_datetime(record.get("date"))
            if record_date and record_date.date() == today:
                today_records.append({**record, "_parsed_date": record_date})
        
        # Calculate today's total yield
        today_total = sum(record.get("yield_liters", 0) for record in today_records)
        
        # Get 7-day history
        seven_days_ago = today - timedelta(days=7)
        recent_records = []
        for record in all_records:
            record_date = _to_datetime(record.get("date"))
            if record_date and record_date.date() >= seven_days_ago:
                recent_records.append({**record, "_parsed_date": record_date})
        
        # Group by day for 7-day chart
        daily_totals = {}
        for i in range(7):
            date = today - timedelta(days=i)
            daily_totals[date] = 0
        
        for record in recent_records:
            record_date = record["_parsed_date"].date()
            if record_date in daily_totals:
                daily_totals[record_date] += record.get("yield_liters", 0)
        
        # Convert to list for chart (sorted by date)
        chart_data = [
            {"date": date.strftime("%Y-%m-%d"), "yield": total}
            for date, total in sorted(daily_totals.items())
        ]
        
        # Get top and bottom producers for today
        cattle_yields = {}
        for record in today_records:
            cattle_id = record.get("cattle_id")
            cattle_yields[cattle_id] = cattle_yields.get(cattle_id, 0) + record.get("yield_liters", 0)
        
        # Get cattle names
        top_producers = []
        bottom_producers = []
        
        if cattle_yields:
            # Sort by yield
            sorted_cattle = sorted(cattle_yields.items(), key=lambda x: x[1], reverse=True)
            
            # Get cattle details for top 3
            for cattle_id, total_yield in sorted_cattle[:3]:
                cattle = await firebase_service.get_document("cattle", cattle_id)
                if cattle:
                    top_producers.append({
                        "cattle_id": cattle_id,
                        "name": cattle.get("name", cattle_id),
                        "yield": total_yield
                    })
            
            # Get cattle details for bottom 3
            for cattle_id, total_yield in sorted_cattle[-3:]:
                cattle = await firebase_service.get_document("cattle", cattle_id)
                if cattle:
                    bottom_producers.append({
                        "cattle_id": cattle_id,
                        "name": cattle.get("name", cattle_id),
                        "yield": total_yield
                    })
        
        return {
            "today_total": today_total,
            "seven_day_chart": chart_data,
            "top_producers": top_producers,
            "bottom_producers": bottom_producers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching milk summary: {str(e)}")

@router.get("/cattle/{tag_id}/history")
async def get_cattle_milk_history(tag_id: str, days: int = 30):
    """Get milk production history for a specific cattle"""
    try:
        # Check if cattle exists
        cattle = await firebase_service.get_document("cattle", tag_id)
        if not cattle:
            raise HTTPException(status_code=404, detail="Cattle not found")
        
        # Get milk records for this cattle
        all_records = await firebase_service.query_documents("milk_records", "cattle_id", "==", tag_id)
        
        # Filter by date range
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        recent_records = []
        for record in all_records:
            created_at = _to_datetime(record.get("created_at"))
            if created_at and created_at >= cutoff_date:
                recent_records.append({**record, "_parsed_created_at": created_at})
        
        # Sort by date
        recent_records.sort(key=lambda x: x.get("_parsed_created_at", datetime.min), reverse=True)

        # Remove temporary parsed field from API payload
        recent_records = [{k: v for k, v in record.items() if k != "_parsed_created_at"} for record in recent_records]
        
        # Calculate trend
        if len(recent_records) >= 14:
            # Compare last 7 days to previous 7 days
            recent_7 = sum(r.get("yield_liters", 0) for r in recent_records[:7])
            previous_7 = sum(r.get("yield_liters", 0) for r in recent_records[7:14])
            
            if previous_7 > 0:
                change_percent = ((recent_7 - previous_7) / previous_7) * 100
                if change_percent > 5:
                    trend = "rising"
                elif change_percent < -5:
                    trend = "declining"
                else:
                    trend = "stable"
            else:
                trend = "stable"
        else:
            trend = "stable"
        
        return {
            "cattle": cattle,
            "records": recent_records,
            "trend": trend,
            "total_records": len(recent_records)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching milk history: {str(e)}")

@router.post("/log-session")
async def log_milk_session(milk_data: Dict[str, Any]):
    """Log a milk session"""
    try:
        # Validate required fields
        if not all(key in milk_data for key in ["cattle_id", "yield_liters"]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Check if cattle exists
        cattle = await firebase_service.get_document("cattle", milk_data["cattle_id"])
        if not cattle:
            raise HTTPException(status_code=404, detail="Cattle not found")

        session_date = _to_datetime(milk_data.get("date")) or datetime.utcnow()
        
        # Create milk record
        milk_record = {
            "id": f"milk_{milk_data['cattle_id']}_{int(datetime.now().timestamp())}",
            "cattle_id": milk_data["cattle_id"],
            "date": session_date,
            "session": milk_data.get("session", "morning"),
            "yield_liters": milk_data["yield_liters"],
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
