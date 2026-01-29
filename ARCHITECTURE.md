# GroupEats Architecture Model

## Project Overview
GroupEats is a mobile app (React Native/Expo) that allows users to discover, review, and share restaurant experiences with friends.

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  (React Native/Expo Components & Navigation)                │
├─────────────────────────────────────────────────────────────┤
│                    STATE MANAGEMENT                         │
│  (Context API - Auth, User Profile)                         │
├─────────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC LAYER                      │
│  (Services, Utilities, Validation)                          │
├─────────────────────────────────────────────────────────────┤
│                    DATA ACCESS LAYER                         │
│  (Firebase: Firestore, Auth, Storage)                       │
├─────────────────────────────────────────────────────────────┤
│                    EXTERNAL SERVICES                         │
│  (Google Places, Google Maps)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Presentation Layer

### Navigation Structure
```
App Root (_layout.tsx)
│
├── Auth State Check
│   │
│   ├── NOT LOGGED IN → Auth Stack
│   │   ├── /auth/login
│   │   └── /auth/signup
│   │
│   └── LOGGED IN → Protected Stack
│       ├── (tabs) - Main Tab Navigator
│       │   ├── /index (Home)
│       │   └── /two (Profile/Settings)
│       │
│       └── (protected) - Additional Screens
│           ├── /index (Main feed/dashboard)
│           ├── /explore (Map view)
│           ├── /feed (Reviews feed)
│           ├── /new-post (Create review)
│           └── /place-detail (Place reviews)
```

### Screen Responsibilities

| Screen | Purpose | Dependencies |
|--------|---------|---|
| `auth/login` | User authentication | Firebase Auth |
| `auth/signup` | New user registration | Firebase Auth, Firestore |
| `/home` | Main dashboard | AuthContext |
| `/explore` | Map-based discovery | Maps, Location, Google Places |
| `/feed` | Feed of reviews | Firestore Posts |
| `/new-post` | Create review | Image Picker, Google Places, Storage |
| `/place-detail` | View all reviews for a place | Firestore Posts |
| `/profile` | User profile/settings | Firestore Users |

---

## 2. State Management

### AuthContext
- **Responsibility**: Manage authentication state globally
- **Data Structure**:
  ```typescript
  {
    isLoggedIn: boolean
    user: Firebase.User
    userProfile: {
      name: string
      email: string
      profilePic: string
      friends: string[]
      createdAt: string
    }
    loading: boolean
  }
  ```
- **Key Features**:
  - Auto-restore user session via AsyncStorage
  - Fetch user profile on login
  - Persist auth state across app restarts

---

## 3. Data Models

### User Profile (Firestore Collection: `users`)
```typescript
{
  uid: string                    // Firebase UID (document ID)
  name: string
  email: string
  profilePic: string             // URL from Cloud Storage
  friends: string[]              // Array of user UIDs
  createdAt: ISO8601 timestamp
}
```

### Post/Review (Firestore Collection: `posts`)
```typescript
{
  id: string                     // Firestore document ID
  userId: string                 // Firebase UID of creator
  userName: string
  userProfilePic: string
  
  // Google Place Data
  placeId: string                // Google Place ID
  placeName: string
  placeAddress: string
  placeTypes: string[]           // e.g., "restaurant", "food"
  
  // Review Content
  description: string
  rating: number                 // 1-5 stars
  photoUrl: string               // Cloud Storage URL
  
  // Location
  location: {
    latitude: number
    longitude: number
  }
  
  // Engagement
  createdAt: ISO8601 timestamp
  likes: string[]                // Array of user UIDs
}
```

### Computed Type: PlaceWithReviews
```typescript
{
  placeId: string
  placeName: string
  placeAddress: string
  location: { latitude, longitude }
  posts: Post[]                  // All reviews for this place
  averageRating: number
}
```

---

## 4. External Services Integration

### Google Places API
- **Used For**:
  - Place autocomplete when creating posts
  - Fetching place details (name, address, type)
  - Displaying place information

### Google Maps / React Native Maps
- **Used For**:
  - Map view in explore section
  - Displaying post locations
  - Location-based discovery

### Firebase Services

#### Authentication
- Email/password signup & login
- Session persistence via AsyncStorage
- User state management

#### Firestore (Database)
- **Collections**:
  - `users/` - User profiles
  - `posts/` - Reviews/posts
  - *(Future)* `places/` - Aggregated place data
  - *(Future)* `friendships/` - Friend relationships

#### Cloud Storage
- Image uploads for posts
- User profile pictures
- Accessible via signed URLs

---

## 5. Scalability Considerations

### Current Single-User Focus
The current architecture is optimized for individual users:
- One user per auth session
- Posts are individually owned
- No real-time collaboration features

### Scaling Opportunities

#### 1. **Real-Time Features** (Phase 2)
```
Add Firestore Listeners:
- Listen to posts feed
- Live place ratings
- Real-time friend activity
```

#### 2. **Social Features** (Phase 3)
```
New Collections/Data:
- friendships/ - Manage relationships
- notifications/ - Activity notifications  
- comments/ - Post comments
- saves/ - Bookmarked places
```

#### 3. **Performance Optimization** (Phase 2+)
```
Implement:
- Pagination for feeds
- Firestore indexing strategy
- Cloud Functions for aggregations
- Caching layer (AsyncStorage, Redux)
```

#### 4. **Search & Discovery** (Phase 3+)
```
Add:
- Firestore full-text search
- Algolia or Elasticsearch for advanced queries
- Location-based filtering
- Category filtering
```

---

## 6. Service Layer Architecture (Recommended)

