# Architecture

This document describes the technical architecture of GroupEats — a React Native mobile app for discovering and sharing restaurant experiences with friends.

---

## System Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Expo App   │────▶│  Firebase    │     │  Google APIs    │
│  (Client)   │◀────│  Backend     │     │                 │
│             │     │              │     │  - Places API   │
│  - Screens  │     │  - Firestore │     │  - Maps SDK     │
│  - Services │     │  - Auth      │     │                 │
│  - Hooks    │     │  - Storage   │     │                 │
└─────────────┘     └──────────────┘     └─────────────────┘
```

GroupEats is a client-heavy mobile application. The Expo/React Native client handles all business logic through a service layer, communicating directly with Firebase services and Google APIs. There is no custom backend server.

---

## Layer Architecture

```
┌──────────────────────────────────────────────────────┐
│  1. Presentation Layer                               │
│     Screens, components, and navigation              │
├──────────────────────────────────────────────────────┤
│  2. State Management                                 │
│     React Context for auth and user state            │
├──────────────────────────────────────────────────────┤
│  3. Custom Hooks                                     │
│     Reactive data fetching and side effects           │
├──────────────────────────────────────────────────────┤
│  4. Service Layer                                    │
│     Business logic, API calls, data transformation   │
├──────────────────────────────────────────────────────┤
│  5. External Services                                │
│     Firebase, Google Places, Google Maps             │
└──────────────────────────────────────────────────────┘
```

### 1. Presentation Layer

File-based routing via Expo Router with two route groups:

| Route Group | Access | Screens |
|---|---|---|
| `auth/` | Public | Login, Signup |
| `(protected)/` | Authenticated | Feed, Explore, New Post, Place Detail, Dining Hall |

```
App Root (_layout.tsx)
├── Not Authenticated → auth/login, auth/signup
└── Authenticated → (protected)/
    ├── feed          — Social review feed
    ├── explore       — Map-based discovery
    ├── new-post      — Create a review
    ├── place-detail  — Restaurant detail view
    └── dining-hall   — Dining hall events
```

### 2. State Management

A single `AuthContext` provides global authentication state:

```typescript
interface AuthContextType {
  isLoggedIn: boolean;
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

Sessions are persisted to `AsyncStorage` and restored on app launch.

### 3. Custom Hooks

| Hook | Responsibility |
|---|---|
| `usePosts` | Real-time post feed with Firestore `onSnapshot`, pagination, and pull-to-refresh |
| `usePlace` | Fetch place details with aggregated reviews and average rating |
| `useLocation` | Request location permissions and track device GPS |

### 4. Service Layer

All Firebase and third-party API calls are encapsulated in services. Screens never access Firestore directly.

```
services/
├── auth/
│   ├── authService.ts           — Sign in, sign up, sign out
│   └── userProfileService.ts    — Create and fetch user profiles
├── posts/
│   ├── postService.ts           — Create, update, delete posts
│   ├── postQueryService.ts      — Paginated queries, filters by place/user
│   └── likeService.ts           — Like and unlike posts
├── places/
│   ├── googlePlacesService.ts   — Places Autocomplete & details
│   └── placeService.ts          — Aggregate place data with reviews
├── diningHall/
│   ├── diningHallService.ts     — Create/join dining events
│   └── notificationService.ts   — Write friend notifications
├── storage/
│   └── imageUploadService.ts    — Upload images to Cloud Storage
└── location/
    └── locationService.ts       — Device location access
```

---

## Database Schema (Firestore)

### Collections

```
firestore/
├── users/{userId}
│   ├── name: string
│   ├── email: string
│   ├── profilePic: string        (Cloud Storage URL)
│   ├── friends: string[]         (array of user UIDs)
│   └── createdAt: string
│
├── posts/{postId}
│   ├── userId: string
│   ├── userName: string
│   ├── userProfilePic: string
│   ├── placeId: string           (Google Place ID)
│   ├── placeName: string
│   ├── placeAddress: string
│   ├── placeTypes: string[]
│   ├── description: string
│   ├── rating: number            (1–5)
│   ├── photoUrl: string          (Cloud Storage URL)
│   ├── location: { latitude, longitude }
│   ├── likes: string[]           (array of user UIDs)
│   └── createdAt: string
│
├── diningHallEvents/{eventId}
│   ├── userId: string
│   ├── userName: string
│   ├── diningHall: string
│   ├── minutesUntilArrival: number
│   ├── participants: string[]
│   ├── createdAt: string
│   └── expiresAt: string
│
└── notifications/{notificationId}
    ├── recipientId: string
    ├── senderId: string
    ├── senderName: string
    ├── type: string
    ├── message: string
    ├── read: boolean
    └── createdAt: string
```

### Indexes

Compound indexes are used for:
- Posts by `placeId` + `createdAt` (place detail view)
- Posts by `userId` + `createdAt` (user's own reviews)
- Dining hall events by `expiresAt` (active events query)

---

## Data Flow

### Creating a Review

```
User selects place (Google Places Autocomplete)
  → User takes photo (expo-image-picker)
    → imageUploadService uploads to Cloud Storage → returns URL
      → postService creates Firestore document with photo URL
        → onSnapshot listeners push update to all connected clients
```

### Viewing the Explore Map

```
locationService gets device GPS coordinates
  → postQueryService fetches posts near location
    → placeService aggregates posts by placeId
      → Map renders markers with color coding (friend / other)
        → Tap marker → navigate to place-detail with placeId
```

### Authentication Flow

```
User submits credentials
  → authService calls Firebase Auth
    → On success, userProfileService fetches/creates profile in Firestore
      → AuthContext updates global state
        → Expo Router redirects to protected routes
          → AsyncStorage persists session for next launch
```

---

## Real-Time Updates

The app uses Firestore `onSnapshot` listeners for live data:

| Screen | Listener | Effect |
|---|---|---|
| Feed | `posts` collection ordered by `createdAt` | New reviews appear instantly |
| Place Detail | `posts` filtered by `placeId` | Ratings update as reviews are added |
| Dining Hall | `diningHallEvents` filtered by expiry | Active events appear and expire in real time |

Listeners are set up in custom hooks and cleaned up on unmount to prevent memory leaks.

---

## Security Considerations

- Firebase API keys are stored in environment variables (`.env`), not committed to the repo
- Firestore security rules should restrict reads/writes to authenticated users
- Cloud Storage rules should restrict uploads to authenticated users with size limits
- Google Maps API key is restricted by app bundle identifier

---

## Scaling Plan

### Completed
- [x] Service layer separation
- [x] Real-time Firestore listeners
- [x] Cursor-based pagination
- [x] Type-safe codebase

### Next Steps
- [ ] Firestore security rules hardening
- [ ] Cloud Functions for server-side aggregation (average ratings, post counts)
- [ ] Push notifications via Firebase Cloud Messaging
- [ ] Offline-first with Firestore persistence
- [ ] Full-text search via Algolia or Typesense
- [ ] Unit and integration tests for the service layer
