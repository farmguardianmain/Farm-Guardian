# Farm Guardians Backend

Smart Cattle Monitoring Backend - FastAPI service with synthetic data engine.

## Features

- **Synthetic Data Engine**: Generates realistic IoT sensor readings every 30 seconds
- **Real-time Alerts**: Fever, hypothermia, irregular activity, low rumination, milk drop, heat detection
- **REST API**: Complete CRUD operations for cattle, alerts, milk records, and reproduction
- **Firebase Integration**: Firestore for data storage with real-time listeners
- **Demo Ready**: 10 pre-configured cattle with realistic profiles

## Quick Start

### 1. Setup Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Create a service account key:
   - Go to Project Settings → Service accounts
   - Click "Generate new private key"
   - Download the JSON file
4. Save the key as `service-account-key.json` in the backend directory

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Firebase configuration
```

### 4. Run the Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will start generating synthetic data automatically every 30 seconds.

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Cattle Management
- `GET /cattle` - List all cattle
- `POST /cattle` - Create new cattle
- `GET /cattle/{tag_id}` - Get cattle details
- `PUT /cattle/{tag_id}` - Update cattle
- `DELETE /cattle/{tag_id}` - Delete cattle
- `POST /cattle/{tag_id}/milk` - Log milk session
- `POST /cattle/{tag_id}/health-event` - Add health event

### Alerts
- `GET /alerts` - List alerts (filter by status)
- `GET /alerts/{alert_id}` - Get alert details
- `PATCH /alerts/{alert_id}/dismiss` - Dismiss alert
- `GET /alerts/stats/summary` - Alert statistics

### Milk Production
- `GET /milk/summary` - Herd milk summary
- `GET /milk/cattle/{tag_id}/history` - Cattle milk history
- `POST /milk/log-session` - Log milk session

### Reproduction
- `GET /reproduction/heat-detection` - Heat detection list
- `GET /reproduction/pregnancy-tracker` - Pregnancy tracking
- `POST /reproduction/log-ai-event` - Log AI event
- `POST /reproduction/confirm-calving` - Confirm calving
- `GET /reproduction/cattle/{tag_id}/history` - Reproduction history

## Synthetic Data Engine

The backend generates realistic sensor data for demo purposes:

### Data Generated per 30-second Tick
- **Body Temperature**: Gaussian around 38.8°C with 5% fever spikes
- **Activity Level**: Markov chain (Active/Resting/Eating/Ruminating)
- **Rumination**: 7-9 hours daily with health variations
- **Eating**: 4-6 hours daily, correlated with rumination
- **Milk Yield**: Breed-based with Gaussian noise
- **Heat Score**: 21-day sinusoidal cycle, peaks > 75 = heat
- **Pregnancy Days**: Increments daily after AI event

### Alert Conditions
- **Fever**: Temp > 39.5°C for 2+ ticks (Critical)
- **Hypothermia**: Temp < 37.5°C (Critical)
- **Irregular Activity**: Low activity for 12+ hours (Warning)
- **Low Rumination**: < 5 hours in 24h (Warning)
- **Milk Drop**: > 20% decline vs 7-day avg (Warning)
- **Heat Detected**: Score > 75 (Info)
- **Calving Due**: Pregnancy >= 270 days (Info)

## Demo Cattle Profiles

The system includes 10 diverse cattle:

| Tag | Name | Breed | Weight | Base Milk Yield |
|-----|------|-------|--------|----------------|
| TAG001 | Bessie | Holstein | 680kg | 32L/day |
| TAG002 | Daisy | Jersey | 450kg | 24L/day |
| TAG003 | Rosie | Brown Swiss | 620kg | 28L/day |
| TAG004 | Buttercup | Guernsey | 540kg | 26L/day |
| TAG005 | Clover | Ayrshire | 520kg | 25L/day |
| TAG006 | Marigold | Holstein | 700kg | 34L/day |
| TAG007 | Lily | Jersey | 430kg | 22L/day |
| TAG008 | Sunflower | Holstein | 720kg | 35L/day |
| TAG009 | Iris | Brown Swiss | 580kg | 27L/day |
| TAG010 | Daffodil | Guernsey | 510kg | 24L/day |

## Development

### Project Structure
```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── models/              # Pydantic models
│   ├── api/                 # API routers
│   └── services/            # Business logic
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables
└── README.md               # This file
```

### Running Tests
```bash
# Install pytest
pip install pytest

# Run tests
pytest
```

### Ngrok Setup (for mobile access)

1. Install ngrok:
```bash
# Download from https://ngrok.com/download
# Or with npm: npm install -g ngrok
```

2. Start ngrok:
```bash
ngrok http 8000
```

3. Use the ngrok URL in your React Native app instead of localhost

## Troubleshooting

### Firebase Connection Issues
- Ensure `service-account-key.json` is in the backend directory
- Check Firestore rules allow read/write access
- Verify Firebase project is not in test mode

### Synthetic Data Not Generating
- Check the scheduler started successfully (look for "Scheduler started" message)
- Verify Firebase connection is working
- Check for errors in the console output

### Performance Issues
- The synthetic engine generates data every 30 seconds by default
- Adjust `DATA_GENERATION_INTERVAL` in .env if needed
- Consider Firestore indexing for large datasets

## License

MIT License - see LICENSE file for details.
