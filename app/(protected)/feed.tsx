import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Post } from '../../types/Post';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load posts from Firestore
  useEffect(() => {
    // Create query: get all posts, ordered by newest first
    const postsQuery = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc')
    );

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData: Post[] = [];
      
      snapshot.forEach((doc) => {
        postsData.push({
          id: doc.id,
          ...doc.data()
        } as Post);
      });

      setPosts(postsData);
      setLoading(false);
      setRefreshing(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, []);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    // The onSnapshot listener will automatically refresh the data
  };

  // Render a single post
  const renderPost = ({ item }: { item: Post }) => {
    const postDate = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <View style={styles.postCard}>
        {/* Header: user info */}
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            {item.userProfilePic ? (
              <Image 
                source={{ uri: item.userProfilePic }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {item.userName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.userName}>{item.userName}</Text>
              <Text style={styles.postDate}>{postDate}</Text>
            </View>
          </View>
        </View>

        {/* Post image */}
        <Image 
          source={{ uri: item.photoUrl }} 
          style={styles.postImage}
          resizeMode="cover"
        />

        {/* Post content */}
        <View style={styles.postContent}>
          <View style={styles.placeHeader}>
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: './place-detail',
                params: {
                  placeId: item.placeId,
                  placeName: item.placeName,
                  placeAddress: item.placeAddress,
                }
              })}
            >
              <Text style={styles.placeName}>{item.placeName}</Text>
              <Text style={styles.placeAddress}>{item.placeAddress}</Text>
            </TouchableOpacity>
            <View style={styles.rating}>
              <Text style={styles.ratingText}>
                {'⭐'.repeat(Math.round(item.rating))}
              </Text>
              <Text style={styles.ratingNumber}>{item.rating}</Text>
            </View>
          </View>

          {item.description ? (
            <Text style={styles.description}>{item.description}</Text>
          ) : null}

          {/* Location */}
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>
              {item.placeAddress || 'Location'}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>
                ❤️ {item.likes.length}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>💬 Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionText}>🔖 Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No posts yet!</Text>
        <Text style={styles.emptySubtext}>
          Be the first to share a place
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
  },
  listContent: {
    padding: 10,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  postDate: {
    fontSize: 12,
    color: '#666',
  },
  postImage: {
    width: '100%',
    height: 300,
  },
  postContent: {
    padding: 15,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  placeName: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    color: '#007AFF',
  },
  placeAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    marginRight: 5,
  },
  ratingNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  description: {
    fontSize: 15,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    gap: 15,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
});