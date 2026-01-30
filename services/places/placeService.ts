import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Post, PlaceWithReviews } from '../../types/Post';

/**
 * Place service
 * Handles place aggregations and place-related queries
 */
export class PlaceService {
  /**
   * Get all places with their reviews aggregated
   */
  static async getAllPlacesWithReviews(): Promise<PlaceWithReviews[]> {
    try {
      const postsQuery = query(collection(db, 'posts'));
      const snapshot = await getDocs(postsQuery);

      const placeMap = new Map<string, PlaceWithReviews>();

      snapshot.forEach((doc) => {
        const post = {
          id: doc.id,
          ...doc.data(),
        } as Post;

        if (!placeMap.has(post.placeId)) {
          placeMap.set(post.placeId, {
            placeId: post.placeId,
            placeName: post.placeName,
            placeAddress: post.placeAddress,
            location: post.location,
            posts: [],
            averageRating: 0,
          });
        }

        placeMap.get(post.placeId)!.posts.push(post);
      });

      // Calculate average ratings
      const places: PlaceWithReviews[] = Array.from(placeMap.values()).map(
        (place) => ({
          ...place,
          averageRating:
            place.posts.reduce((sum, p) => sum + p.rating, 0) /
            place.posts.length,
        })
      );

      return places;
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to fetch places with reviews'
      );
    }
  }

  /**
   * Get a single place with all its reviews
   */
  static async getPlaceWithReviews(placeId: string): Promise<PlaceWithReviews | null> {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('placeId', '==', placeId)
      );
      const snapshot = await getDocs(postsQuery);

      if (snapshot.empty) {
        return null;
      }

      const posts: Post[] = [];
      let placeName = '';
      let placeAddress = '';
      let location = { latitude: 0, longitude: 0 };

      snapshot.forEach((doc) => {
        const post = {
          id: doc.id,
          ...doc.data(),
        } as Post;

        posts.push(post);

        // Use first post's place info
        if (!placeName) {
          placeName = post.placeName;
          placeAddress = post.placeAddress;
          location = post.location;
        }
      });

      const averageRating =
        posts.reduce((sum, p) => sum + p.rating, 0) / posts.length;

      return {
        placeId,
        placeName,
        placeAddress,
        location,
        posts,
        averageRating,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to fetch place with reviews'
      );
    }
  }
}

