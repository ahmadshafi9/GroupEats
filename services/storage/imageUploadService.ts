import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebaseConfig';

/**
 * Image upload service
 * Handles image uploads to Firebase Cloud Storage
 */
export class ImageUploadService {
  /**
   * Upload an image from a local URI to Firebase Storage
   */
  static async uploadImage(
    uri: string,
    path: string,
    userId: string
  ): Promise<string> {
    try {
      // Fetch the image from local URI
      const response = await fetch(uri);
      const blob = await response.blob();

      // Create a unique filename
      const timestamp = Date.now();
      const filename = `${path}/${userId}/${timestamp}.jpg`;
      const storageRef = ref(storage, filename);

      // Upload the blob
      await uploadBytes(storageRef, blob);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to upload image'
      );
    }
  }

  /**
   * Upload a post image
   */
  static async uploadPostImage(uri: string, userId: string): Promise<string> {
    return this.uploadImage(uri, 'posts', userId);
  }

  /**
   * Upload a profile picture
   */
  static async uploadProfilePicture(
    uri: string,
    userId: string
  ): Promise<string> {
    return this.uploadImage(uri, 'profiles', userId);
  }

  /**
   * Delete an image from Storage (if needed in the future)
   */
  static async deleteImage(imagePath: string): Promise<void> {
    try {
      const storageRef = ref(storage, imagePath);
      // Note: Firebase Storage doesn't have a direct delete method in the web SDK
      // You would need to use the Admin SDK or a Cloud Function for this
      // For now, this is a placeholder
      throw new Error('Delete functionality requires Cloud Functions');
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete image'
      );
    }
  }
}

