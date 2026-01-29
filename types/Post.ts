// Defines what a post looks like
export type Post = {
  id: string;                    // Unique post ID
  userId: string;                // Who created it (Firebase UID)
  userName: string;              // Creator's name
  userProfilePic: string;        // Creator's profile pic URL
  
  // Google Place info
  placeId: string;               // Google Place ID (unique for each place)
  placeName: string;             // Name from Google Places
  placeAddress: string;          // Full address
  placeTypes: string[];          // e.g., ["restaurant", "food"]
  
  // Post content
  description: string;           // User's review
  rating: number;                // 1-5 stars
  photoUrl: string;              // URL of uploaded photo
  
  // Location data
  location: {
    latitude: number;
    longitude: number;
  };
  
  // Metadata
  createdAt: string;             // ISO timestamp
  likes: string[];               // Array of user IDs who liked
};

// For displaying all reviews of a single place
export type PlaceWithReviews = {
  placeId: string;
  placeName: string;
  placeAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  posts: Post[];                 // All reviews for this place
  averageRating: number;         // Average of all ratings
};