import { collection, addDoc, doc, updateDoc, query, where, getDocs, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { DiningHallEvent } from '../../types/DiningHall';

/**
 * Dining Hall service
 * Handles dining hall "going soon" events and group planning
 */
export class DiningHallService {
  /**
   * Create a new dining hall event
   */
  static async createEvent(
    creatorId: string,
    creatorName: string,
    minutes: number
  ): Promise<string> {
    try {
      const targetTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      
      const eventData = {
        creatorId,
        creatorName,
        targetTime,
        customMinutes: minutes,
        participants: [creatorId],
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        notificationsSent: [],
      };

      const docRef = await addDoc(collection(db, 'diningHallEvents'), eventData);
      return docRef.id;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create dining hall event'
      );
    }
  }

  /**
   * Join an event
   */
  static async joinEvent(eventId: string, userId: string): Promise<void> {
    try {
      const eventRef = doc(db, 'diningHallEvents', eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (eventSnap.exists()) {
        const eventData = eventSnap.data();
        const participants = eventData.participants || [];
        
        if (!participants.includes(userId)) {
          await updateDoc(eventRef, {
            participants: [...participants, userId],
          });
        }
      } else {
        throw new Error('Event not found');
      }
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to join event'
      );
    }
  }

  /**
   * Get active events for a user
   */
  static async getActiveEvents(userId: string): Promise<DiningHallEvent[]> {
    try {
      const eventsQuery = query(
        collection(db, 'diningHallEvents'),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(eventsQuery);
      const events: DiningHallEvent[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        // Include events where user is creator or participant
        if (data.creatorId === userId || (data.participants || []).includes(userId)) {
          events.push({
            id: doc.id,
            ...data,
          } as DiningHallEvent);
        }
      });

      return events.sort((a, b) => 
        new Date(a.targetTime).getTime() - new Date(b.targetTime).getTime()
      );
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to fetch events'
      );
    }
  }

  /**
   * Subscribe to ALL active events (real-time) so users can discover and join
   */
  static subscribeToActiveEvents(
    userId: string,
    callback: (events: DiningHallEvent[]) => void
  ): () => void {
    const eventsQuery = query(
      collection(db, 'diningHallEvents'),
      where('status', '==', 'active')
    );

    return onSnapshot(eventsQuery, (snapshot) => {
      const now = Date.now();
      const events: DiningHallEvent[] = [];

      snapshot.forEach((d) => {
        const data = d.data();
        if (new Date(data.targetTime).getTime() > now) {
          events.push({ id: d.id, ...data } as DiningHallEvent);
        }
      });

      callback(events.sort((a, b) =>
        new Date(a.targetTime).getTime() - new Date(b.targetTime).getTime()
      ));
    });
  }

  /**
   * Mark notifications as sent
   */
  static async markNotificationsSent(eventId: string, userIds: string[]): Promise<void> {
    try {
      const eventRef = doc(db, 'diningHallEvents', eventId);
      const sent = userIds; // Just update with the new list
      await updateDoc(eventRef, {
        notificationsSent: sent,
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update notifications'
      );
    }
  }

  /**
   * Complete an event
   */
  static async completeEvent(eventId: string): Promise<void> {
    try {
      const eventRef = doc(db, 'diningHallEvents', eventId);
      await updateDoc(eventRef, {
        status: 'completed',
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to complete event'
      );
    }
  }
}
