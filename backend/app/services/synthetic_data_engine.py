import random
import math
from datetime import datetime, timedelta
from typing import Dict, List, Any
from app.models.cattle import Breed
from app.models.sensor_data import SensorReading
from app.models.alerts import Alert, AlertType, AlertSeverity
from app.services.firebase_service import firebase_service

class SyntheticDataEngine:
    def __init__(self):
        self.cattle_profiles = {}
        self.last_readings = {}
        self.alert_conditions = {}
        self.last_milk_session_logged = {}
        
    async def initialize_cattle_profiles(self):
        """Initialize realistic cattle profiles for demo"""
        self.cattle_profiles = {}
        self.last_readings = {}
        self.alert_conditions = {}
        self.last_milk_session_logged = {}

        profiles = [
            {
                "tag_id": "TAG001",
                "name": "Bessie",
                "breed": Breed.HOLSTEIN,
                "date_of_birth": datetime(2022, 3, 15),
                "weight": 680.0,
                "base_milk_yield": 32.0,  # liters per day
                "heat_cycle_day": random.randint(1, 21)
            },
            {
                "tag_id": "TAG002", 
                "name": "Daisy",
                "breed": Breed.JERSEY,
                "date_of_birth": datetime(2021, 7, 22),
                "weight": 450.0,
                "base_milk_yield": 24.0,
                "heat_cycle_day": random.randint(1, 21)
            },
            {
                "tag_id": "TAG003",
                "name": "Rosie",
                "breed": Breed.BROWN_SWISS,
                "date_of_birth": datetime(2023, 1, 10),
                "weight": 620.0,
                "base_milk_yield": 28.0,
                "heat_cycle_day": random.randint(1, 21)
            },
            {
                "tag_id": "TAG004",
                "name": "Buttercup",
                "breed": Breed.GUERNSEY,
                "date_of_birth": datetime(2022, 11, 5),
                "weight": 540.0,
                "base_milk_yield": 26.0,
                "heat_cycle_day": random.randint(1, 21)
            },
            {
                "tag_id": "TAG005",
                "name": "Clover",
                "breed": Breed.AYRSHIRE,
                "date_of_birth": datetime(2023, 2, 18),
                "weight": 520.0,
                "base_milk_yield": 25.0,
                "heat_cycle_day": random.randint(1, 21)
            },
            {
                "tag_id": "TAG006",
                "name": "Marigold",
                "breed": Breed.HOLSTEIN,
                "date_of_birth": datetime(2021, 12, 8),
                "weight": 700.0,
                "base_milk_yield": 34.0,
                "heat_cycle_day": random.randint(1, 21)
            },
            {
                "tag_id": "TAG007",
                "name": "Lily",
                "breed": Breed.JERSEY,
                "date_of_birth": datetime(2022, 8, 30),
                "weight": 430.0,
                "base_milk_yield": 22.0,
                "heat_cycle_day": random.randint(1, 21)
            },
            {
                "tag_id": "TAG008",
                "name": "Sunflower",
                "breed": Breed.HOLSTEIN,
                "date_of_birth": datetime(2020, 5, 12),
                "weight": 720.0,
                "base_milk_yield": 35.0,
                "heat_cycle_day": random.randint(1, 21)
            },
            {
                "tag_id": "TAG009",
                "name": "Iris",
                "breed": Breed.BROWN_SWISS,
                "date_of_birth": datetime(2023, 4, 3),
                "weight": 580.0,
                "base_milk_yield": 27.0,
                "heat_cycle_day": random.randint(1, 21)
            },
            {
                "tag_id": "TAG010",
                "name": "Daffodil",
                "breed": Breed.GUERNSEY,
                "date_of_birth": datetime(2022, 9, 17),
                "weight": 510.0,
                "base_milk_yield": 24.0,
                "heat_cycle_day": random.randint(1, 21)
            }
        ]
        
        for profile in profiles:
            self.cattle_profiles[profile["tag_id"]] = profile
            # Initialize last readings
            self.last_readings[profile["tag_id"]] = {
                "temperature": 38.8,
                "activity": "resting",
                "rumination_24h": 8.0,
                "eating_24h": 5.0,
                "milk_yield": profile["base_milk_yield"],
                "heat_score": 30.0,
                "pregnancy_days": None
            }
            
            # Initialize alert conditions
            self.alert_conditions[profile["tag_id"]] = {
                "fever_ticks": 0,
                "low_activity_hours": 0,
                "milk_decline_percent": 0,
                "last_milk_avg": profile["base_milk_yield"]
            }

            await self._ensure_cattle_document(profile)

    async def _ensure_cattle_document(self, profile: Dict[str, Any]):
        """Ensure each synthetic profile exists in the cattle collection."""
        tag_id = profile["tag_id"]

        existing = await firebase_service.get_document("cattle", tag_id)
        if existing:
            return

        breed = profile.get("breed")
        breed_value = breed.value if hasattr(breed, "value") else breed

        cattle_doc = {
            "tag_id": tag_id,
            "name": profile["name"],
            "breed": breed_value,
            "date_of_birth": profile["date_of_birth"],
            "weight": profile["weight"],
            "status": "healthy",
            "notes": "",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        created = await firebase_service.create_document("cattle", tag_id, cattle_doc)
        if not created:
            print(f"⚠️ Failed to seed cattle profile for {tag_id}")

    def _get_milk_session(self, hour: int) -> str:
        if 4 <= hour < 12:
            return "morning"
        if 12 <= hour < 20:
            return "evening"
        return "night"

    async def _record_milk_session(self, tag_id: str, reading: SensorReading):
        """Create one milk record per cattle per session to keep summaries meaningful."""
        now = datetime.utcnow()
        session = self._get_milk_session(now.hour)
        session_key = f"{now.date().isoformat()}_{session}"

        if self.last_milk_session_logged.get(tag_id) == session_key:
            return

        session_fraction = {
            "morning": 0.55,
            "evening": 0.40,
            "night": 0.05,
        }
        base_session_yield = reading.milk_yield_liters * session_fraction.get(session, 0.33)
        yield_liters = round(max(0.5, base_session_yield + random.uniform(-0.4, 0.4)), 2)

        record_id = f"milk_{tag_id}_{now.strftime('%Y%m%d')}_{session}"
        milk_record = {
            "id": record_id,
            "cattle_id": tag_id,
            "date": now,
            "session": session,
            "yield_liters": yield_liters,
            "notes": "Synthetic session",
            "created_at": now,
        }

        created = await firebase_service.create_document("milk_records", record_id, milk_record)
        if created:
            self.last_milk_session_logged[tag_id] = session_key
    
    def generate_sensor_reading(self, tag_id: str) -> SensorReading:
        """Generate realistic sensor reading for a specific cattle"""
        if tag_id not in self.cattle_profiles:
            raise ValueError(f"Cattle {tag_id} not found in profiles")
        
        profile = self.cattle_profiles[tag_id]
        last_reading = self.last_readings[tag_id]
        current_hour = datetime.now().hour
        
        # Generate body temperature with occasional fever spikes
        if random.random() < 0.05:  # 5% chance of fever spike
            temperature = random.uniform(39.6, 40.2)
        else:
            temperature = max(37.0, min(40.0, random.gauss(38.8, 0.3)))
        
        # Generate activity based on time of day and current state
        activity = self._generate_activity(current_hour, last_reading["activity"])
        
        # Generate rumination and eating times (correlated)
        if activity == "ruminating":
            rumination = min(12.0, last_reading["rumination_24h"] + random.uniform(0.1, 0.3))
            eating = max(2.0, last_reading["eating_24h"] - random.uniform(0.05, 0.15))
        elif activity == "eating":
            eating = min(8.0, last_reading["eating_24h"] + random.uniform(0.1, 0.3))
            rumination = max(4.0, last_reading["rumination_24h"] - random.uniform(0.05, 0.15))
        else:
            rumination = max(4.0, min(10.0, last_reading["rumination_24h"] + random.uniform(-0.1, 0.1)))
            eating = max(3.0, min(7.0, last_reading["eating_24h"] + random.uniform(-0.1, 0.1)))
        
        # Generate milk yield with variations
        milk_variation = random.gauss(0, profile["base_milk_yield"] * 0.1)
        milk_yield = max(profile["base_milk_yield"] * 0.7, 
                        profile["base_milk_yield"] + milk_variation)
        
        # Generate heat score (21-day cycle)
        heat_cycle_day = (profile["heat_cycle_day"] + 1) % 21
        profile["heat_cycle_day"] = heat_cycle_day
        
        # Heat score peaks around day 12-14 of cycle
        if 12 <= heat_cycle_day <= 14:
            heat_score = random.uniform(75, 95)  # In heat
        elif 10 <= heat_cycle_day <= 16:
            heat_score = random.uniform(40, 70)  # Approaching heat
        else:
            heat_score = random.uniform(10, 30)  # Normal
        
        # Update last readings
        self.last_readings[tag_id].update({
            "temperature": temperature,
            "activity": activity,
            "rumination_24h": rumination,
            "eating_24h": eating,
            "milk_yield": milk_yield,
            "heat_score": heat_score
        })
        
        return SensorReading(
            cattle_id=tag_id,
            body_temperature=temperature,
            activity_level=activity,
            rumination_hours_24h=rumination,
            eating_hours_24h=eating,
            milk_yield_liters=milk_yield,
            heat_score=heat_score,
            pregnancy_days=last_reading.get("pregnancy_days")
        )
    
    def _generate_activity(self, hour: int, current_activity: str) -> str:
        """Generate realistic activity based on time of day"""
        # Define activity probabilities by hour
        if 6 <= hour <= 8:  # Morning - active
            probabilities = {"active": 0.6, "eating": 0.3, "resting": 0.08, "ruminating": 0.02}
        elif 9 <= hour <= 11:  # Late morning - eating
            probabilities = {"eating": 0.5, "active": 0.3, "ruminating": 0.15, "resting": 0.05}
        elif 12 <= hour <= 14:  # Afternoon - resting
            probabilities = {"resting": 0.5, "ruminating": 0.3, "active": 0.15, "eating": 0.05}
        elif 15 <= hour <= 17:  # Late afternoon - active
            probabilities = {"active": 0.4, "eating": 0.3, "ruminating": 0.2, "resting": 0.1}
        elif 18 <= hour <= 20:  # Evening - eating
            probabilities = {"eating": 0.6, "active": 0.2, "ruminating": 0.15, "resting": 0.05}
        else:  # Night - resting/ruminating
            probabilities = {"resting": 0.4, "ruminating": 0.4, "active": 0.1, "eating": 0.1}
        
        # Add some persistence - 70% chance to stay in current activity
        if random.random() < 0.7:
            return current_activity
        
        # Otherwise, choose based on probabilities
        return random.choices(
            list(probabilities.keys()),
            weights=list(probabilities.values())
        )[0]
    
    async def check_alert_conditions(self, tag_id: str, reading: SensorReading) -> List[Alert]:
        """Check if any alert conditions are met for a reading"""
        alerts = []
        conditions = self.alert_conditions[tag_id]
        
        # Check for fever
        if reading.body_temperature > 39.5:
            conditions["fever_ticks"] += 1
            if conditions["fever_ticks"] >= 2:
                alerts.append(Alert(
                    id=f"fever_{tag_id}_{int(datetime.now().timestamp())}",
                    cattle_id=tag_id,
                    alert_type=AlertType.FEVER,
                    severity=AlertSeverity.CRITICAL,
                    title="Fever Detected",
                    description=f"High body temperature of {reading.body_temperature:.1f}°C detected",
                    recommended_action="Isolate the animal and monitor closely. Consider veterinary consultation."
                ))
        else:
            conditions["fever_ticks"] = 0
        
        # Check for hypothermia
        if reading.body_temperature < 37.5:
            alerts.append(Alert(
                id=f"hypothermia_{tag_id}_{int(datetime.now().timestamp())}",
                cattle_id=tag_id,
                alert_type=AlertType.HYPOTHERMIA,
                severity=AlertSeverity.CRITICAL,
                title="Hypothermia Risk",
                description=f"Low body temperature of {reading.body_temperature:.1f}°C detected",
                recommended_action="Provide warm shelter and monitor temperature closely."
            ))
        
        # Check for irregular activity
        if reading.activity_level == "resting":
            conditions["low_activity_hours"] += 0.5  # Each tick is 30 seconds
        else:
            conditions["low_activity_hours"] = 0
        
        if conditions["low_activity_hours"] >= 12:  # 12 hours of low activity
            alerts.append(Alert(
                id=f"irregular_activity_{tag_id}_{int(datetime.now().timestamp())}",
                cattle_id=tag_id,
                alert_type=AlertType.IRREGULAR_ACTIVITY,
                severity=AlertSeverity.WARNING,
                title="Irregular Activity",
                description="Animal has been inactive for 12+ hours",
                recommended_action="Check animal health and encourage movement."
            ))
        
        # Check for low rumination
        if reading.rumination_hours_24h < 5.0:
            alerts.append(Alert(
                id=f"low_rumination_{tag_id}_{int(datetime.now().timestamp())}",
                cattle_id=tag_id,
                alert_type=AlertType.LOW_RUMINATION,
                severity=AlertSeverity.WARNING,
                title="Low Rumination",
                description=f"Low rumination time: {reading.rumination_hours_24h:.1f} hours in last 24h",
                recommended_action="Monitor feed intake and check for digestive issues."
            ))
        
        # Check for milk drop
        if conditions["last_milk_avg"] > 0:
            milk_decline = (conditions["last_milk_avg"] - reading.milk_yield_liters) / conditions["last_milk_avg"] * 100
            if milk_decline > 20:
                alerts.append(Alert(
                    id=f"milk_drop_{tag_id}_{int(datetime.now().timestamp())}",
                    cattle_id=tag_id,
                    alert_type=AlertType.MILK_DROP,
                    severity=AlertSeverity.WARNING,
                    title="Milk Production Drop",
                    description=f"Milk yield declined by {milk_decline:.1f}% vs 7-day average",
                    recommended_action="Check nutrition and health status."
                ))
        
        # Check for heat detection
        if reading.heat_score > 75:
            alerts.append(Alert(
                id=f"heat_detected_{tag_id}_{int(datetime.now().timestamp())}",
                cattle_id=tag_id,
                alert_type=AlertType.HEAT_DETECTED,
                severity=AlertSeverity.INFO,
                title="Heat Detected",
                description=f"Heat score of {reading.heat_score:.0f} indicates optimal breeding time",
                recommended_action="Consider artificial insemination within next 12-24 hours."
            ))
        
        # Check for calving due
        if reading.pregnancy_days and reading.pregnancy_days >= 270:
            alerts.append(Alert(
                id=f"calving_due_{tag_id}_{int(datetime.now().timestamp())}",
                cattle_id=tag_id,
                alert_type=AlertType.CALVING_DUE,
                severity=AlertSeverity.INFO,
                title="Calving Due",
                description=f"Pregnancy day {reading.pregnancy_days} - calving imminent",
                recommended_action="Prepare calving area and monitor closely."
            ))
        
        return alerts
    
    async def generate_data_tick(self):
        """Generate one tick of data for all cattle"""
        if not self.cattle_profiles:
            await self.initialize_cattle_profiles()

        for tag_id in list(self.cattle_profiles.keys()):
            # Generate sensor reading
            reading = self.generate_sensor_reading(tag_id)

            # Make sure cattle identity data exists before telemetry updates.
            await self._ensure_cattle_document(self.cattle_profiles[tag_id])
            
            # Save to Firebase
            await firebase_service.create_document(
                "sensor_readings",
                f"{tag_id}_{int(datetime.now().timestamp())}",
                reading.dict()
            )

            await self._record_milk_session(tag_id, reading)
            
            # Check for alerts
            alerts = await self.check_alert_conditions(tag_id, reading)
            for alert in alerts:
                await firebase_service.create_document(
                    "alerts",
                    alert.id,
                    alert.dict()
                )

# Global instance
synthetic_engine = SyntheticDataEngine()
