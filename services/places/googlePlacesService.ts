import { PlaceDetails } from '../../types/Place';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

/**
 * Google Places service
 * Handles Google Places API interactions
 */
export class GooglePlacesService {
  /**
   * Search for places using Google Places Autocomplete
   * Note: This is a wrapper for the react-native-google-places-autocomplete component
   * For direct API calls, use the Google Places API directly
   */
  static getPlacesAutocompleteConfig() {
    return {
      key: GOOGLE_PLACES_API_KEY,
      language: 'en',
      types: 'establishment',
    };
  }

  /**
   * Get place details by place ID
   */
  static async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_PLACES_API_KEY}&fields=name,formatted_address,geometry,types,rating,user_ratings_total`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        const result = data.result;
        return {
          placeId: result.place_id,
          name: result.name,
          address: result.formatted_address,
          location: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
          },
          types: result.types || [],
          rating: result.rating,
          userRatingsTotal: result.user_ratings_total,
        };
      }

      return null;
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to fetch place details'
      );
    }
  }

  /**
   * Search for places by text query
   */
  static async searchPlaces(query: string): Promise<PlaceDetails[]> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&type=restaurant|food`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        return data.results.map((result: any) => ({
          placeId: result.place_id,
          name: result.name,
          address: result.formatted_address,
          location: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
          },
          types: result.types || [],
          rating: result.rating,
          userRatingsTotal: result.user_ratings_total,
        }));
      }

      return [];
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to search places'
      );
    }
  }
}

