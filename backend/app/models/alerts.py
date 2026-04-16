from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class AlertType(str, Enum):
    FEVER = "fever"
    HYPOTHERMIA = "hypothermia"
    IRREGULAR_ACTIVITY = "irregular_activity"
    LOW_RUMINATION = "low_rumination"
    MILK_DROP = "milk_drop"
    HEAT_DETECTED = "heat_detected"
    CALVING_DUE = "calving_due"

class AlertSeverity(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"

class Alert(BaseModel):
    id: str = Field(..., description="Alert unique identifier")
    cattle_id: str = Field(..., description="Cattle tag ID")
    alert_type: AlertType = Field(..., description="Type of alert")
    severity: AlertSeverity = Field(..., description="Alert severity level")
    title: str = Field(..., description="Alert title")
    description: str = Field(..., description="Alert description")
    recommended_action: str = Field(..., description="Recommended action")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    dismissed: bool = Field(default=False)
    dismissed_at: Optional[datetime] = None

class AlertCreate(BaseModel):
    cattle_id: str
    alert_type: AlertType
    title: str
    description: str
    recommended_action: str
