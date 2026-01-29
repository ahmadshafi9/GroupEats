import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Image, 
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';

const GOOGLE_PLACES_API_KEY = 'AIzaSyDqNDyio63FqckAyHsaCDOoidc6Mj3CgMU'; // Replace this!

type SelectedPlace = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
};

export default function NewPost() {
  const { user, userProfile } = useAuth();
  
  // Selected place from Google
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Mock places database
  const mockPlaces = [
    { name: 'Starbucks', address: 'Coffee Shop' },
    { name: 'McDonald\'s', address: 'Fast Food' },
    { name: 'Subway', address: 'Sandwich' },
    { name: 'Pizza Hut', address: 'Pizza' },
    { name: 'KFC', address: 'Fried Chicken' },
    { name: 'Chipotle', address: 'Mexican' },
    { name: 'Panera Bread', address: 'Bakery Cafe' },
    { name: 'Chick-fil-A', address: 'Fast Food' },
  ];
  
  // Filter suggestions based on input
  const filteredSuggestions = placeName.trim() 
    ? mockPlaces.filter(place =>
        place.name.toLowerCase().includes(placeName.toLowerCase())
      )
    : [];
  
  // Form state
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState('5');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Pick image from gallery
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Please allow access to your photos');
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

  // Take photo with camera
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Please allow access to your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Upload image to Firebase Storage
  const uploadImage = async (uri: string): Promise<string> => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(uri);
      const blob = await response.blob();

      const filename = `posts/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Submit post
  const handleSubmit = async () => {
    // Validation
    if (!selectedPlace) {
      Alert.alert('Error', 'Please search and select a place');
      return;
    }
    if (!imageUri) {
      Alert.alert('Error', 'Please add a photo');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please write a review');
      return;
    }

    setUploading(true);

    try {
      // Upload image
      const photoUrl = await uploadImage(imageUri);

      // Create post in Firestore
      await addDoc(collection(db, 'posts'), {
        userId: user?.uid,
        userName: userProfile?.name || 'Anonymous',
        userProfilePic: userProfile?.profilePic || '',
        
        // Google Place data
        placeId: selectedPlace.placeId,
        placeName: selectedPlace.name,
        placeAddress: selectedPlace.address,
        placeTypes: selectedPlace.types,
        
        description: description.trim(),
        rating: parseFloat(rating),
        photoUrl,
        
        location: {
          latitude: selectedPlace.lat,
          longitude: selectedPlace.lng,
        },
        
        createdAt: new Date().toISOString(),
        likes: [],
      });

      Alert.alert('Success', 'Review posted!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="always">
        <Text style={styles.title}>Review a Place</Text>

        {/* Google Places Search */}
        <View style={styles.searchSection}>
          <Text style={styles.label}>🔍 Search for a place:</Text>
          
          {/* Text input with dropdown suggestions */}
          <View>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter place name (e.g., Starbucks)"
              placeholderTextColor="#999"
              value={placeName}
              onChangeText={(text) => {
                setPlaceName(text);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            
            {/* Dropdown suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {filteredSuggestions.map((place, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSelectedPlace({
                        placeId: place.name.toLowerCase().replace(/\s+/g, '-'),
                        name: place.name,
                        address: place.address,
                        lat: 0,
                        lng: 0,
                        types: ['establishment'],
                      });
                      setPlaceName(place.name);
                      setShowSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionName}>{place.name}</Text>
                    <Text style={styles.suggestionAddress}>{place.address}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <GooglePlacesAutocomplete
            placeholder="Search restaurants, cafes, etc."
            fetchDetails={true}
            onPress={(data, details = null) => {
              if (details) {
                setSelectedPlace({
                  placeId: details.place_id,
                  name: details.name,
                  address: details.formatted_address,
                  lat: details.geometry.location.lat,
                  lng: details.geometry.location.lng,
                  types: details.types || [],
                });
                setShowSuggestions(false);
              }
            }}
            query={{
              key: GOOGLE_PLACES_API_KEY,
              language: 'en',
              types: 'establishment',
            }}
            styles={{
              container: { flex: 0 },
              textInput: styles.searchInput,
              listView: {
                position: 'absolute',
                top: 50,
                zIndex: 1000,
                backgroundColor: 'white',
                borderRadius: 8,
                elevation: 5,
              },
            }}
            enablePoweredByContainer={false}
          />
        </View>

        {/* Selected Place Display */}
        {selectedPlace && (
          <View style={styles.selectedPlace}>
            <Text style={styles.selectedPlaceName}>✅ {selectedPlace.name}</Text>
            <Text style={styles.selectedPlaceAddress}>{selectedPlace.address}</Text>
          </View>
        )}

        {/* Image picker */}
        <View style={styles.imageSection}>
          <Text style={styles.label}>📸 Add a photo:</Text>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>No photo selected</Text>
            </View>
          )}
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text style={styles.buttonText}>📷 Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Text style={styles.buttonText}>📸 Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.label}>⭐ Your rating:</Text>
          <View style={styles.ratingButtons}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.ratingButton,
                  rating === num.toString() && styles.ratingButtonActive
                ]}
                onPress={() => setRating(num.toString())}
              >
                <Text style={styles.ratingButtonText}>
                  {num} ⭐
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.label}>✍️ Your review:</Text>
          <TextInput
            style={styles.textArea}
            placeholder="What did you think? Share your experience..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
          />
        </View>

        {/* Submit button */}
        <TouchableOpacity 
          style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={uploading}
        >
          <Text style={styles.submitButtonText}>
            {uploading ? 'Posting...' : 'Post Review'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  searchSection: {
    marginBottom: 20,
    zIndex: 1000,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
    paddingHorizontal: 15,
    height: 50,
  },
  selectedPlace: {
    backgroundColor: '#e8f5e9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  selectedPlaceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  selectedPlaceAddress: {
    fontSize: 14,
    color: '#666',
  },
  imageSection: {
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#FFD700',
  },
  ratingButtonText: {
    fontSize: 14,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200,
    marginTop: 5,
    zIndex: 1000,
    elevation: 5,
  },
  suggestionItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  suggestionAddress: {
    fontSize: 13,
    color: '#999',
    marginTop: 3,
  },
});