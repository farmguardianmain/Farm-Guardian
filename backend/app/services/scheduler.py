from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.services.synthetic_data_engine import synthetic_engine
import asyncio
import os
from urllib.request import Request, urlopen

scheduler = AsyncIOScheduler()


def _is_truthy(value: str) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


async def self_ping_job():
    """Ping a public health URL to keep free-tier backends warm."""
    ping_url = os.getenv("SELF_PING_URL")
    if not ping_url:
        return

    def _do_ping() -> int:
        request = Request(
            ping_url,
            headers={"User-Agent": "farm-guardians-self-ping/1.0"},
        )
        with urlopen(request, timeout=20) as response:
            return response.status

    try:
        status_code = await asyncio.to_thread(_do_ping)
        print(f"🌐 Self-ping OK ({status_code}) -> {ping_url}")
    except Exception as e:
        print(f"⚠️ Self-ping failed: {e}")

async def data_generation_job():
    """Background job to generate synthetic data"""
    try:
        await synthetic_engine.generate_data_tick()
        print(f"🔄 Data tick generated at {asyncio.get_event_loop().time()}")
    except Exception as e:
        print(f"❌ Error in data generation job: {e}")

def start_scheduler():
    """Start the APScheduler for synthetic data generation"""
    try:
        # Initialize cattle profiles first
        asyncio.create_task(synthetic_engine.initialize_cattle_profiles())

        data_generation_interval = int(os.getenv("DATA_GENERATION_INTERVAL", "30"))
        data_generation_interval = max(1, data_generation_interval)
        
        # Schedule data generation at configured interval
        scheduler.add_job(
            data_generation_job,
            trigger=IntervalTrigger(seconds=data_generation_interval),
            id="data_generation",
            name="Generate synthetic sensor data",
            replace_existing=True
        )

        # Optional self-ping for hosting environments that sleep idle services.
        if _is_truthy(os.getenv("SELF_PING_ENABLED", "false")):
            ping_url = os.getenv("SELF_PING_URL")
            if ping_url:
                ping_interval = int(os.getenv("SELF_PING_INTERVAL_MINUTES", "10"))
                ping_interval = max(1, ping_interval)

                scheduler.add_job(
                    self_ping_job,
                    trigger=IntervalTrigger(minutes=ping_interval),
                    id="self_ping",
                    name="Keep backend warm with self ping",
                    replace_existing=True,
                )
                print(f"✅ Self-ping enabled - every {ping_interval} minute(s) to {ping_url}")
            else:
                print("⚠️ SELF_PING_ENABLED is true but SELF_PING_URL is empty. Skipping self-ping job.")
        
        scheduler.start()
        print(f"✅ Scheduler started - generating data every {data_generation_interval} seconds")
        
    except Exception as e:
        print(f"❌ Failed to start scheduler: {e}")

def stop_scheduler():
    """Stop the APScheduler"""
    try:
        scheduler.shutdown()
        print("⏹️  Scheduler stopped")
    except Exception as e:
        print(f"❌ Error stopping scheduler: {e}")
