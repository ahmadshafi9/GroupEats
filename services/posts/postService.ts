import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Post } from '../../types/Post';

/**
 * Post service
 * Handles post creation, updates, and deletion
 */
export class PostService {
  /**
   * Create a new post/review
   */
  static async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'likes'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'posts'), {
        ...postData,
        createdAt: new Date().toISOString(),
        likes: [],
      });
      return docRef.id;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create post'
      );
    }
  }

  /**
   * Update an existing post
   */
  static async updatePost(
    postId: string,
    updates: Partial<Omit<Post, 'id' | 'userId' | 'createdAt'>>
  ): Promise<void> {
    try {
      const postDocRef = doc(db, 'posts', postId);
      await updateDoc(postDocRef, updates);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update post'
      );
    }
  }

  /**
   * Delete a post
   */
  static async deletePost(postId: string): Promise<void> {
    try {
      const postDocRef = doc(db, 'posts', postId);
      await deleteDoc(postDocRef);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete post'
      );
    }
  }
}

