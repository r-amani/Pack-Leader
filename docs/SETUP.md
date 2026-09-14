# Setup Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org/) |
| npm | ≥ 9 | Included with Node.js |
| MongoDB | ≥ 6 | [mongodb.com](https://www.mongodb.com/try/download/community) or Atlas |
| Git | ≥ 2 | [git-scm.com](https://git-scm.com/) |
| Expo Go | Latest | App Store / Play Store |

## 1. Clone Repository

```bash
git clone <repo-url> Packleader
cd Packleader
```

## 2. Install Dependencies

```bash
npm install
```

This installs dependencies for all workspaces (`mobile/`, `backend/`, `shared/`).

## 3. Build Shared Package

```bash
npm run shared:build
```

The shared package must be built before the backend or mobile can import from it.

## 4. Configure Backend Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```ini
# Required
MONGODB_URI=mongodb://localhost:27017/packleader
JWT_SECRET=your-secure-random-string-here

# Optional — Firebase push notifications
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Optional — Google Maps
GOOGLE_MAPS_API_KEY=your-api-key
```

### MongoDB Setup

**Option A: Local MongoDB**
1. Install MongoDB Community Server
2. Start the MongoDB service
3. Use `mongodb://localhost:27017/packleader` as your URI

**Option B: MongoDB Atlas (Cloud)**
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user
3. Whitelist your IP
4. Copy the connection string into `.env`

### Firebase Setup (Optional)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Go to Project Settings → Service Accounts
4. Generate a new private key
5. Use the values from the JSON file in your `.env`

### Google Maps Platform Setup (Active Mapping Provider)

Pack Leader uses **Google Maps Platform** as its primary mapping provider via the provider-agnostic `IMapService` abstraction (with Mapbox preserved as an alternative provider).

1. Log into [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create your project.
3. Enable the following required APIs:
   - **Routes API** (computes route geometry, distances, travel time, and turn-by-turn maneuvers)
   - **Geocoding API** (converts addresses to coordinates and reverse-geocodes current GPS)
   - **Places API (New)** (powers destination text search and landmark autocomplete)
   - **Maps SDK for Android** (for native map rendering on Android devices)
   - **Maps SDK for iOS** (for native map rendering on iOS devices)
4. Under **APIs & Services → Credentials**, create an API key.
5. In production, restrict the key by Package Name (`com.packleader.app`), iOS Bundle Identifier (`com.packleader.app`), or HTTP referrers, and restrict the allowed APIs to the 5 listed above.
6. Add the key to `mobile/.env`:
   ```ini
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
   ```

## 5. Configure Mobile Environment

```bash
cp mobile/.env.example mobile/.env
```

Edit `mobile/.env`:

```ini
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api
EXPO_PUBLIC_SOCKET_URL=http://YOUR_LOCAL_IP:3000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token-optional
```

> **Important:** When testing on a physical device, use your machine's local IP address (e.g., `192.168.1.x`), not `localhost`.

## 6. Start Development

### Terminal 1 — Backend

```bash
npm run backend:dev
```

Verify: `curl http://localhost:3000/api/health`

### Terminal 2 — Mobile

```bash
npm run mobile:start
```

Scan the QR code with Expo Go.

## 7. Running Tests

```bash
# Backend tests
npm run backend:test

# TypeScript type checking
npm run backend:build -- --noEmit
```

## Troubleshooting

### MongoDB connection refused
- Ensure MongoDB is running: `mongod --version`
- Check your `MONGODB_URI` in `.env`
- For Atlas, ensure your IP is whitelisted

### Expo can't connect to backend
- Use your machine's LAN IP, not `localhost`
- Check that port 3000 isn't blocked by a firewall
- Ensure backend is running before starting the mobile app

### npm install fails
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules/` and `package-lock.json`, then reinstall
- Ensure Node.js ≥ 18
