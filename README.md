<div align="center">

# GroupEats

### Discover, review, and share restaurant experiences with friends.

[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK_54-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.5-DD2C00?logo=firebase&logoColor=white)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Features](#features) · [Architecture](#architecture) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started) · [Project Structure](#project-structure)

</div>

---

## Overview

**GroupEats** is a full-stack mobile application built with React Native and Firebase that turns dining into a social experience. Users can discover nearby restaurants on an interactive map, post photo reviews with star ratings, and see what their friends are eating — all in real time.

The app was designed with a clean layered architecture, a dedicated service layer for business logic, and real-time Firestore subscriptions — demonstrating production-level patterns for mobile development.

---

## Features

| Feature | Description |
|---|---|
| **Social Feed** | Real-time feed of restaurant reviews with photos, ratings, likes, and pull-to-refresh / infinite scroll |
| **Interactive Map** | Explore nearby restaurants on a live map with color-coded markers (friends vs. others) |
| **Place Search** | Google Places Autocomplete for fast restaurant discovery |
| **Photo Reviews** | Create reviews with camera/gallery photos, 1–5 star ratings, and text descriptions |
| **Place Detail** | Aggregated view of all reviews for a restaurant — yours, friends', and others' |
| **Dining Hall Events** | Broadcast "going to eat" events with countdown timers and friend notifications |
| **Auth & Profiles** | Email/password authentication with persistent sessions and user profiles |
| **Friend System** | Data model supports friend-based filtering and social features |

---

## Architecture

The app follows a **layered architecture** that cleanly separates concerns:

```
┌──────────────────────────────────────────────────────┐
│              Presentation Layer                       │
│         Expo Router screens & components              │
├──────────────────────────────────────────────────────┤
│              State Management                        │
│         React Context (AuthContext)                   │
├──────────────────────────────────────────────────────┤
│              Custom Hooks                            │
│       usePosts · usePlace · useLocation              │
├──────────────────────────────────────────────────────┤
│              Service Layer                           │
│  Auth · Posts · Places · Storage · Location · Dining │
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
- **Separated styles** keep component files focused on logic, not layout
- **Centralized types** in a dedicated `types/` directory for full type safety across the codebase

> See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the full technical deep-dive including data models, data flow diagrams, and scaling plan.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | React Native + Expo SDK 54 | Cross-platform iOS & Android |
| **Routing** | Expo Router | Type-safe file-based navigation |
| **Language** | TypeScript 5.9 | Static typing across the entire codebase |
| **Database** | Cloud Firestore | Real-time NoSQL with snapshot listeners |
| **Auth** | Firebase Authentication | Email/password with session persistence |
| **Storage** | Firebase Cloud Storage | Photo uploads and signed URL delivery |
| **Maps** | React Native Maps + Google Maps | Interactive map with custom markers |
| **Places** | Google Places API | Autocomplete search and place details |
| **Location** | expo-location | Device GPS for nearby discovery |
| **Images** | expo-image-picker | Camera and gallery integration |
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
│   │   ├── feed.tsx              # Social review feed
│   │   ├── explore.tsx           # Interactive map view
│   │   ├── new-post.tsx          # Create a review
│   │   ├── place-detail.tsx      # Restaurant detail + reviews
│   │   └── dining-hall.tsx       # Dining hall events
│   └── context/
│       └── AuthContext.tsx        # Global auth state provider
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
│   ├── User.ts
│   ├── Place.ts
│   ├── DiningHall.ts
│   └── index.ts                  # Barrel exports
│
├── styles/                       # Separated StyleSheet files
├── constants/                    # Theme & color tokens
├── utils/                        # Validation & formatting helpers
├── assets/                       # Fonts & images
├── firebaseConfig.ts             # Firebase initialization
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
  placeId: string          // Google Place ID
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
  friends: string[]        // UIDs of connected friends
  createdAt: string
}
```

### Dining Hall Event

```typescript
{
  id: string
  userId: string
  userName: string
  diningHall: string
  minutesUntilArrival: number
  createdAt: string
  expiresAt: string
  participants: string[]
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
- [x] Dining hall events with countdown
- [x] Service layer architecture
- [ ] Comments on reviews
- [ ] Friend request system & management UI
- [ ] Push notifications (FCM)
- [ ] Saved places / collections
- [ ] Offline sync support
- [ ] Cloud Functions for aggregations
- [ ] Full-text search (Algolia)

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
