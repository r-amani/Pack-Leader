# Pack Leader — Production Deployment Guide

This guide provides end-to-end instructions for deploying the **Pack Leader** motorcycle convoy coordination platform to production across backend server infrastructure and mobile app stores (Google Play & Apple App Store).

---

## 1. System Architecture

```
[ Mobile Apps (iOS / Android) ]
       │              │
  HTTPS REST      WSS WebSockets
       │              │
       ▼              ▼
┌───────────────────────────────┐
│     Nginx Reverse Proxy       │
│  (SSL / TLS Termination)      │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│   Pack Leader API Container   │
│   (Node.js 22 + TypeScript)   │
└──────────────┬────────────────┘
         │           │
         ▼           ▼
┌──────────────┐ ┌──────────────┐
│   MongoDB    │ │    Redis     │
│  (Database)  │ │ (Socket.IO)  │
└──────────────┘ └──────────────┘
```

---

## 2. Environment Configuration Checklist

Create a production `.env` file on your server inside the `backend/` directory:

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | Listening HTTP port | `3000` |
| `MONGODB_URI` | MongoDB Connection String | `mongodb+srv://admin:...@cluster0.mongodb.net/packleader` |
| `JWT_SECRET` | 64+ char random secret string | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | 64+ char random refresh secret | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Access token lifespan | `7d` |
| `CORS_ORIGIN` | Allowed web/client origins | `*` or `https://app.packleader.com` |
| `GOOGLE_MAPS_API_KEY` | Google Maps Platform API Key | `AIzaSy...` |
| `MAPBOX_ACCESS_TOKEN` | Mapbox GL Access Token | `pk.eyJ...` |
| `FIREBASE_PROJECT_ID` | (Optional) Firebase Cloud Messaging | `packleader-prod` |

---

## 3. Server Deployment via Docker Compose

### Prerequisites
- Docker Engine 24.0+ & Docker Compose v2+
- Git

### Quick Start
```bash
# 1. Clone repository
git clone https://github.com/r-amani/Pack-Leader.git
cd Pack-Leader

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your production credentials

# 3. Launch stack
docker compose up -d --build

# 4. Verify running containers and health
docker compose ps
docker compose logs -f api
```

### Health Check
Verify the API is answering health checks:
```bash
curl -f http://localhost:3000/api/health
```
Expected output:
```json
{"status":"ok","timestamp":"2026-09-14T...","uptime":12.34}
```

---

## 4. Nginx Reverse Proxy & SSL Configuration

Configure Nginx on your host machine to terminate SSL and properly forward WebSockets:

```nginx
server {
    server_name api.packleader.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSockets support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for real-time telemetry
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/api.packleader.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.packleader.com/privkey.pem;
}
```

Issue SSL with Let's Encrypt Certbot:
```bash
sudo certbot --nginx -d api.packleader.com
```

---

## 5. Mobile App Production Release (Expo EAS)

The mobile client is built using **Expo Application Services (EAS)** configured via `mobile/eas.json`.

### Prerequisites
```bash
npm install -g eas-cli
eas login
```

### Android (Google Play Store AAB)
```bash
cd mobile

# Build production Android App Bundle (AAB)
eas build --platform android --profile production

# Submit automatically to Google Play Console
eas submit --platform android --profile production
```

### iOS (Apple App Store / TestFlight)
```bash
cd mobile

# Build production iOS IPA archive
eas build --platform ios --profile production

# Submit automatically to App Store Connect / TestFlight
eas submit --platform ios --profile production
```

---

## 6. Maintenance & Backups

### Automated MongoDB Daily Backup
```bash
# Backup container data to host
docker exec packleader-mongo mongodump --archive=/data/db/backup-$(date +%F).gz --gzip
```

### Zero-Downtime Rolling Update
```bash
git pull origin main
docker compose up -d --build --no-deps api
```
