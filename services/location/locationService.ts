import * as Location from 'expo-location';

/**
 * Location service
 * Handles device location operations
 */
export class LocationService {
  /**
   * Request location permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to request location permissions'
      );
    }
  }

  /**
   * Get current location
   */
  static async getCurrentLocation(): Promise<Location.LocationObject> {
    try {
      const hasPermission = await this.requestPermissions();
      
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return location;
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to get current location'
      );
    }
  }

  /**
   * Watch position (for real-time location updates)
   */
  static async watchPosition(
    callback: (location: Location.LocationObject) => void
  ): Promise<Location.LocationSubscription> {
    try {
      const hasPermission = await this.requestPermissions();
      
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        callback
      );
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to watch position'
      );
    }
  }
}

