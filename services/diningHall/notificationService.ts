import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { UserProfileService } from '../auth/userProfileService';

/**
 * Notification service
 * Handles sending notifications to friends
 */
export class NotificationService {
  /**
   * Send dining hall notification to all friends
   */
  static async notifyFriends(
    fromUserId: string,
    fromUserName: string,
    eventId: string,
    targetTime: string,
    minutes: number
  ): Promise<void> {
    try {
      // Get user's friends
      const userProfile = await UserProfileService.getUserProfile(fromUserId);
      if (!userProfile || !userProfile.friends || userProfile.friends.length === 0) {
        return; // No friends to notify
      }

      // Create notifications for each friend
      const notifications = userProfile.friends.map((friendId) => ({
        userId: friendId,
        type: 'dining_hall_invitation',
        fromUserId,
        fromUserName,
        eventId,
        targetTime,
        minutes,
        message: `${fromUserName} is going to the dining hall in ${minutes} minutes! Join them?`,
        read: false,
        createdAt: new Date().toISOString(),
      }));

      // Batch create notifications
      const batch = notifications.map((notification) =>
        addDoc(collection(db, 'notifications'), notification)
      );

      await Promise.all(batch);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to send notifications'
      );
    }
  }
}
