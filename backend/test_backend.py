# Wrapping the FULL backend so old startup scripts still work!
import uvicorn
from app.main import app

if __name__ == "__main__":
    print("🐄 Starting FULL Farm Guardians Backend (Production/Advanced Mode)")
    print("📱 API will be available at: http://0.0.0.0:8002")
    print("📖 Docs available at: http://localhost:8002/docs")
    uvicorn.run(app, host="0.0.0.0", port=8002)
