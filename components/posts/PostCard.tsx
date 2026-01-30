import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Post } from '../../types/Post';
import { Formatting } from '../../utils/formatting';
import { feedStyles } from '../../styles/feed.styles';
import { router } from 'expo-router';

type PostCardProps = {
  post: Post;
  onLike?: (postId: string) => void;
  isLiked?: boolean;
};

export function PostCard({ post, onLike, isLiked = false }: PostCardProps) {
  const postDate = Formatting.formatDate(post.createdAt);

  return (
    <View style={feedStyles.postCard}>
      {/* Header: user info */}
      <View style={feedStyles.postHeader}>
        <View style={feedStyles.userInfo}>
          {post.userProfilePic ? (
            <Image 
              source={{ uri: post.userProfilePic }} 
              style={feedStyles.avatar} 
            />
          ) : (
            <View style={[feedStyles.avatar, feedStyles.avatarPlaceholder]}>
              <Text style={feedStyles.avatarText}>
                {post.userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={feedStyles.userName}>{post.userName}</Text>
            <Text style={feedStyles.postDate}>{postDate}</Text>
          </View>
        </View>
      </View>

      {/* Post image */}
      <Image 
        source={{ uri: post.photoUrl }} 
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
                placeId: post.placeId,
                placeName: post.placeName,
                placeAddress: post.placeAddress,
              }
            })}
          >
            <Text style={feedStyles.placeName}>{post.placeName}</Text>
            <Text style={feedStyles.placeAddress}>{post.placeAddress}</Text>
          </TouchableOpacity>
          <View style={feedStyles.rating}>
            <Text style={feedStyles.ratingText}>
              {Formatting.formatRating(post.rating)}
            </Text>
            <Text style={feedStyles.ratingNumber}>{post.rating}</Text>
          </View>
        </View>

        {post.description ? (
          <Text style={feedStyles.description}>{post.description}</Text>
        ) : null}

        {/* Location */}
        <View style={feedStyles.locationRow}>
          <Text style={feedStyles.locationIcon}>📍</Text>
          <Text style={feedStyles.locationText}>
            {post.placeAddress || 'Location'}
          </Text>
        </View>

        {/* Actions */}
        <View style={feedStyles.actions}>
          <TouchableOpacity 
            style={feedStyles.actionButton}
            onPress={() => onLike?.(post.id)}
          >
            <Text style={feedStyles.actionText}>
              {isLiked ? '❤️' : '🤍'} {post.likes.length}
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
}

