from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class CattleStatus(str, Enum):
    HEALTHY = "healthy"
    ALERT = "alert"
    IN_HEAT = "in_heat"
    PREGNANT = "pregnant"
    DRY = "dry"

class Breed(str, Enum):
    HOLSTEIN = "holstein"
    JERSEY = "jersey"
    BROWN_SWISS = "brown_swiss"
    GUERNSEY = "guernsey"
    AYRSHIRE = "ayrshire"

class Cattle(BaseModel):
    tag_id: str = Field(..., description="Unique tag identifier")
    name: str = Field(..., description="Cattle name")
    breed: Breed = Field(..., description="Cattle breed")
    date_of_birth: datetime = Field(..., description="Date of birth")
    weight: float = Field(..., description="Weight in kg", gt=0)
    status: CattleStatus = Field(default=CattleStatus.HEALTHY)
    notes: Optional[str] = Field(None, description="Additional notes")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CattleCreate(BaseModel):
    tag_id: str
    name: str
    breed: Breed
    date_of_birth: datetime
    weight: float
    notes: Optional[str] = None

class CattleUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[Breed] = None
    date_of_birth: Optional[datetime] = None
    weight: Optional[float] = None
    status: Optional[CattleStatus] = None
    notes: Optional[str] = None
