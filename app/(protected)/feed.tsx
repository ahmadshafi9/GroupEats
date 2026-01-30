import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Post } from '../../types/Post';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import { usePosts } from '../../hooks/usePosts';
import { Formatting } from '../../utils/formatting';
import { LikeService } from '../../services/posts/likeService';
import { feedStyles } from '../../styles/feed.styles';

export default function Feed() {
  const { user } = useAuth();
  const { posts, loading, refreshing, refresh, loadMore, hasMore } = usePosts({
    pageSize: 20,
    enableRealtime: true,
  });

  // Handle like toggle
  const handleLike = async (postId: string) => {
    if (!user?.uid) return;
    try {
      await LikeService.toggleLike(postId, user.uid);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Render a single post
  const renderPost = ({ item }: { item: Post }) => {
    const postDate = Formatting.formatDate(item.createdAt);
    const isLiked = user?.uid ? item.likes.includes(user.uid) : false;

    return (
      <View style={feedStyles.postCard}>
        {/* Header: user info */}
        <View style={feedStyles.postHeader}>
          <View style={feedStyles.userInfo}>
            {item.userProfilePic ? (
              <Image 
                source={{ uri: item.userProfilePic }} 
                style={feedStyles.avatar} 
              />
            ) : (
              <View style={[feedStyles.avatar, feedStyles.avatarPlaceholder]}>
                <Text style={feedStyles.avatarText}>
                  {item.userName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={feedStyles.userName}>{item.userName}</Text>
              <Text style={feedStyles.postDate}>{postDate}</Text>
            </View>
          </View>
        </View>

        {/* Post image */}
        <Image 
          source={{ uri: item.photoUrl }} 
          style={feedStyles.postImage}
          resizeMode="cover"
        />

        {/* Post content */}
        <View style={feedStyles.postContent}>
          <View style={feedStyles.placeHeader}>
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
              <Text style={feedStyles.placeName}>{item.placeName}</Text>
              <Text style={feedStyles.placeAddress}>{item.placeAddress}</Text>
            </TouchableOpacity>
            <View style={feedStyles.rating}>
              <Text style={feedStyles.ratingText}>
                {Formatting.formatRating(item.rating)}
              </Text>
              <Text style={feedStyles.ratingNumber}>{item.rating}</Text>
            </View>
          </View>

          {item.description ? (
            <Text style={feedStyles.description}>{item.description}</Text>
          ) : null}

          {/* Location */}
          <View style={feedStyles.locationRow}>
            <Text style={feedStyles.locationIcon}>📍</Text>
            <Text style={feedStyles.locationText}>
              {item.placeAddress || 'Location'}
            </Text>
          </View>

          {/* Actions */}
          <View style={feedStyles.actions}>
            <TouchableOpacity 
              style={feedStyles.actionButton}
              onPress={() => handleLike(item.id)}
            >
              <Text style={feedStyles.actionText}>
                {isLiked ? '❤️' : '🤍'} {item.likes.length}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={feedStyles.actionButton}>
              <Text style={feedStyles.actionText}>💬 Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={feedStyles.actionButton}>
              <Text style={feedStyles.actionText}>🔖 Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Loading state
  if (loading && posts.length === 0) {
    return (
      <View style={feedStyles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={feedStyles.loadingText}>Loading posts...</Text>
      </View>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <View style={feedStyles.centerContainer}>
        <Text style={feedStyles.emptyText}>No posts yet!</Text>
        <Text style={feedStyles.emptySubtext}>
          Be the first to share a place
        </Text>
      </View>
    );
  }

  return (
    <View style={feedStyles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
        contentContainerStyle={feedStyles.listContent}
        onEndReached={() => {
          if (hasMore && !loading) {
            loadMore();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && posts.length > 0 ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : null
        }
      />
    </View>
  );
}