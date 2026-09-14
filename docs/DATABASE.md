# Database Design

## Overview

Pack Leader uses MongoDB with Mongoose ODM. Schemas are designed for the full feature set and will be implemented progressively.

## Entity Relationship

```
User ──┬──< TripMember >──── Trip
       │                      │
       │                      ├──< Expense
       │                      ├──< SOSAlert
       │                      ├──< LocationSnapshot
       │                      └──── Route
       │
       ├──< EmergencyContact
       ├──< CheckIn
       └──< JournalEntry
```

## Collections

### User
| Field | Type | Index | Description |
|-------|------|-------|-------------|
| _id | ObjectId | PK | |
| name | String | | Full name |
| email | String | Unique | Login email |
| passwordHash | String | | Bcrypt hash |
| profileImage | String | | Image URL |
| emergencyContacts | Array | | Embedded contacts |
| preferredTravelMode | String | | Default travel mode |
| createdAt | Date | | |
| updatedAt | Date | | |

### Trip
| Field | Type | Index | Description |
|-------|------|-------|-------------|
| _id | ObjectId | PK | |
| name | String | | Trip name |
| leader | ObjectId | FK → User | Trip creator |
| members | Array | | Embedded TripMember objects |
| travelMode | String | | motorcycle/hiking/roadtrip/solo/family |
| origin | Object | | { coordinates, address, name } |
| destination | Object | | { coordinates, address, name } |
| inviteCode | String | Unique | 6-char join code |
| status | String | Index | planned/active/completed |
| scheduledStart | Date | | |
| scheduledEnd | Date | | |
| actualStart | Date | | |
| actualEnd | Date | | |
| createdAt | Date | | |
| updatedAt | Date | | |

### LocationSnapshot
| Field | Type | Index | Description |
|-------|------|-------|-------------|
| _id | ObjectId | PK | |
| userId | ObjectId | FK → User | |
| tripId | ObjectId | FK → Trip, Index | |
| latitude | Number | | |
| longitude | Number | | |
| heading | Number | | Degrees |
| speed | Number | | m/s |
| accuracy | Number | | Meters |
| timestamp | Date | Index | Device timestamp |

**Note:** Location snapshots grow fast. Consider TTL index or periodic aggregation for older data.

### Expense
| Field | Type | Index | Description |
|-------|------|-------|-------------|
| _id | ObjectId | PK | |
| tripId | ObjectId | FK → Trip, Index | |
| paidBy | ObjectId | FK → User | Who paid |
| participants | Array | | Users who share the cost |
| category | String | | fuel/food/accommodation/etc. |
| amount | Number | | |
| currency | String | | ISO 4217 |
| description | String | | |
| date | Date | | |
| createdAt | Date | | |
| updatedAt | Date | | |

### SOSAlert
| Field | Type | Index | Description |
|-------|------|-------|-------------|
| _id | ObjectId | PK | |
| userId | ObjectId | FK → User | |
| tripId | ObjectId | FK → Trip | |
| latitude | Number | | |
| longitude | Number | | |
| status | String | | active/acknowledged/resolved |
| message | String | | Optional description |
| acknowledgedBy | ObjectId | FK → User | |
| resolvedAt | Date | | |
| createdAt | Date | Index | |

### CheckIn
| Field | Type | Index | Description |
|-------|------|-------|-------------|
| _id | ObjectId | PK | |
| userId | ObjectId | FK → User, Index | |
| tripId | ObjectId | FK → Trip | Optional |
| destination | String | | |
| expectedArrival | Date | Index | |
| checkInWindowMinutes | Number | | Grace period |
| status | String | | pending/confirmed/missed/alerted |
| confirmedAt | Date | | |
| createdAt | Date | | |

### JournalEntry
| Field | Type | Index | Description |
|-------|------|-------|-------------|
| _id | ObjectId | PK | |
| userId | ObjectId | FK → User, Index | |
| tripId | ObjectId | FK → Trip | Optional |
| title | String | | |
| content | String | | |
| location | String | | |
| latitude | Number | | |
| longitude | Number | | |
| photos | Array | | Image URIs |
| date | Date | | |
| createdAt | Date | | |
| updatedAt | Date | | |

## Indexing Strategy

- **User.email**: Unique index for login lookups
- **Trip.inviteCode**: Unique index for join lookups
- **Trip.status**: Index for filtering active/planned trips
- **Trip.leader**: Index for "my trips" queries
- **LocationSnapshot.tripId + timestamp**: Compound index for trip timeline queries
- **Expense.tripId**: Index for trip expense aggregation
- **CheckIn.userId + status**: Compound index for pending check-ins

## Storage Considerations

- LocationSnapshot: Use TTL index to auto-expire detailed records after 90 days. Aggregate into summary documents for long-term storage.
- JournalEntry.photos: Store URIs only. Actual images stored in cloud storage (Firebase Storage or similar).
