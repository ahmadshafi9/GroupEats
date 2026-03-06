# Architecture

This document describes the technical architecture of GroupEats — a React Native mobile + web app for discovering and sharing restaurant experiences with friends, and coordinating real-time dining plans.

---

## System Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Expo App       │────▶│  Firebase    │     │  Google APIs    │
│  (Client)       │◀────│  Backend     │     │                 │
│                 │     │              │     │  - Places API   │
│  - Screens      │     │  - Firestore │     │  - Maps SDK     │
│  - Services     │     │  - Auth      │     │                 │
│  - Hooks        │     │  - Storage   │     │                 │
│                 │     │  - Rules     │     │                 │
├─────────────────┤     └──────────────┘     └─────────────────┘
│  Vercel (Web)   │
│  Static hosting │
└─────────────────┘
```

GroupEats is a client-heavy application. The Expo/React Native client handles all business logic through a service layer, communicating directly with Firebase services and Google APIs. There is no custom backend server. Firestore security rules enforce access control in production.

The same codebase targets iOS, Android, and Web. Platform-specific `.web.tsx` files provide fallback UI for native-only features (maps, camera).

---

## Layer Architecture

```
┌──────────────────────────────────────────────────────┐
│  1. Presentation Layer                               │
│     Screens, components, navigation                  │
│     Platform-specific .web.tsx where needed           │
├──────────────────────────────────────────────────────┤
│  2. State Management                                 │
│     React Context (AuthContext)                       │
│     Auto-creates Firestore profile on login           │
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
| `(protected)/` | Authenticated | Home, Feed, Explore, New Post, Place Detail, Dining Hall, Friends |

```
App Root (_layout.tsx)
├── Not Authenticated → auth/login, auth/signup
└── Authenticated → (protected)/
    ├── index         — Home with feature cards + friend count
    ├── feed          — Social review feed
    ├── explore       — Map-based discovery (list-based on web)
    ├── new-post      — Create a review (manual entry on web)
    ├── place-detail  — Restaurant detail view
    ├── dining-hall   — Dining events with join/extend/prepone
    └── friends       — Search users, add/remove friends
```

### 2. State Management

A single `AuthContext` provides global authentication state:

```typescript
interface AuthContextType {
  isLoggedIn: boolean;
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}
```

On login, the context checks if a Firestore user profile exists. If not, it automatically creates one — this ensures every authenticated user is discoverable in the friends search.

Sessions are persisted to `AsyncStorage` (native) or `browserLocalPersistence` (web) and restored on app launch.

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
│   └── userProfileService.ts   — CRUD profiles, search users, batch fetch by UIDs
├── posts/
│   ├── postService.ts           — Create, update, delete posts
│   ├── postQueryService.ts      — Paginated queries, filters by place/user
│   └── likeService.ts           — Like and unlike posts
├── places/
│   ├── googlePlacesService.ts   — Places Autocomplete & details
│   └── placeService.ts          — Aggregate place data with reviews
├── diningHall/
│   ├── diningHallService.ts     — Create/join/leave events, time-change requests, approve/deny
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
│   ├── profilePic: string         (Cloud Storage URL)
│   ├── friends: string[]          (mutual — UIDs of connected friends)
│   └── createdAt: string
│
├── posts/{postId}
│   ├── userId: string
│   ├── userName: string
│   ├── userProfilePic: string
│   ├── placeId: string            (Google Place ID or generated slug)
│   ├── placeName: string
│   ├── placeAddress: string
│   ├── placeTypes: string[]
│   ├── description: string
│   ├── rating: number             (1–5)
│   ├── photoUrl: string           (Cloud Storage URL)
│   ├── location: { latitude, longitude }
│   ├── likes: string[]            (array of user UIDs)
│   └── createdAt: string
│
├── diningHallEvents/{eventId}
│   ├── creatorId: string
│   ├── creatorName: string
│   ├── targetTime: string         (ISO timestamp — countdown target)
│   ├── customMinutes: number
│   ├── participants: string[]     (UIDs of everyone going)
│   ├── status: 'active' | 'completed' | 'cancelled'
│   ├── extendRequests: [          (embedded array)
│   │     {
│   │       requesterId: string
│   │       minutes: number
│   │       type: 'extend' | 'prepone'
│   │       status: 'pending' | 'approved' | 'denied'
│   │       createdAt: string
│   │     }
│   │   ]
│   ├── notificationsSent: string[]
│   └── createdAt: string
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
- Dining hall events by `status` (active events query)

