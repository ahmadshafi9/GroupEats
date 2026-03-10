import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { UserProfile, FriendRequest } from '../../types/User';

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
        const data = userDoc.data();
        return {
          uid: userDoc.id,
          name: data?.name ?? '',
          email: data?.email ?? '',
          profilePic: data?.profilePic ?? '',
          friends: Array.isArray(data?.friends) ? data.friends : [],
          createdAt: data?.createdAt ?? new Date().toISOString(),
        } as UserProfile;
      }

      return null;
    } catch (error) {
      // Re-throw with more context
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user profile';
      
      // Check if it's an offline error
      if (errorMessage.includes('offline') || errorMessage.includes('network')) {
        throw new Error(`Firestore is offline: ${errorMessage}`);
      }
      
      throw new Error(errorMessage);
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
   * Add a friend to user's friends list (used after request is accepted)
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

  static async getAllUsers(): Promise<UserProfile[]> {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          name: data?.name ?? '',
          email: data?.email ?? '',
          profilePic: data?.profilePic ?? '',
          friends: Array.isArray(data?.friends) ? data.friends : [],
          createdAt: data?.createdAt ?? new Date().toISOString(),
        } as UserProfile;
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch users'
      );
    }
  }

  static async getUserProfiles(uids: string[]): Promise<UserProfile[]> {
    if (uids.length === 0) return [];
    try {
      const profiles: UserProfile[] = [];
      for (const uid of uids) {
        const profile = await UserProfileService.getUserProfile(uid);
        if (profile) profiles.push(profile);
      }
      return profiles;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch user profiles'
      );
    }
  }

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

  // ---------- Friend requests ----------

  static async sendFriendRequest(fromUserId: string, toUserId: string): Promise<void> {
    if (fromUserId === toUserId) throw new Error('Cannot send request to yourself');
    try {
      const existing = await this.getFriendRequestBetween(fromUserId, toUserId);
      if (existing) {
        if (existing.status === 'pending') {
          if (existing.fromUserId === fromUserId) throw new Error('Request already sent');
          else throw new Error('They already sent you a request');
        }
        throw new Error('A request already exists between you two');
      }
      const col = collection(db, 'friendRequests');
      await setDoc(doc(col, `${fromUserId}_${toUserId}`), {
        fromUserId,
        toUserId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to send friend request');
    }
  }

  static async getFriendRequestBetween(a: string, b: string): Promise<FriendRequest | null> {
    const id1 = `${a}_${b}`;
    const id2 = `${b}_${a}`;
    const doc1 = await getDoc(doc(db, 'friendRequests', id1));
    if (doc1.exists()) return { id: doc1.id, ...doc1.data() } as FriendRequest;
    const doc2 = await getDoc(doc(db, 'friendRequests', id2));
    if (doc2.exists()) return { id: doc2.id, ...doc2.data() } as FriendRequest;
    return null;
  }

  static async getIncomingFriendRequests(toUserId: string): Promise<FriendRequest[]> {
    const q = query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', toUserId),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest));
  }

  static async getOutgoingFriendRequests(fromUserId: string): Promise<FriendRequest[]> {
    const q = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', fromUserId),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest));
  }

  static async acceptFriendRequest(requestId: string): Promise<void> {
    try {
      const ref = doc(db, 'friendRequests', requestId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Request not found');
      const data = snap.data();
      if (data.status !== 'pending') throw new Error('Request already handled');
      const { fromUserId, toUserId } = data;
      await updateDoc(ref, { status: 'accepted' });
      await this.addFriend(fromUserId, toUserId);
      await this.addFriend(toUserId, fromUserId);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to accept request');
    }
  }

  static async declineFriendRequest(requestId: string): Promise<void> {
    try {
      const ref = doc(db, 'friendRequests', requestId);
      const snap = await getDoc(ref);
      if (!snap.exists()) throw new Error('Request not found');
      await updateDoc(ref, { status: 'declined' });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to decline request');
    }
  }
}

