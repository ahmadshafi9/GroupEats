import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import { PostService } from '../../services/posts/postService';
import { ImageUploadService } from '../../services/storage/imageUploadService';
import { GooglePlacesService } from '../../services/places/googlePlacesService';
import { Validation } from '../../utils/validation';
import { SelectedPlace } from '../../types/Place';
import { PlaceDetails } from '../../types/Place';

export default function NewPostWeb() {
  const { user, userProfile } = useAuth();

  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceDetails[]>([]);
  const [searching, setSearching] = useState(false);

  const [description, setDescription] = useState('');
  const [rating, setRating] = useState('5');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const searchPlaces = async (query: string) => {
    setPlaceName(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await GooglePlacesService.searchPlaces(query);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Please allow access to your photos');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlace) { alert('Please search and select a place'); return; }
    if (!imageUri) { alert('Please add a photo'); return; }
    if (!Validation.isRequired(description)) { alert('Please write a review'); return; }
    if (!user?.uid) { alert('You must be logged in to post'); return; }

    setUploading(true);
    try {
      const photoUrl = await ImageUploadService.uploadPostImage(imageUri, user.uid);
      await PostService.createPost({
        userId: user.uid,
        userName: userProfile?.name || 'Anonymous',
        userProfilePic: userProfile?.profilePic || '',
        placeId: selectedPlace.placeId,
        placeName: selectedPlace.name,
        placeAddress: selectedPlace.address,
        placeTypes: selectedPlace.types,
        description: description.trim(),
        rating: parseFloat(rating),
        photoUrl,
        location: { latitude: selectedPlace.lat, longitude: selectedPlace.lng },
      });
      alert('Review posted!');
      router.back();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Review a Place</Text>

      <Text style={styles.label}>Search for a place</Text>
      <TextInput
        style={styles.input}
        placeholder="Search restaurants, cafes..."
        value={placeName}
        onChangeText={searchPlaces}
      />
      {searching && <ActivityIndicator style={{ marginVertical: 8 }} />}
      {searchResults.length > 0 && (
        <View style={styles.suggestions}>
          {searchResults.slice(0, 5).map((place) => (
            <TouchableOpacity
              key={place.placeId}
              style={styles.suggestionItem}
              onPress={() => {
                setSelectedPlace({
                  placeId: place.placeId,
                  name: place.name,
                  address: place.address,
                  lat: place.location.latitude,
                  lng: place.location.longitude,
                  types: place.types,
                });
                setPlaceName(place.name);
                setSearchResults([]);
              }}
            >
              <Text style={styles.suggestionName}>{place.name}</Text>
              <Text style={styles.suggestionAddress}>{place.address}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {selectedPlace && (
        <View style={styles.selectedPlace}>
          <Text style={styles.selectedName}>✅ {selectedPlace.name}</Text>
          <Text style={styles.selectedAddress}>{selectedPlace.address}</Text>
        </View>
      )}

      <Text style={styles.label}>Add a photo</Text>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>No photo selected</Text>
        </View>
      )}
      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <Text style={styles.imageButtonText}>Choose from Gallery</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Your rating</Text>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((num) => (
          <TouchableOpacity
            key={num}
            style={[
              styles.ratingButton,
              rating === num.toString() && styles.ratingActive,
            ]}
            onPress={() => setRating(num.toString())}
          >
            <Text style={styles.ratingText}>{num} ⭐</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Your review</Text>
      <TextInput
        style={styles.textArea}
        placeholder="What did you think? Share your experience..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={6}
      />

      <TouchableOpacity
        style={[styles.submitButton, uploading && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={uploading}
      >
        <Text style={styles.submitText}>
          {uploading ? 'Posting...' : 'Post Review'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20, paddingTop: 60, maxWidth: 600, alignSelf: 'center', width: '100%' },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a2e', marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginTop: 20, marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  suggestions: {
    backgroundColor: '#fff', borderRadius: 12, marginTop: 4, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  suggestionItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  suggestionName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  suggestionAddress: { fontSize: 13, color: '#888', marginTop: 2 },
  selectedPlace: {
    backgroundColor: '#e8f5e9', borderRadius: 12, padding: 14, marginTop: 12,
  },
  selectedName: { fontSize: 15, fontWeight: '600', color: '#2e7d32' },
  selectedAddress: { fontSize: 13, color: '#555', marginTop: 4 },
  image: { width: '100%', height: 200, borderRadius: 12 },
  imagePlaceholder: {
    width: '100%', height: 200, borderRadius: 12, backgroundColor: '#e9ecef',
    justifyContent: 'center', alignItems: 'center',
  },
  placeholderText: { color: '#999', fontSize: 15 },
  imageButton: {
    backgroundColor: '#007AFF', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12,
  },
  imageButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', gap: 8 },
  ratingButton: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10,
    backgroundColor: '#e9ecef',
  },
  ratingActive: { backgroundColor: '#FFD60A' },
  ratingText: { fontSize: 15, fontWeight: '600' },
  textArea: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 16,
    minHeight: 120, textAlignVertical: 'top',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  submitButton: {
    backgroundColor: '#34C759', borderRadius: 14, padding: 16, alignItems: 'center',
    marginTop: 24, marginBottom: 40,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
