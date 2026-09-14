# Architecture

## Overview

Pack Leader uses a clean three-tier architecture.

```
┌──────────────────────────────────────────────────────────┐
│                     CLIENT TIER                          │
│                                                          │
│  React Native (Expo) Mobile Application                  │
│  ├── Screens / Navigation                                │
│  ├── Components (reusable UI)                            │
│  ├── Contexts (AuthContext, etc.)                         │
│  ├── Services (Socket, API client)                       │
│  └── Styles (Theme, Colors)                              │
└──────────────┬───────────────────────────────────────────┘
               │
               │  REST API (HTTP/JSON)
               │  WebSocket (Socket.IO)
               │
┌──────────────▼───────────────────────────────────────────┐
│                   APPLICATION TIER                        │
│                                                          │
│  Node.js + Express API Server                            │
│  ├── Routes → Controllers → Services                     │
│  ├── Middleware (Auth, Validation, Error Handling)        │
│  ├── Socket.IO (Real-time event handlers)                │
│  └── Config (Environment, Database, Firebase)            │
└──────┬───────────────┬───────────────────────────────────┘
       │               │
┌──────▼──────┐ ┌──────▼──────┐
│  DATA TIER  │ │  SERVICES   │
│             │ │             │
│  MongoDB    │ │  Firebase   │
│  (Mongoose) │ │  (Admin)    │
│             │ │             │
│  • Users    │ │  • FCM      │
│  • Trips    │ │  • RTDB     │
│  • Expenses │ │             │
│  • etc.     │ ├─────────────┤
└─────────────┘ │  Maps API   │
                │  (Google)   │
                └─────────────┘
```

## Shared Package

The `@packleader/shared` package contains:

- **Types**: TypeScript interfaces for User, Trip, Location, Expense, etc.
- **Constants**: Socket event names, travel modes, roles, trip statuses, expense categories.

This ensures type safety and naming consistency across frontend and backend.

## Backend Layers

```
Request → Route → Controller → Service → Model/DB
                       ↓
                   Middleware (Auth, Validation)
```

| Layer | Responsibility |
|-------|---------------|
| Routes | URL → handler mapping |
| Controllers | Request/response handling, input extraction |
| Services | Business logic, orchestration |
| Models | Mongoose schemas, database operations |
| Middleware | Auth, validation, error handling, rate limiting |
| Socket | Real-time event handlers |
| Config | Environment, database, Firebase initialization |
| Utils | Logger, API response helpers |

## Real-Time Communication

Socket.IO is used for:
- Trip room join/leave
- Location broadcast
- ETA updates
- SOS alerts
- Check-in notifications
- Expense sync

All event names are defined in `@packleader/shared` constants.

## Security Layers

1. **Authentication**: JWT tokens (middleware)
2. **Authorization**: Role-based access (leader/member)
3. **Validation**: express-validator on all inputs
4. **Rate Limiting**: express-rate-limit on API routes
5. **Headers**: Helmet for security headers
6. **CORS**: Restricted origins
7. **Secrets**: Environment variables only

## Data Flow — Active Trip

```
Member Device
    │
    ├── GPS → Location Update (Socket.IO)
    │          │
    │          └─→ Server broadcasts to trip room
    │               │
    │               └─→ Leader Dashboard updates
    │                    │
    │                    └─→ Map markers move
    │
    ├── SOS Button → SOS Event (Socket.IO + REST)
    │                 │
    │                 └─→ Push notification to group
    │
    └── Expense Add → REST API
                       │
                       └─→ Socket.IO sync to group
```
