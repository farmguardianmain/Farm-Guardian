# Farm Guardians

Smart Cattle Monitoring Mobile Application - A comprehensive proof-of-concept for dairy farm management.

![Farm Guardians Logo](https://via.placeholder.com/150x150/2D6A4F/FFFFFF?text=🐄)

## Overview

Farm Guardians is a React Native mobile application with a Python FastAPI backend that demonstrates modern IoT-based cattle monitoring. The app uses a synthetic data engine to simulate real-world sensor readings, enabling a full working demo without physical hardware.

**Key Features:**
- 🐄 **Cattle Registry** - Complete herd management with detailed profiles
- 📊 **Dashboard** - Real-time overview with alerts and activity monitoring
- 🚨 **Health Alerts** - Automated alerts for fever, hypothermia, irregular activity, and more
- 🥛 **Milk Production** - Track yields, trends, and production analytics
- 💕 **Reproduction** - Heat detection, AI event logging, and pregnancy tracking

## Architecture

### Frontend (React Native/Expo)
- **Framework**: Expo managed workflow
- **UI**: React Native Paper with custom theme
- **Charts**: Victory Native for data visualization
- **State Management**: Zustand
- **Navigation**: React Navigation (bottom tabs + stack)
- **Authentication**: Demo mode with hardcoded credentials

### Backend (Python/FastAPI)
- **Framework**: FastAPI with automatic API documentation
- **Database**: Firebase Firestore with real-time listeners
- **Synthetic Data**: APScheduler-powered data generation engine
- **API**: RESTful endpoints with proper error handling

### Data Flow
```
Synthetic Engine → Firebase Firestore → React Native App (Real-time)
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Expo CLI
- Firebase account
- ngrok (for mobile testing)

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

#### Firebase Configuration
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Generate service account key:
   - Project Settings → Service accounts → Generate new private key
   - Download JSON file as `service-account-key.json`
4. Copy the key to the backend directory

#### Start Backend
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will:
- Start generating synthetic data every 30 seconds
- Create 10 demo cattle with realistic profiles
- Generate alerts based on sensor conditions
- Serve API at http://localhost:8000

### 2. Frontend Setup

```bash
cd frontend
npm install
```

#### Configure Firebase
Update `src/services/firebase.js` with your Firebase configuration:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  // ... other config
};
```

#### Start Frontend
```bash
cd frontend
npx expo start
```

### 3. Mobile Testing with ngrok

1. Start ngrok for the backend:
```bash
ngrok http 8000
```

2. Update `src/services/api.js`:
```javascript
const API_BASE_URL = 'https://your-ngrok-url.ngrok.io';
```

3. Run the Expo app on your device:
```bash
npx expo start --tunnel
```

## Demo Credentials

**Email**: `farm@farmguardian.app`  
**Password**: `herd`

## Features in Detail

### 🐄 Cattle Registry
- Complete CRUD operations for cattle management
- Breed-specific data (Holstein, Jersey, Brown Swiss, etc.)
- Live sensor readings with 30-second refresh
- Health event logging
- Milk production history
- Reproduction timeline

### 📊 Dashboard
- Real-time herd overview
- Summary cards: Total cattle, heat alerts, health alerts, milk yield
- Active alerts feed with dismiss functionality
- Herd activity distribution (Active/Resting/Eating/Ruminating)
- Color-coded status indicators

### 🚨 Health & Alerts
- Automated alert generation:
  - **Fever**: Temperature > 39.5°C (Critical)
  - **Hypothermia**: Temperature < 37.5°C (Critical)
  - **Irregular Activity**: Low activity for 12+ hours (Warning)
  - **Low Rumination**: < 5 hours in 24h (Warning)
  - **Milk Drop**: > 20% decline vs 7-day average (Warning)
  - **Heat Detection**: Score > 75 (Info)
  - **Calving Due**: Pregnancy ≥ 270 days (Info)

### 🥛 Milk Production
- Daily milk yield tracking
- 7-day production trend charts
- Top/bottom producer rankings
- Per-cattle 30-day history
- Manual milk session logging

### 💕 Reproduction
- Heat detection with scoring algorithm
- Optimal AI window identification
- AI event logging
- Pregnancy tracking with progress visualization
- Calving confirmation

## Synthetic Data Engine

The backend generates realistic sensor data:

| Metric | Normal Range | Generation Method |
|---------|--------------|------------------|
| Body Temperature | 38.0-39.5°C | Gaussian noise + 5% fever spikes |
| Activity | Active/Resting/Eating/Ruminating | Markov chain with time-based probabilities |
| Rumination | 7-9 hours/day | Correlated with health status |
| Eating | 4-6 hours/day | Correlated with rumination |
| Milk Yield | Breed-dependent | Base yield + Gaussian noise |
| Heat Score | 0-100 | 21-day sinusoidal cycle |
| Pregnancy | 0-285 days | Daily increment after AI |

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints
- `GET /cattle` - List all cattle
- `POST /cattle` - Create cattle
- `GET /alerts` - List alerts
- `GET /milk/summary` - Milk production summary
- `GET /reproduction/heat-detection` - Heat detection data
- `POST /admin/tick` - Manual data generation trigger

## Project Structure

```
farm-guardians/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── api/            # API routers
│   │   ├── models/         # Pydantic models
│   │   ├── services/       # Business logic
│   │   └── main.py        # FastAPI app
│   ├── requirements.txt
│   └── README.md
├── frontend/               # React Native app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── navigation/    # App navigation
│   │   ├── screens/       # Screen components
│   │   ├── services/      # API & Firebase
│   │   ├── store/         # State management
│   │   └── theme/         # UI theme
│   ├── App.js
│   └── package.json
└── README.md              # This file
```

## Technology Stack

### Frontend
- **React Native** with Expo
- **React Native Paper** for UI components
- **Victory Native** for charts
- **Zustand** for state management
- **React Navigation** for navigation
- **Firebase SDK** for real-time data

### Backend
- **FastAPI** for REST API
- **Firebase Admin SDK** for database
- **APScheduler** for background tasks
- **Pydantic** for data validation
- **Uvicorn** for ASGI server

## Development

### Running Tests
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Code Style
- Backend: PEP 8 with Black formatting
- Frontend: ESLint + Prettier

### Environment Variables
Backend (`.env`):
```env
FIREBASE_SERVICE_ACCOUNT_KEY=service-account-key.json
DEBUG=True
HOST=0.0.0.0
PORT=8000
DATA_GENERATION_INTERVAL=30
```

## Demo Data

The system includes 10 pre-configured cattle:

| Tag | Name | Breed | Weight | Daily Yield |
|-----|------|-------|--------|-------------|
| TAG001 | Bessie | Holstein | 680kg | 32L |
| TAG002 | Daisy | Jersey | 450kg | 24L |
| TAG003 | Rosie | Brown Swiss | 620kg | 28L |
| TAG004 | Buttercup | Guernsey | 540kg | 26L |
| TAG005 | Clover | Ayrshire | 520kg | 25L |
| TAG006 | Marigold | Holstein | 700kg | 34L |
| TAG007 | Lily | Jersey | 430kg | 22L |
| TAG008 | Sunflower | Holstein | 720kg | 35L |
| TAG009 | Iris | Brown Swiss | 580kg | 27L |
| TAG010 | Daffodil | Guernsey | 510kg | 24L |

## Performance

- **Dashboard Load Time**: < 2 seconds on Wi-Fi
- **Data Refresh**: Every 30 seconds (configurable)
- **Memory Usage**: Optimized for mobile devices
- **Battery Life**: Minimal impact with efficient polling

## Troubleshooting

### Common Issues

**Backend won't start**
- Check Python version (3.11+)
- Verify Firebase service account key
- Install requirements: `pip install -r requirements.txt`

**Frontend can't connect to backend**
- Ensure backend is running on port 8000
- Check ngrok tunnel if testing on device
- Verify API_BASE_URL in `src/services/api.js`

**No real-time updates**
- Check Firebase configuration
- Verify Firestore rules allow read/write access
- Check network connectivity

**Synthetic data not generating**
- Look for scheduler startup messages
- Check Firebase connection logs
- Try manual trigger: `POST /admin/tick`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions or issues:
- Create an issue in this repository
- Check the troubleshooting section
- Review API documentation at `/docs`

---

**Farm Guardians** - Modernizing cattle farming with smart technology 🐄📱
