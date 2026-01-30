import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Post } from '../types/Post';
import { PostQueryService } from '../services/posts/postQueryService';

/**
 * Custom hook for fetching and managing posts
 * Supports real-time updates and pagination
 */
export function usePosts(options?: {
  placeId?: string;
  userId?: string;
  pageSize?: number;
  enableRealtime?: boolean;
}) {
  const { placeId, userId, pageSize = 20, enableRealtime = true } = options || {};
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Real-time listener
  useEffect(() => {
    if (!enableRealtime) return;

    let postsQuery;
    
    if (placeId) {
      postsQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc')
      );
    } else if (userId) {
      postsQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc')
      );
    } else {
      postsQuery = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData: Post[] = [];
      
      snapshot.forEach((doc) => {
        const post = {
          id: doc.id,
          ...doc.data(),
        } as Post;

        // Apply filters
        if (placeId && post.placeId !== placeId) return;
        if (userId && post.userId !== userId) return;

        postsData.push(post);
      });

      setPosts(postsData);
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  }, [placeId, userId, enableRealtime]);

  // Load more posts (pagination)
  const loadMore = async () => {
    if (!hasMore || loading) return;

    try {
      setLoading(true);
      let result;

      if (placeId) {
        result = await PostQueryService.getPostsByPlace(placeId, pageSize, lastDoc || undefined);
      } else if (userId) {
        result = await PostQueryService.getPostsByUser(userId, pageSize, lastDoc || undefined);
      } else {
        result = await PostQueryService.getAllPosts(pageSize, lastDoc || undefined);
      }

      if (result.posts.length > 0) {
        setPosts((prev) => [...prev, ...result.posts]);
        setLastDoc(result.lastDoc);
        setHasMore(result.posts.length === pageSize);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh posts
  const refresh = async () => {
    setRefreshing(true);
    setLastDoc(null);
    setHasMore(true);
    
    try {
      let result;

      if (placeId) {
        result = await PostQueryService.getPostsByPlace(placeId, pageSize);
      } else if (userId) {
        result = await PostQueryService.getPostsByUser(userId, pageSize);
      } else {
        result = await PostQueryService.getAllPosts(pageSize);
      }

      setPosts(result.posts);
      setLastDoc(result.lastDoc);
      setHasMore(result.posts.length === pageSize);
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return {
    posts,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
  };
}

