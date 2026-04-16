from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class MilkSession(str, Enum):
    MORNING = "morning"
    EVENING = "evening"
    NIGHT = "night"

class MilkRecord(BaseModel):
    id: str = Field(..., description="Record unique identifier")
    cattle_id: str = Field(..., description="Cattle tag ID")
    date: datetime = Field(..., description="Milking date")
    session: MilkSession = Field(..., description="Milking session")
    yield_liters: float = Field(..., description="Milk yield in liters", ge=0)
    notes: Optional[str] = Field(None, description="Additional notes")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MilkRecordCreate(BaseModel):
    cattle_id: str
    date: datetime
    session: MilkSession
    yield_liters: float
    notes: Optional[str] = None
