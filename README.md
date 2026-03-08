<div align="center">

# GroupEats

### Discover, review, and share restaurant experiences with friends — then go eat together.

[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK_54-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.5-DD2C00?logo=firebase&logoColor=white)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live_Demo-▶_Try_It-00C853?style=flat&logo=vercel&logoColor=white)](https://groupeats-rho.vercel.app)

[Live Demo](https://groupeats-rho.vercel.app) · [Features](#features) · [Architecture](#architecture) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [Project Structure](#project-structure)

</div>

---

## Overview

**GroupEats** is an open-source, full-stack mobile + web application built with React Native and Firebase that turns dining into a social experience. Users can discover nearby restaurants on an interactive map, post photo reviews with star ratings, manage a friends list, coordinate dining hall trips with real-time countdowns, and negotiate timing through an extend/prepone approval system — all in real time.

The app is built with a clean layered architecture, a dedicated service layer for all business logic, real-time Firestore subscriptions, and deployed Firestore security rules — demonstrating production-level patterns for mobile and web development.

---

## Features

| Feature | Description |
|---|---|
| **Social Feed** | Real-time feed of restaurant reviews with photos, ratings, likes, and pull-to-refresh / infinite scroll |
| **Interactive Map** | Explore nearby restaurants on a live map with color-coded markers (friends vs. others) |
| **Place Search** | Google Places Autocomplete for fast restaurant discovery; manual entry fallback on web |
| **Photo Reviews** | Create reviews with camera/gallery photos, 1–5 star ratings, and text descriptions |
| **Place Detail** | Aggregated view of all reviews for a restaurant — yours, friends', and others' |
| **Friends Management** | Search all users, add/remove friends with mutual updates, view friends list with friend count |
| **Dining Hall Events** | Broadcast "going to eat" events with live countdown timers visible to all users |
| **Join / Leave Events** | Anyone can join an active dining hall event; participants see real names and can leave anytime |
| **Extend / Prepone Requests** | Participants can request to push the time back (extend) or forward (prepone / "I'm hungry"); event owner approves or denies each request |
| **Custom Timing** | Both event creation and time-change requests support preset options (5/10/15/30 min) and custom minute input |
| **Auth & Profiles** | Email/password authentication with persistent sessions, auto-created Firestore profiles, and profile refresh |
| **Web Deployment** | Live web build on Vercel with platform-specific UI fallbacks for native-only features |

---

## Architecture

The app follows a **layered architecture** that cleanly separates concerns:

```
┌──────────────────────────────────────────────────────┐
│              Presentation Layer                       │
│         Expo Router screens & components              │
│         (platform-specific .web.tsx where needed)     │
├──────────────────────────────────────────────────────┤
│              State Management                        │
│         React Context (AuthContext)                   │
├──────────────────────────────────────────────────────┤
│              Custom Hooks                            │
│       usePosts · usePlace · useLocation              │
├──────────────────────────────────────────────────────┤
│              Service Layer                           │
│  Auth · UserProfile · Posts · Places · Storage       │
│  Location · DiningHall · Notifications               │
├──────────────────────────────────────────────────────┤
│              Data / External Services                │
│    Firestore · Firebase Auth · Cloud Storage         │
│    Google Places API · Google Maps                   │
└──────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **Service layer** encapsulates all Firebase and API interactions — screens never call Firestore directly
- **Custom hooks** provide reactive data fetching with real-time listeners, pagination, and loading states
- **File-based routing** via Expo Router with auth-guarded route groups
- **Platform-specific files** (`.web.tsx`) handle web-only UI fallbacks while sharing the core codebase with mobile
- **Centralized types** in a dedicated `types/` directory for full type safety across the codebase
- **Deployed Firestore security rules** enforce authenticated access and ownership constraints in production

> See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the full technical deep-dive including data models, data flow diagrams, and scaling plan.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | React Native + Expo SDK 54 | Cross-platform iOS, Android & Web |
| **Routing** | Expo Router | Type-safe file-based navigation |
| **Language** | TypeScript 5.9 | Static typing across the entire codebase |
| **Database** | Cloud Firestore | Real-time NoSQL with snapshot listeners |
| **Auth** | Firebase Authentication | Email/password with session persistence |
| **Storage** | Firebase Cloud Storage | Photo uploads and signed URL delivery |
| **Maps** | React Native Maps + Google Maps | Interactive map with custom markers |
| **Places** | Google Places API | Autocomplete search and place details |
| **Location** | expo-location | Device GPS for nearby discovery |
| **Images** | expo-image-picker | Camera and gallery integration |
| **Hosting** | Vercel | Free web deployment with SPA routing |
| **Build** | EAS Build | Cloud-based native builds for iOS & Android |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- A [Firebase project](https://console.firebase.google.com/) with Firestore, Auth, and Storage enabled
- A [Google Maps API key](https://developers.google.com/maps/documentation/javascript/get-api-key) with Places API enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/ahmadshafi9/GroupEats.git
cd GroupEats

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Then fill in your Firebase and Google Maps keys in .env
```

### Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### Running the App

```bash
# Start the development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run on web
npx expo start --web
```

---

## Project Structure

```
groupeats/
├── app/                          # Screens & navigation (Expo Router)
│   ├── _layout.tsx               # Root layout with auth routing
│   ├── auth/                     # Login & signup screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (protected)/              # Auth-guarded screens
│   │   ├── _layout.tsx           # Protected stack navigator
│   │   ├── index.tsx             # Home screen with feature cards
│   │   ├── feed.tsx              # Social review feed
│   │   ├── explore.tsx           # Interactive map view
│   │   ├── explore.web.tsx       # Web: list-based place browser
│   │   ├── new-post.tsx          # Create a review
│   │   ├── new-post.web.tsx      # Web: manual place entry
│   │   ├── place-detail.tsx      # Restaurant detail + reviews
│   │   ├── dining-hall.tsx       # Dining hall events (shared)
│   │   └── friends.tsx           # Friends management screen
│   └── context/
│       └── AuthContext.tsx        # Global auth state + auto profile creation
│
├── components/                   # Reusable UI components
│   ├── common/                   # Button, Input
│   ├── posts/                    # PostCard
│   └── diningHall/               # CountdownTimer
│
├── services/                     # Business logic layer
│   ├── auth/                     # authService, userProfileService
│   ├── posts/                    # postService, postQueryService, likeService
│   ├── places/                   # googlePlacesService, placeService
│   ├── diningHall/               # diningHallService, notificationService
│   ├── storage/                  # imageUploadService
│   └── location/                 # locationService
│
├── hooks/                        # Custom React hooks
│   ├── usePosts.ts               # Real-time feed with pagination
│   ├── usePlace.ts               # Place data with reviews
│   └── useLocation.ts            # Device location
│
├── types/                        # TypeScript type definitions
│   ├── Post.ts
│   ├── User.ts                   # UserProfile, AuthContextType
│   ├── Place.ts
│   ├── DiningHall.ts             # DiningHallEvent, TimeChangeRequest
│   └── index.ts                  # Barrel exports
│
├── shims/                        # Web platform shims
│   └── react-native-maps.js     # Dummy module for web builds
│
├── styles/                       # Separated StyleSheet files
├── constants/                    # Theme & color tokens
├── utils/                        # Validation & formatting helpers
├── assets/                       # Fonts & images
├── firebaseConfig.ts             # Firebase initialization (env-based)
├── firestore.rules               # Deployed Firestore security rules
├── metro.config.js               # Metro bundler config (web shims)
├── vercel.json                   # Vercel deployment config
└── app.json                      # Expo configuration
```

---

## Data Models

### Post

```typescript
{
  id: string
  userId: string
  userName: string
  userProfilePic: string
  placeId: string
  placeName: string
  placeAddress: string
  description: string
  rating: number           // 1–5
  photoUrl: string         // Firebase Storage URL
  location: { latitude: number; longitude: number }
  likes: string[]          // Array of user UIDs
  createdAt: string
}
```

### User Profile

```typescript
{
  uid: string
  name: string
  email: string
  profilePic: string
  friends: string[]        // UIDs — mutual add/remove
  createdAt: string
}
```

### Dining Hall Event

```typescript
{
  id: string
  creatorId: string
  creatorName: string
  targetTime: string         // ISO timestamp countdown target
  customMinutes: number      // Original minutes chosen
  participants: string[]     // UIDs of everyone going
  status: 'active' | 'completed' | 'cancelled'
  extendRequests: TimeChangeRequest[]
  createdAt: string
  notificationsSent: string[]
}
```

### TimeChangeRequest (embedded in events)

```typescript
{
  requesterId: string
  minutes: number
  type: 'extend' | 'prepone'    // Push later or pull sooner
  status: 'pending' | 'approved' | 'denied'
  createdAt: string
}
```

> Full data model documentation is available in [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## Roadmap

- [x] Authentication & user profiles
- [x] Photo reviews with star ratings
- [x] Real-time social feed with infinite scroll
- [x] Interactive map with place markers
- [x] Google Places search & autocomplete
- [x] Place detail with aggregated reviews
- [x] Dining hall events with countdown timers
- [x] Join / leave dining hall events
- [x] Extend & prepone time-change requests with owner approval
- [x] Friends management (search, add, remove)
- [x] Service layer architecture
- [x] Firestore security rules
- [x] Web deployment (Vercel)
- [ ] Comments on reviews
- [ ] Push notifications (FCM)
- [ ] Saved places / collections
- [ ] Offline sync support
- [ ] Cloud Functions for aggregations
- [ ] Full-text search (Algolia)

---

## Web Demo

A live web build is available at **[groupeats-rho.vercel.app](https://groupeats-rho.vercel.app)** for quick access without installing anything.

> **Note:** The web version is a preview of the mobile app. A few native-only features behave differently on web:
>
> | Feature | Web Behavior |
> |---|---|
> | Interactive Map (Explore) | Replaced with a list-based place browser — `react-native-maps` is native-only |
> | Camera capture | Not available — gallery upload still works |
> | Google Places Autocomplete | Manual text entry for place name and address (avoids CORS) |
> | Push notifications | Not wired on any platform yet |
>
> All other features — **feed, friends, dining hall events, join/leave, extend/prepone** — work identically on web and mobile.
>
> For the full native experience, build and run the app on iOS or Android using `npx expo start`.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

<div align="center">

Built by [Ahmad Shafi](https://github.com/ahmadshafi9)

</div>
