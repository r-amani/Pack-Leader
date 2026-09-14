# API Reference

Base URL: `http://localhost:3000/api`

All responses follow the standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error description"
}
```

---

## Health

### `GET /api/health`

Returns server status and service connectivity.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 3600,
    "services": {
      "database": "connected",
      "firebase": "not configured"
    }
  }
}
```

---

## Auth (Stage 2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

## Users (Stage 2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/:id` | Update profile |

## Trips (Stage 3)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trips` | Create trip |
| GET | `/api/trips` | List user's trips |
| GET | `/api/trips/:id` | Get trip details |
| PUT | `/api/trips/:id` | Update trip |
| POST | `/api/trips/:id/start` | Start trip |
| POST | `/api/trips/:id/end` | End trip |
| POST | `/api/trips/join` | Join via invite code |
| POST | `/api/trips/:id/members` | Add member |
| DELETE | `/api/trips/:id/members/:userId` | Remove member |
| GET | `/api/trips/:id/members` | List members |

## Location (Stage 5)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips/:id/location` | Get member locations |

## Routes (Stage 6)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips/:id/routes` | Get route options |
| POST | `/api/trips/:id/routes/select` | Select route |

## Expenses (Stage 9)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trips/:id/expenses` | Add expense |
| GET | `/api/trips/:id/expenses` | List expenses |
| PUT | `/api/trips/:id/expenses/:eid` | Update expense |
| DELETE | `/api/trips/:id/expenses/:eid` | Delete expense |
| GET | `/api/trips/:id/expenses/summary` | Get balances |

## Safety (Stage 7)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trips/:id/sos` | Trigger SOS |
| PUT | `/api/trips/:id/sos/:sid` | Update SOS status |
| POST | `/api/checkins` | Create check-in |
| POST | `/api/checkins/:id/confirm` | Confirm arrival |
| GET | `/api/checkins` | List check-ins |

## Journal (Stage 10)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/journal` | Create entry |
| GET | `/api/journal` | List entries |
| PUT | `/api/journal/:id` | Update entry |
| DELETE | `/api/journal/:id` | Delete entry |