---

## Data Flow

### Creating a Review

```
User selects place (Google Places Autocomplete / manual entry on web)
  → User takes photo (expo-image-picker)
    → imageUploadService uploads to Cloud Storage → returns URL
      → postService creates Firestore document with photo URL
        → onSnapshot listeners push update to all connected clients
```

### Dining Hall Event Flow

```
Creator picks time (15/30/custom min) → diningHallService.createEvent()
  → Event appears on ALL users' dining hall screen in real-time
    → Other users tap "Join — I'm going too!" → joinEvent()
      → Participant names resolve via userProfileService
        → Participant requests extension or prepone → requestTimeChange()
          → Owner sees request → approves (time shifts) or denies
            → Countdown hits zero → event auto-completes
```

### Friends Management Flow

```
User opens Friends screen
  → "Find People" tab → userProfileService.getAllUsers()
    → User taps "Add" → mutual friends[] update on both profiles
      → "My Friends" tab shows current friends with Remove option
        → refreshProfile() updates AuthContext with latest friend list
```

### Authentication Flow

```
User submits credentials
  → authService calls Firebase Auth
    → On success, AuthContext checks for Firestore profile
      → If missing, auto-creates profile (ensures discoverability)
        → AuthContext updates global state
          → Expo Router redirects to protected routes
            → Session persisted for next launch
```

---

## Real-Time Updates

The app uses Firestore `onSnapshot` listeners for live data:

| Screen | Listener | Effect |
|---|---|---|
| Feed | `posts` collection ordered by `createdAt` | New reviews appear instantly |
| Place Detail | `posts` filtered by `placeId` | Ratings update as reviews are added |
| Dining Hall | `diningHallEvents` where `status == 'active'` | Events, participants, and time-change requests update in real-time |

Listeners are set up in custom hooks and cleaned up on unmount to prevent memory leaks.

---

## Security

### Firestore Rules (deployed)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null;   // friends can update each other
    }
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null
                            && resource.data.userId == request.auth.uid;
    }
    match /diningHallEvents/{eventId} {
      allow read, create: if request.auth != null;
      allow update: if request.auth != null;    // join, leave, approve requests
    }
    match /notifications/{notifId} {
      allow read: if request.auth != null
                  && resource.data.recipientId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

### Other Security Measures

- Firebase API keys are stored in environment variables (`.env`), not committed to the repo
- Git history was scrubbed of previously committed keys using `git-filter-repo`
- Service account keys are `.gitignore`d
- Google Maps API key is restricted by app bundle identifier
- Prepone requests are clamped to prevent setting event time in the past

---

## Web Platform Handling

The app runs on web via `npx expo export --platform web` and is hosted on Vercel.

| Challenge | Solution |
|---|---|
| `react-native-maps` crashes on web | Metro resolver shim redirects imports to a dummy module (`shims/react-native-maps.js`) |
| Google Places Autocomplete CORS errors | `.web.tsx` variant uses manual text input instead of API calls |
| `Alert.prompt` is iOS-only | Inline `TextInput` used for custom time entry (works on all platforms) |
| Firebase Auth persistence differs | `Platform.OS` check: `browserLocalPersistence` on web, `getReactNativePersistence` on native |

---

## Scaling Plan

### Completed
- [x] Service layer separation
- [x] Real-time Firestore listeners
- [x] Cursor-based pagination
- [x] Type-safe codebase
- [x] Firestore security rules
- [x] Friends management
- [x] Dining hall event coordination with approval flow
- [x] Web deployment

### Next Steps
- [ ] Cloud Functions for server-side aggregation (average ratings, post counts)
- [ ] Push notifications via Firebase Cloud Messaging
- [ ] Offline-first with Firestore persistence
- [ ] Full-text search via Algolia or Typesense
- [ ] Unit and integration tests for the service layer
- [ ] Comments on reviews
