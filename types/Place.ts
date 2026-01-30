// Place-related types
export type SelectedPlace = {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: string[];
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
};

