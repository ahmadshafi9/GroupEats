import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Post } from '../../types/Post';

/**
 * Post query service
 * Handles querying posts with various filters and pagination
 */
export class PostQueryService {
  /**
   * Get all posts ordered by creation date (newest first)
   */
  static async getAllPosts(
    pageSize: number = 20,
    lastDoc?: QueryDocumentSnapshot
  ): Promise<{ posts: Post[]; lastDoc: QueryDocumentSnapshot | null }> {
    try {
      let postsQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        postsQuery = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(postsQuery);
      const posts: Post[] = [];

      snapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data(),
        } as Post);
      });

      const lastDocument = snapshot.docs[snapshot.docs.length - 1] || null;

      return { posts, lastDoc: lastDocument };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch posts'
      );
    }
  }

  /**
   * Get posts by place ID
   */
  static async getPostsByPlace(
    placeId: string,
    pageSize: number = 20,
    lastDoc?: QueryDocumentSnapshot
  ): Promise<{ posts: Post[]; lastDoc: QueryDocumentSnapshot | null }> {
    try {
      let postsQuery = query(
        collection(db, 'posts'),
        where('placeId', '==', placeId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        postsQuery = query(
          collection(db, 'posts'),
          where('placeId', '==', placeId),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(postsQuery);
      const posts: Post[] = [];

      snapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data(),
        } as Post);
      });

      const lastDocument = snapshot.docs[snapshot.docs.length - 1] || null;

      return { posts, lastDoc: lastDocument };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch posts by place'
      );
    }
  }

  /**
   * Get posts by user ID
   */
  static async getPostsByUser(
    userId: string,
    pageSize: number = 20,
    lastDoc?: QueryDocumentSnapshot
  ): Promise<{ posts: Post[]; lastDoc: QueryDocumentSnapshot | null }> {
    try {
      let postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        postsQuery = query(
          collection(db, 'posts'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(postsQuery);
      const posts: Post[] = [];

      snapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data(),
        } as Post);
      });

      const lastDocument = snapshot.docs[snapshot.docs.length - 1] || null;

      return { posts, lastDoc: lastDocument };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch user posts'
      );
    }
  }

  /**
   * Get posts within a radius (requires geohash or location query)
   * Note: Firestore doesn't support native geo queries, 
   * this is a simplified version using bounding box
   */
  static async getPostsNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
    pageSize: number = 20
  ): Promise<Post[]> {
    try {
      // Simplified: Get all posts and filter by distance
      // For production, consider using geohash or a dedicated geospatial service
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(100) // Get more to filter
      );

      const snapshot = await getDocs(postsQuery);
      const posts: Post[] = [];

      snapshot.forEach((doc) => {
        const post = {
          id: doc.id,
          ...doc.data(),
        } as Post;

        // Calculate distance (Haversine formula)
        const distance = this.calculateDistance(
          latitude,
          longitude,
          post.location.latitude,
          post.location.longitude
        );

        if (distance <= radiusKm) {
          posts.push(post);
        }
      });

      // Sort by distance and limit
      return posts.slice(0, pageSize);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch nearby posts'
      );
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

