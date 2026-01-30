import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
  ScrollView
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { PlaceWithReviews } from '../../types/Post';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import { useLocation } from '../../hooks/useLocation';
import { usePosts } from '../../hooks/usePosts';
import { PlaceService } from '../../services/places/placeService';
import { exploreStyles } from '../../styles/explore.styles';

export default function Explore() {
  const { userProfile } = useAuth();
  const mapRef = useRef<MapView>(null);
  
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const { posts } = usePosts({ enableRealtime: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithReviews | null>(null);
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [places, setPlaces] = useState<PlaceWithReviews[]>([]);

  // Load places with reviews
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const placesData = await PlaceService.getAllPlacesWithReviews();
        setPlaces(placesData);
      } catch (error) {
        console.error('Error loading places:', error);
      }
    };
    loadPlaces();
  }, [posts]);

  // Filter places by search query
  const filteredPlaces = searchQuery
    ? places.filter(place => 
        place.placeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.placeAddress.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : places;

  useEffect(() => {
    if (locationError) {
      Alert.alert('Permission Denied', 'Please enable location access to see places around you');
    }
  }, [locationError]);

  // Center map on user location
  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  // Handle marker press
  const handleMarkerPress = (place: PlaceWithReviews) => {
    setSelectedPlace(place);
    setShowPlaceModal(true);
  };

  // Check if place has friend reviews
  const hasFriendReviews = (place: PlaceWithReviews) => {
    return place.posts.some(post => 
      userProfile?.friends.includes(post.userId)
    );
  };

  if (locationLoading) {
    return (
      <View style={exploreStyles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={exploreStyles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  const initialRegion = location ? {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : {
    latitude: 25.2048,
    longitude: 55.2708,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  return (
    <View style={exploreStyles.container}>
      {/* Search Bar */}
      <View style={exploreStyles.searchBar}>
        <TextInput
          style={exploreStyles.searchInput}
          placeholder="Search places..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity 
            style={exploreStyles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={exploreStyles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={exploreStyles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Place Markers */}
        {filteredPlaces.map((place) => {
          const isFriendPlace = hasFriendReviews(place);
          
          return (
            <Marker
              key={place.placeId}
              coordinate={{
                latitude: place.location.latitude,
                longitude: place.location.longitude,
              }}
              pinColor={isFriendPlace ? '#34C759' : '#FF3B30'}
              onPress={() => handleMarkerPress(place)}
            >
              <Callout tooltip>
                <View style={exploreStyles.callout}>
                  <Text style={exploreStyles.calloutTitle}>{place.placeName}</Text>
                  <Text style={exploreStyles.calloutRating}>
                    ⭐ {place.averageRating.toFixed(1)} ({place.posts.length} reviews)
                  </Text>
                  {isFriendPlace && (
                    <Text style={exploreStyles.calloutFriend}>👥 Friends reviewed this</Text>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Center on User Button */}
      <TouchableOpacity 
        style={exploreStyles.locationButton}
        onPress={centerOnUser}
      >
        <Text style={exploreStyles.locationButtonText}>📍</Text>
      </TouchableOpacity>

      {/* Legend */}
      <View style={exploreStyles.legend}>
        <View style={exploreStyles.legendItem}>
          <View style={[exploreStyles.legendDot, { backgroundColor: '#34C759' }]} />
          <Text style={exploreStyles.legendText}>Friends reviewed</Text>
        </View>
        <View style={exploreStyles.legendItem}>
          <View style={[exploreStyles.legendDot, { backgroundColor: '#FF3B30' }]} />
          <Text style={exploreStyles.legendText}>Other places</Text>
        </View>
      </View>

      {/* Place Detail Modal */}
      <Modal
        visible={showPlaceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlaceModal(false)}
      >
        <View style={exploreStyles.modalOverlay}>
          <View style={exploreStyles.modalContent}>
            {selectedPlace && (
              <>
                <View style={exploreStyles.modalHeader}>
                  <View style={exploreStyles.modalHeaderText}>
                    <Text style={exploreStyles.modalPlaceName}>{selectedPlace.placeName}</Text>
                    <Text style={exploreStyles.modalPlaceAddress}>{selectedPlace.placeAddress}</Text>
                  </View>
                  <TouchableOpacity 
                    style={exploreStyles.closeButton}
                    onPress={() => setShowPlaceModal(false)}
                  >
                    <Text style={exploreStyles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={exploreStyles.modalStats}>
                  <View style={exploreStyles.statBox}>
                    <Text style={exploreStyles.statNumber}>⭐ {selectedPlace.averageRating.toFixed(1)}</Text>
                    <Text style={exploreStyles.statLabel}>Rating</Text>
                  </View>
                  <View style={exploreStyles.statBox}>
                    <Text style={exploreStyles.statNumber}>{selectedPlace.posts.length}</Text>
                    <Text style={exploreStyles.statLabel}>Reviews</Text>
                  </View>
                </View>

                <ScrollView style={exploreStyles.reviewsList}>
                  <Text style={exploreStyles.reviewsTitle}>Recent Reviews:</Text>
                  {selectedPlace.posts.slice(0, 3).map((post) => {
                    const isFriend = userProfile?.friends.includes(post.userId);
                    return (
                      <View key={post.id} style={exploreStyles.miniReview}>
                        <Image source={{ uri: post.photoUrl }} style={exploreStyles.miniImage} />
                        <View style={exploreStyles.miniReviewContent}>
                          <View style={exploreStyles.miniReviewHeader}>
                            <Text style={exploreStyles.miniReviewUser}>
                              {post.userName}
                              {isFriend && <Text style={exploreStyles.friendBadge}> 👥</Text>}
                            </Text>
                            <Text style={exploreStyles.miniReviewRating}>⭐ {post.rating}</Text>
                          </View>
                          <Text style={exploreStyles.miniReviewText} numberOfLines={2}>
                            {post.description}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity
                  style={exploreStyles.viewAllButton}
                  onPress={() => {
                    setShowPlaceModal(false);
                    router.push({
                      pathname: './place-detail',
                      params: {
                        placeId: selectedPlace.placeId,
                        placeName: selectedPlace.placeName,
                        placeAddress: selectedPlace.placeAddress,
                      }
                    });
                  }}
                >
                  <Text style={exploreStyles.viewAllButtonText}>View All Reviews</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Stats Bar */}
      <View style={exploreStyles.statsBar}>
        <Text style={exploreStyles.statsText}>
          {places.length} places • {posts.length} reviews
        </Text>
      </View>
    </View>
  );
}
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  searchBar: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 20,
    color: '#666',
  },
  locationButton: {
    position: 'absolute',
    bottom: 120,
    right: 15,
    width: 50,
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  locationButtonText: {
    fontSize: 24,
  },
  legend: {
    position: 'absolute',
    top: 70,
    left: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#333',
  },
  callout: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    minWidth: 200,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutRating: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  calloutFriend: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalPlaceName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalPlaceAddress: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  modalStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
  reviewsList: {
    maxHeight: 300,
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  miniReview: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  miniImage: {
    width: 80,
    height: 80,
  },
  miniReviewContent: {
    flex: 1,
    padding: 10,
  },
  miniReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  miniReviewUser: {
    fontSize: 14,
    fontWeight: '600',
  },
  friendBadge: {
    color: '#34C759',
  },
  miniReviewRating: {
    fontSize: 12,
  },
  miniReviewText: {
    fontSize: 13,
    color: '#666',
  },
  viewAllButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  viewAllButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsBar: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
});