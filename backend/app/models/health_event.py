from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class HealthEventType(str, Enum):
    VACCINATION = "vaccination"
    TREATMENT = "treatment"
    VET_VISIT = "vet_visit"
    ILLNESS_NOTE = "illness_note"
    GENERAL_OBSERVATION = "general_observation"

class HealthEvent(BaseModel):
    id: str = Field(..., description="Event unique identifier")
    cattle_id: str = Field(..., description="Cattle tag ID")
    event_type: HealthEventType = Field(..., description="Type of health event")
    date: datetime = Field(..., description="Event date")
    notes: str = Field(..., description="Event notes")
    treated_by: str = Field(..., description="Who performed the treatment")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class HealthEventCreate(BaseModel):
    cattle_id: str
    event_type: HealthEventType
    date: datetime
    notes: str
    treated_by: str
