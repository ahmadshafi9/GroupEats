import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { PlaceWithReviews } from '../../types/Post';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import { usePosts } from '../../hooks/usePosts';
import { PlaceService } from '../../services/places/placeService';

export default function ExploreWeb() {
  const { userProfile } = useAuth();
  const { posts } = usePosts({ enableRealtime: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<PlaceWithReviews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const placesData = await PlaceService.getAllPlacesWithReviews();
        setPlaces(placesData);
      } catch (error) {
        console.error('Error loading places:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPlaces();
  }, [posts]);

  const filteredPlaces = searchQuery
    ? places.filter(
        (place) =>
          place.placeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.placeAddress.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : places;

  const hasFriendReviews = (place: PlaceWithReviews) => {
    return place.posts.some((post) =>
      userProfile?.friends.includes(post.userId)
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading places...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore Places</Text>
        <Text style={styles.subtitle}>
          {places.length} places &middot; {posts.length} reviews
        </Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search places..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
          <Text style={styles.legendText}>Friends reviewed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF3B30' }]} />
          <Text style={styles.legendText}>Other places</Text>
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredPlaces.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={styles.emptyTitle}>No places yet</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to post a review!
            </Text>
          </View>
        ) : (
          filteredPlaces.map((place) => {
            const isFriend = hasFriendReviews(place);
            return (
              <TouchableOpacity
                key={place.placeId}
                style={styles.placeCard}
                onPress={() =>
                  router.push({
                    pathname: './place-detail',
                    params: {
                      placeId: place.placeId,
                      placeName: place.placeName,
                      placeAddress: place.placeAddress,
                    },
                  })
                }
              >
                <View
                  style={[
                    styles.cardAccent,
                    { backgroundColor: isFriend ? '#34C759' : '#FF3B30' },
                  ]}
                />
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.placeName}>{place.placeName}</Text>
                    {isFriend && (
                      <Text style={styles.friendBadge}>👥 Friends</Text>
                    )}
                  </View>
                  <Text style={styles.placeAddress}>{place.placeAddress}</Text>
                  <View style={styles.cardStats}>
                    <Text style={styles.rating}>
                      ⭐ {place.averageRating.toFixed(1)}
                    </Text>
                    <Text style={styles.reviewCount}>
                      {place.posts.length}{' '}
                      {place.posts.length === 1 ? 'review' : 'reviews'}
                    </Text>
                  </View>
                  {place.posts.length > 0 && place.posts[0].photoUrl && (
                    <Image
                      source={{ uri: place.posts[0].photoUrl }}
                      style={styles.previewImage}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 16 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a2e' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: { flex: 1, height: 48, fontSize: 16 },
  clearButton: { padding: 8 },
  clearButtonText: { fontSize: 16, color: '#999' },
  legend: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, color: '#666' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  placeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  cardAccent: { width: 5 },
  cardBody: { flex: 1, padding: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeName: { fontSize: 17, fontWeight: '600', color: '#1a1a2e', flex: 1 },
  friendBadge: { fontSize: 12, color: '#34C759', fontWeight: '600' },
  placeAddress: { fontSize: 13, color: '#888', marginTop: 4 },
  cardStats: { flexDirection: 'row', gap: 16, marginTop: 10 },
  rating: { fontSize: 14, fontWeight: '600' },
  reviewCount: { fontSize: 14, color: '#666' },
  previewImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginTop: 12,
  },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 16, color: '#333' },
  emptySubtitle: { fontSize: 15, color: '#888', marginTop: 8 },
});
