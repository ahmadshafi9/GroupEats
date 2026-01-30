import { 
  View, 
  Text, 
  Image, 
  ActivityIndicator,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Post } from '../../types/Post';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { usePosts } from '../../hooks/usePosts';
import { Formatting } from '../../utils/formatting';
import { placeDetailStyles } from '../../styles/placeDetail.styles';

export default function PlaceDetail() {
  const { placeId, placeName, placeAddress } = useLocalSearchParams();
  const { user, userProfile } = useAuth();
  
  const { posts, loading } = usePosts({
    placeId: placeId as string,
    enableRealtime: true,
  });

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

  // Render a single review
  const renderReview = ({ item }: { item: Post }) => {
    const postDate = Formatting.formatDate(item.createdAt);
    const isFriend = userProfile?.friends.includes(item.userId);
    const isMe = item.userId === user?.uid;

    return (
      <View style={placeDetailStyles.reviewCard}>
        {/* User info */}
        <View style={placeDetailStyles.reviewHeader}>
          {item.userProfilePic ? (
            <Image 
              source={{ uri: item.userProfilePic }} 
              style={placeDetailStyles.avatar} 
            />
          ) : (
            <View style={[placeDetailStyles.avatar, placeDetailStyles.avatarPlaceholder]}>
              <Text style={placeDetailStyles.avatarText}>
                {item.userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={placeDetailStyles.userInfo}>
            <View style={placeDetailStyles.nameRow}>
              <Text style={placeDetailStyles.userName}>{item.userName}</Text>
              {isFriend && <Text style={placeDetailStyles.friendBadge}>👥 Friend</Text>}
              {isMe && <Text style={placeDetailStyles.meBadge}>You</Text>}
            </View>
            <Text style={placeDetailStyles.reviewDate}>{postDate}</Text>
          </View>
          <View style={placeDetailStyles.ratingBadge}>
            <Text style={placeDetailStyles.ratingText}>⭐ {item.rating}</Text>
          </View>
        </View>

        {/* Photo */}
        <Image 
          source={{ uri: item.photoUrl }} 
          style={placeDetailStyles.reviewImage}
        />

        {/* Review text */}
        <Text style={placeDetailStyles.reviewText}>{item.description}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={placeDetailStyles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={placeDetailStyles.container}>
      {/* Place Header */}
      <View style={placeDetailStyles.placeHeader}>
        <Text style={placeDetailStyles.placeName}>{placeName}</Text>
        <Text style={placeDetailStyles.placeAddress}>📍 {placeAddress}</Text>
        
        <View style={placeDetailStyles.statsRow}>
          <View style={placeDetailStyles.statBox}>
            <Text style={placeDetailStyles.statNumber}>⭐ {averageRating}</Text>
            <Text style={placeDetailStyles.statLabel}>Average Rating</Text>
          </View>
          <View style={placeDetailStyles.statBox}>
            <Text style={placeDetailStyles.statNumber}>{posts.length}</Text>
            <Text style={placeDetailStyles.statLabel}>Reviews</Text>
          </View>
          <View style={placeDetailStyles.statBox}>
            <Text style={placeDetailStyles.statNumber}>{friendPosts.length}</Text>
            <Text style={placeDetailStyles.statLabel}>From Friends</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={placeDetailStyles.writeReviewButton}
          onPress={() => router.push('./new-post')}
        >
          <Text style={placeDetailStyles.writeReviewText}>✍️ Write a Review</Text>
        </TouchableOpacity>
      </View>

      {/* Reviews Sections */}
      {posts.length === 0 ? (
        <View style={placeDetailStyles.emptyState}>
          <Text style={placeDetailStyles.emptyText}>No reviews yet</Text>
          <Text style={placeDetailStyles.emptySubtext}>Be the first to review this place!</Text>
        </View>
      ) : (
        <>
          {/* My Reviews */}
          {myPosts.length > 0 && (
            <View style={placeDetailStyles.section}>
              <Text style={placeDetailStyles.sectionTitle}>Your Review</Text>
              {myPosts.map(post => (
                <View key={post.id}>{renderReview({ item: post })}</View>
              ))}
            </View>
          )}

          {/* Friend Reviews */}
          {friendPosts.length > 0 && (
            <View style={placeDetailStyles.section}>
              <Text style={placeDetailStyles.sectionTitle}>👥 Friends' Reviews ({friendPosts.length})</Text>
              {friendPosts.map(post => (
                <View key={post.id}>{renderReview({ item: post })}</View>
              ))}
            </View>
          )}

          {/* Other Reviews */}
          {otherPosts.length > 0 && (
            <View style={placeDetailStyles.section}>
              <Text style={placeDetailStyles.sectionTitle}>Other Reviews ({otherPosts.length})</Text>
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