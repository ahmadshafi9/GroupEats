import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  StyleSheet, 
  ActivityIndicator,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Post } from '../../types/Post';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function PlaceDetail() {
  const { placeId, placeName, placeAddress } = useLocalSearchParams();
  const { user, userProfile } = useAuth();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate average rating
  const averageRating = posts.length > 0
    ? (posts.reduce((sum, post) => sum + post.rating, 0) / posts.length).toFixed(1)
    : 0;

  // Separate friend posts and other posts
  const friendPosts = posts.filter(post => 
    userProfile?.friends.includes(post.userId)
  );
  const otherPosts = posts.filter(post => 
    !userProfile?.friends.includes(post.userId) && post.userId !== user?.uid
  );
  const myPosts = posts.filter(post => post.userId === user?.uid);

  useEffect(() => {
    if (!placeId) return;

    // Query all posts for this place
    const postsQuery = query(
      collection(db, 'posts'),
      where('placeId', '==', placeId)
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData: Post[] = [];
      
      snapshot.forEach((doc) => {
        postsData.push({
          id: doc.id,
          ...doc.data()
        } as Post);
      });

      // Sort by newest first
      postsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setPosts(postsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [placeId]);

  // Render a single review
  const renderReview = ({ item }: { item: Post }) => {
    const postDate = new Date(item.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const isFriend = userProfile?.friends.includes(item.userId);
    const isMe = item.userId === user?.uid;

    return (
      <View style={styles.reviewCard}>
        {/* User info */}
        <View style={styles.reviewHeader}>
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
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{item.userName}</Text>
              {isFriend && <Text style={styles.friendBadge}>👥 Friend</Text>}
              {isMe && <Text style={styles.meBadge}>You</Text>}
            </View>
            <Text style={styles.reviewDate}>{postDate}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ {item.rating}</Text>
          </View>
        </View>

        {/* Photo */}
        <Image 
          source={{ uri: item.photoUrl }} 
          style={styles.reviewImage}
        />

        {/* Review text */}
        <Text style={styles.reviewText}>{item.description}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Place Header */}
      <View style={styles.placeHeader}>
        <Text style={styles.placeName}>{placeName}</Text>
        <Text style={styles.placeAddress}>📍 {placeAddress}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>⭐ {averageRating}</Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{friendPosts.length}</Text>
            <Text style={styles.statLabel}>From Friends</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.writeReviewButton}
          onPress={() => router.push('./new-post')}
        >
          <Text style={styles.writeReviewText}>✍️ Write a Review</Text>
        </TouchableOpacity>
      </View>

      {/* Reviews Sections */}
      {posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No reviews yet</Text>
          <Text style={styles.emptySubtext}>Be the first to review this place!</Text>
        </View>
      ) : (
        <>
          {/* My Reviews */}
          {myPosts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Review</Text>
              {myPosts.map(post => (
                <View key={post.id}>{renderReview({ item: post })}</View>
              ))}
            </View>
          )}

          {/* Friend Reviews */}
          {friendPosts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👥 Friends' Reviews ({friendPosts.length})</Text>
              {friendPosts.map(post => (
                <View key={post.id}>{renderReview({ item: post })}</View>
              ))}
            </View>
          )}

          {/* Other Reviews */}
          {otherPosts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Other Reviews ({otherPosts.length})</Text>
              {otherPosts.map(post => (
                <View key={post.id}>{renderReview({ item: post })}</View>
              ))}
            </View>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
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
  },
  placeHeader: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  placeName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  placeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  writeReviewButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  writeReviewText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  friendBadge: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  meBadge: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
  },
  ratingBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});