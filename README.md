# Pack Leader

**Your journey, your pack, one app.**

Pack Leader is a hybrid trip-planning, real-time group-tracking, navigation, safety, and expense-management mobile application. It supports motorcycle touring, hiking, road trips, solo travel, and family travel.

## Architecture

```
┌─────────────────┐
│   React Native   │  Mobile Frontend (Expo + TypeScript)
│    (mobile/)     │
└────────┬────────┘
         │ REST API + WebSocket
┌────────▼────────┐
│  Node.js/Express │  Application Server (TypeScript)
│   (backend/)     │
└──┬──────┬───────┘
   │      │
┌──▼──┐ ┌─▼──────┐
│Mongo│ │Firebase │   Data Layer
│ DB  │ │Services │
└─────┘ └────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architectural overview.

## Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- MongoDB (local or Atlas)
- Expo Go app on your device (or iOS/Android emulator)

### 1. Clone and Install

```bash
git clone <repo-url> Packleader
cd Packleader
npm install
```

### 2. Configure Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI, JWT secret, etc.

# Mobile
cp mobile/.env.example mobile/.env
# Edit mobile/.env with your API URL
```

### 3. Build Shared Package

```bash
npm run shared:build
```

### 4. Start Backend

```bash
npm run backend:dev
```

The API server will start at `http://localhost:3000`.
Health check: `GET http://localhost:3000/api/health`

### 5. Start Mobile

```bash
npm run mobile:start
```

Scan the QR code with Expo Go, or press `a` for Android emulator / `i` for iOS simulator.

## Project Structure

```
Packleader/
├── mobile/         React Native (Expo) frontend
├── backend/        Node.js + Express API server
├── shared/         Shared types, constants, event definitions
├── docs/           Project documentation
└── package.json    Root workspace configuration
```

## Environment Variables

See:
- `backend/.env.example` — API server configuration
- `mobile/.env.example` — Mobile app configuration

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and data flow |
| [API.md](docs/API.md) | REST API endpoint reference |
| [DATABASE.md](docs/DATABASE.md) | MongoDB schema design |
| [SETUP.md](docs/SETUP.md) | Detailed setup instructions |

## Development Stages

| Stage | Feature | Status |
|-------|---------|--------|
| 1 | Project Foundation | ✅ Complete |
| 2 | Authentication & User Management | ✅ Complete |
| 3 | Trip & Group Management | ✅ Complete |
| 4 | Map & Basic Location (Google Maps & Provider Abstraction) | ✅ Complete |
| 5 | Real-Time Group Tracking & Pack Radar Telemetry | ✅ Complete |
| 6 | SmartPath Route Engine & Waypoint Planning | ✅ Complete |
| 7 | Offline Storage, Network Status & Sync Queue | ✅ Complete |
| 8 | Voice & 1-Tap Convoy Quick Alerts | ✅ Complete |
| 9 | Emergency SOS Beacon & Active Distress Broadcast | ✅ Complete |
| 10 | Pack Ledger, Expense Categorization & Debt Simplification | ✅ Complete |
| 11 | Master Regression Test Suite & UI/UX Polish | ✅ Complete |
| 12 | Production Docker, EAS Config & Deployment Docs | ✅ Complete |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native, Expo, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Real-time | Socket.IO, Firebase |
| Maps | Google Maps Platform |

## License

Private — All rights reserved.
