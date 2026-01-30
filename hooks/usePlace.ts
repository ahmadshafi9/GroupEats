import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { PlaceWithReviews } from '../types/Post';
import { PlaceService } from '../services/places/placeService';

/**
 * Custom hook for fetching place with reviews
 */
export function usePlace(placeId: string | undefined) {
  const [place, setPlace] = useState<PlaceWithReviews | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!placeId) {
      setLoading(false);
      return;
    }

    // Real-time listener for posts of this place
    const postsQuery = query(
      collection(db, 'posts'),
      where('placeId', '==', placeId)
    );

    const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
      const placeData = await PlaceService.getPlaceWithReviews(placeId);
      setPlace(placeData);
      setLoading(false);
    });

    return unsubscribe;
  }, [placeId]);

  return { place, loading };
}

