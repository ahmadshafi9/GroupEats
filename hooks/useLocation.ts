import { useState, useEffect } from 'react';
import { LocationService } from '../services/location/locationService';
import * as Location from 'expo-location';

/**
 * Custom hook for managing device location
 */
export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLocation();
  }, []);

  const loadLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentLocation = await LocationService.getCurrentLocation();
      setLocation(currentLocation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  return {
    location,
    loading,
    error,
    refresh: loadLocation,
  };
}

