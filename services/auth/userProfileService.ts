import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { UserProfile } from '../../types/User';

/**
 * User profile service
 * Handles user profile operations in Firestore
 */
export class UserProfileService {
  /**
   * Create a new user profile in Firestore
   */
  static async createUserProfile(
    uid: string,
    profileData: Omit<UserProfile, 'uid'>
  ): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), {
        ...profileData,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to create user profile'
      );
    }
  }

  /**
   * Get user profile by UID
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return {
          uid: userDoc.id,
          ...userDoc.data(),
        } as UserProfile;
      }

      return null;
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to fetch user profile'
      );
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    uid: string,
    updates: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>
  ): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, updates);
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to update user profile'
      );
    }
  }

  /**
   * Add a friend to user's friends list
   */
  static async addFriend(userId: string, friendId: string): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const currentFriends = userDoc.data().friends || [];
        if (!currentFriends.includes(friendId)) {
          await updateDoc(userDocRef, {
            friends: [...currentFriends, friendId],
          });
        }
      }
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to add friend'
      );
    }
  }

  /**
   * Remove a friend from user's friends list
   */
  static async removeFriend(userId: string, friendId: string): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const currentFriends = userDoc.data().friends || [];
        await updateDoc(userDocRef, {
          friends: currentFriends.filter((id: string) => id !== friendId),
        });
      }
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to remove friend'
      );
    }
  }
}

