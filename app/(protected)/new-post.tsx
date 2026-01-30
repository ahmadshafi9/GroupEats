import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Image, 
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import { PostService } from '../../services/posts/postService';
import { ImageUploadService } from '../../services/storage/imageUploadService';
import { GooglePlacesService } from '../../services/places/googlePlacesService';
import { Validation } from '../../utils/validation';
import { SelectedPlace } from '../../types/Place';
import { newPostStyles } from '../../styles/newPost.styles';

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
    if (!Validation.isRequired(description)) {
      Alert.alert('Error', 'Please write a review');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to post');
      return;
    }

    setUploading(true);

    try {
      // Upload image
      const photoUrl = await ImageUploadService.uploadPostImage(imageUri, user.uid);

      // Create post in Firestore
      await PostService.createPost({
        userId: user.uid,
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
      style={newPostStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={newPostStyles.scrollView} keyboardShouldPersistTaps="always">
        <Text style={newPostStyles.title}>Review a Place</Text>

        {/* Google Places Search */}
        <View style={newPostStyles.searchSection}>
          <Text style={newPostStyles.label}>🔍 Search for a place:</Text>
          
          {/* Text input with dropdown suggestions */}
          <View>
            <TextInput
              style={newPostStyles.searchInput}
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
              <View style={newPostStyles.suggestionsContainer}>
                {filteredSuggestions.map((place, index) => (
                  <TouchableOpacity
                    key={index}
                    style={newPostStyles.suggestionItem}
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
                    <Text style={newPostStyles.suggestionName}>{place.name}</Text>
                    <Text style={newPostStyles.suggestionAddress}>{place.address}</Text>
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
            query={GooglePlacesService.getPlacesAutocompleteConfig()}
            styles={{
              container: { flex: 0 },
              textInput: newPostStyles.searchInput,
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
          <View style={newPostStyles.selectedPlace}>
            <Text style={newPostStyles.selectedPlaceName}>✅ {selectedPlace.name}</Text>
            <Text style={newPostStyles.selectedPlaceAddress}>{selectedPlace.address}</Text>
          </View>
        )}

        {/* Image picker */}
        <View style={newPostStyles.imageSection}>
          <Text style={newPostStyles.label}>📸 Add a photo:</Text>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={newPostStyles.image} />
          ) : (
            <View style={newPostStyles.imagePlaceholder}>
              <Text style={newPostStyles.placeholderText}>No photo selected</Text>
            </View>
          )}
          
          <View style={newPostStyles.buttonRow}>
            <TouchableOpacity style={newPostStyles.imageButton} onPress={pickImage}>
              <Text style={newPostStyles.buttonText}>📷 Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={newPostStyles.imageButton} onPress={takePhoto}>
              <Text style={newPostStyles.buttonText}>📸 Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rating */}
        <View style={newPostStyles.ratingSection}>
          <Text style={newPostStyles.label}>⭐ Your rating:</Text>
          <View style={newPostStyles.ratingButtons}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  newPostStyles.ratingButton,
                  rating === num.toString() && newPostStyles.ratingButtonActive
                ]}
                onPress={() => setRating(num.toString())}
              >
                <Text style={newPostStyles.ratingButtonText}>
                  {num} ⭐
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={newPostStyles.descriptionSection}>
          <Text style={newPostStyles.label}>✍️ Your review:</Text>
          <TextInput
            style={newPostStyles.textArea}
            placeholder="What did you think? Share your experience..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
          />
        </View>

        {/* Submit button */}
        <TouchableOpacity 
          style={[newPostStyles.submitButton, uploading && newPostStyles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={uploading}
        >
          <Text style={newPostStyles.submitButtonText}>
            {uploading ? 'Posting...' : 'Post Review'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}