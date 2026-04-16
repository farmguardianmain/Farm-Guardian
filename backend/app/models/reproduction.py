from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class AIEvent(BaseModel):
    id: str = Field(..., description="Event unique identifier")
    cattle_id: str = Field(..., description="Cattle tag ID")
    date: datetime = Field(..., description="AI date")
    bull_semen_reference: str = Field(..., description="Bull or semen reference")
    notes: Optional[str] = Field(None, description="Additional notes")
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AIEventCreate(BaseModel):
    cattle_id: str
    date: datetime
    bull_semen_reference: str
    notes: Optional[str] = None

class Pregnancy(BaseModel):
    id: str = Field(..., description="Pregnancy unique identifier")
    cattle_id: str = Field(..., description="Cattle tag ID")
    conception_date: datetime = Field(..., description="Date of conception")
    expected_calving_date: datetime = Field(..., description="Expected calving date")
    days_pregnant: int = Field(..., description="Days since conception", ge=0, le=285)
    confirmed: bool = Field(default=False)
    calving_confirmed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
