from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import cattle, alerts, milk, reproduction
from app.services.scheduler import start_scheduler
import uvicorn

app = FastAPI(
    title="Farm Guardians API",
    description="Smart Cattle Monitoring Backend",
    version="2.0.0"
)

# Configure CORS for React Native development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your React Native app domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(cattle.router, prefix="/cattle", tags=["cattle"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(milk.router, prefix="/milk", tags=["milk"])
app.include_router(reproduction.router, prefix="/reproduction", tags=["reproduction"])

@app.on_event("startup")
async def startup_event():
    # Start the synthetic data generation scheduler
    start_scheduler()

@app.get("/")
async def root():
    return {"message": "Farm Guardians API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