Create a services folder to separate business logic:

```
services/
├── auth/
│   ├── authService.ts          // Login, signup, logout
│   ├── userProfileService.ts   // Fetch/update user profile
│   └── sessionService.ts       // Session management
├── posts/
│   ├── postService.ts          // Create, fetch, update posts
│   ├── postQueryService.ts     // Query posts by location/place
│   └── likeService.ts          // Like/unlike posts
├── places/
│   ├── googlePlacesService.ts  // Google Places API calls
│   ├── placeService.ts         // Fetch place aggregations
│   └── placeReviewService.ts   // Get reviews for a place
├── storage/
│   ├── imageUploadService.ts   // Upload images to Cloud Storage
│   └── urlService.ts           // Generate signed URLs
└── location/
    ├── locationService.ts      // Get user location
    └── geocodingService.ts     // Geocode addresses
```

---

## 7. Database Schema (Firestore)

```
firestore/
├── users/ (Collection)
│   └── {userId}/ (Document)
│       ├── name: string
│       ├── email: string
│       ├── profilePic: string
│       ├── friends: array
│       └── createdAt: timestamp
│
├── posts/ (Collection)
│   └── {postId}/ (Document)
│       ├── userId: string
│       ├── placeId: string
│       ├── rating: number
│       ├── description: string
│       ├── photoUrl: string
│       ├── location: geo
│       ├── likes: array
│       └── createdAt: timestamp
│
├── places/ (Collection - Future)
│   └── {placeId}/ (Document)
│       ├── name: string
│       ├── address: string
│       ├── location: geo
│       ├── averageRating: number
│       └── reviewCount: number
│
└── friendships/ (Collection - Future)
    └── {userId}-{friendId}/ (Document)
        ├── status: "pending" | "accepted"
        └── createdAt: timestamp
```

---

## 8. Dependencies & Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| UI/Mobile | React Native (Expo) | Cross-platform mobile |
| Navigation | Expo Router | File-based routing |
| State | Context API | Global state (auth) |
| Database | Firestore | NoSQL cloud database |
| Auth | Firebase Auth | User authentication |
| Storage | Firebase Cloud Storage | Image hosting |
| Maps | React Native Maps | Map display |
| Places | Google Places API | Place search/details |
| Async | AsyncStorage | Local persistence |
| Icons | Expo Vector Icons | UI icons |
| Type Safety | TypeScript | Static typing |

---

## 9. Data Flow Examples

### User Creates a Post
```
1. User selects place (Google Places API)
2. User takes photo (Image Picker)
3. Click "Create Review"
4. App uploads image to Cloud Storage → gets URL
5. App creates post doc in Firestore with image URL
6. UI updates to show success
7. Feed screens refresh with new post
```

### User Views Explore Map
```
1. App gets user's location (expo-location)
2. Query Firestore: posts within 5km radius
3. Display pins on map for each place
4. User taps pin → navigates to place-detail
5. place-detail queries posts for that placeId
6. Display all reviews for that place
```

### User Logs In
```
1. Firebase Auth validates credentials
2. AuthContext receives user object
3. Fetch user profile from Firestore users/{uid}
4. Store in userProfile state
5. Navigation switches to protected screens
6. Session persists via AsyncStorage
```

---

## 10. Future Scaling Plan

### Phase 1 (Current)
- ✅ Auth & user profiles
- ✅ Single-user posts
- ✅ Place lookup via Google Places
- ✅ Basic feed & map views

### Phase 2
- [ ] Real-time post updates (Firestore listeners)
- [ ] Pagination & infinite scroll
- [ ] Search & filtering
- [ ] Comments on posts
- [ ] Cloud Functions for data aggregation

### Phase 3
- [ ] Friend system
- [ ] Social feed (friend posts only)
- [ ] Notifications
- [ ] Advanced analytics
- [ ] Saved places/collections

### Phase 4
- [ ] Offline sync
- [ ] Advanced recommendations
- [ ] Messaging
- [ ] Group features

---

## 11. Key Principles for Scalable Development

1. **Separation of Concerns**: Keep business logic out of components
2. **Single Responsibility**: Each service handles one domain
3. **Type Safety**: Use TypeScript strict mode
4. **Reusability**: Create custom hooks and service utilities
5. **Testing**: Add unit tests for services
6. **Documentation**: Keep types and services documented
7. **Performance**: Implement pagination and lazy loading early
8. **Security**: Never expose Firebase keys, use environment variables

---

## Directory Structure (Recommended Refactor)

```
groupeats/
├── app/                          (Navigation/Pages)
│   ├── auth/
│   ├── (protected)/
│   ├── (tabs)/
│   └── context/
├── components/                   (Reusable UI)
│   ├── common/
│   ├── forms/
│   ├── maps/
│   └── posts/
├── services/                     (Business Logic)
│   ├── auth/
│   ├── posts/
│   ├── places/
│   ├── storage/
│   └── location/
├── hooks/                        (Custom Hooks)
│   ├── usePosts.ts
│   ├── usePlace.ts
│   └── useLocation.ts
├── types/                        (Type Definitions)
│   ├── Post.ts
│   ├── User.ts
│   ├── Place.ts
│   └── index.ts
├── utils/                        (Utilities)
│   ├── validation.ts
│   ├── formatting.ts
│   └── api.ts
├── constants/                    (Constants)
│   ├── Colors.ts
│   ├── api.ts
│   └── config.ts
├── assets/
├── firebaseConfig.ts
└── package.json
```

This architecture provides a clear path for scaling from a simple MVP to a feature-rich social application.
