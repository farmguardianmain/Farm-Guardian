from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class SensorReading(BaseModel):
    cattle_id: str = Field(..., description="Cattle tag ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Vital signs
    body_temperature: float = Field(..., description="Body temperature in Celsius", ge=35.0, le=42.0)
    
    # Activity metrics
    activity_level: str = Field(..., description="Current activity state")
    rumination_hours_24h: float = Field(..., description="Rumination time in last 24 hours", ge=0, le=24)
    eating_hours_24h: float = Field(..., description="Eating time in last 24 hours", ge=0, le=24)
    
    # Production metrics
    milk_yield_liters: float = Field(..., description="Milk yield in liters", ge=0)
    
    # Reproduction metrics
    heat_score: float = Field(..., description="Heat detection score", ge=0, le=100)
    pregnancy_days: Optional[int] = Field(None, description="Days since conception", ge=0, le=285)

class ActivityLevel(str):
    ACTIVE = "active"
    RESTING = "resting"
    EATING = "eating"
    RUMINATING = "ruminating"
