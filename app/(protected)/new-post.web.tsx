import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import { PostService } from '../../services/posts/postService';
import { ImageUploadService } from '../../services/storage/imageUploadService';
import { Validation } from '../../utils/validation';

export default function NewPostWeb() {
  const { user, userProfile } = useAuth();

  const [placeName, setPlaceName] = useState('');
  const [placeAddress, setPlaceAddress] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState('5');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
    if (!placeName.trim()) { alert('Please enter a place name'); return; }
    if (!imageUri) { alert('Please add a photo'); return; }
    if (!Validation.isRequired(description)) { alert('Please write a review'); return; }
    if (!user?.uid) { alert('You must be logged in to post'); return; }

    setUploading(true);
    try {
      const photoUrl = await ImageUploadService.uploadPostImage(imageUri, user.uid);
      const placeId = placeName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await PostService.createPost({
        userId: user.uid,
        userName: userProfile?.name || 'Anonymous',
        userProfilePic: userProfile?.profilePic || '',
        placeId,
        placeName: placeName.trim(),
        placeAddress: placeAddress.trim() || placeName.trim(),
        placeTypes: ['restaurant'],
        description: description.trim(),
        rating: parseFloat(rating),
        photoUrl,
        location: { latitude: 0, longitude: 0 },
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

      <Text style={styles.label}>Place name</Text>
      <TextInput
        style={styles.input}
        placeholder={"e.g. Breka, Chipotle, Joe's Pizza..."}
        value={placeName}
        onChangeText={setPlaceName}
      />

      <Text style={styles.label}>Address or neighborhood (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Downtown, Main St..."
        value={placeAddress}
        onChangeText={setPlaceAddress}
      />

      {placeName.trim().length > 0 && (
        <View style={styles.selectedPlace}>
          <Text style={styles.selectedName}>📍 {placeName.trim()}</Text>
          {placeAddress.trim() ? (
            <Text style={styles.selectedAddress}>{placeAddress.trim()}</Text>
          ) : null}
        </View>
      )}

      <Text style={styles.label}>Add a photo</Text>
      {imageUri ? (
        <TouchableOpacity onPress={pickImage}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <Text style={styles.changePhotoHint}>Tap to change</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.imagePlaceholder} onPress={pickImage}>
          <Text style={styles.placeholderIcon}>📷</Text>
          <Text style={styles.placeholderText}>Tap to choose a photo</Text>
        </TouchableOpacity>
      )}

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
            <Text
              style={[
                styles.ratingText,
                rating === num.toString() && styles.ratingTextActive,
              ]}
            >
              {'⭐'.repeat(num)}
            </Text>
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

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: {
    padding: 20,
    paddingTop: 60,
    maxWidth: 560,
    alignSelf: 'center' as const,
    width: '100%',
  },
  title: { fontSize: 28, fontWeight: '700', color: '#1a1a2e', marginBottom: 8 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginTop: 20,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedPlace: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  selectedName: { fontSize: 16, fontWeight: '600', color: '#2e7d32' },
  selectedAddress: { fontSize: 13, color: '#555', marginTop: 4 },
  image: { width: '100%', height: 220, borderRadius: 12 },
  changePhotoHint: {
    textAlign: 'center' as const,
    color: '#888',
    fontSize: 13,
    marginTop: 6,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed' as const,
  },
  placeholderIcon: { fontSize: 36, marginBottom: 8 },
  placeholderText: { color: '#888', fontSize: 15 },
  ratingRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  ratingButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#e9ecef',
  },
  ratingActive: { backgroundColor: '#FFF3C4', borderWidth: 2, borderColor: '#FFD60A' },
  ratingText: { fontSize: 14 },
  ratingTextActive: { fontWeight: '700' },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top' as const,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  submitButton: {
    backgroundColor: '#34C759',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
