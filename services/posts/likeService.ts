import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

/**
 * Like service
 * Handles post likes/unlikes
 */
export class LikeService {
  /**
   * Like a post
   */
  static async likePost(postId: string, userId: string): Promise<void> {
    try {
      const postDocRef = doc(db, 'posts', postId);
      await updateDoc(postDocRef, {
        likes: arrayUnion(userId),
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to like post'
      );
    }
  }

  /**
   * Unlike a post
   */
  static async unlikePost(postId: string, userId: string): Promise<void> {
    try {
      const postDocRef = doc(db, 'posts', postId);
      await updateDoc(postDocRef, {
        likes: arrayRemove(userId),
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to unlike post'
      );
    }
  }

  /**
   * Check if user has liked a post
   */
  static async hasUserLiked(postId: string, userId: string): Promise<boolean> {
    try {
      const postDocRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postDocRef);

      if (postDoc.exists()) {
        const likes = postDoc.data().likes || [];
        return likes.includes(userId);
      }

      return false;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to check like status'
      );
    }
  }

  /**
   * Toggle like status (like if not liked, unlike if liked)
   */
  static async toggleLike(postId: string, userId: string): Promise<boolean> {
    try {
      const hasLiked = await this.hasUserLiked(postId, userId);
      
      if (hasLiked) {
        await this.unlikePost(postId, userId);
        return false;
      } else {
        await this.likePost(postId, userId);
        return true;
      }
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to toggle like'
      );
    }
  }
}

