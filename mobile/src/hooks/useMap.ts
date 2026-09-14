import { useState, useEffect, useCallback } from 'react';
import { TravelMode, ITrip, TripStatus } from '@packleader/shared';
import {
  IGeocodingResult,
  ILocationCoordinates,
  IRouteResult,
  mapService,
} from '../services/map';
import { locationService } from '../services/location.service';
import { fetchMyTrips } from '../services/trip.api';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface UseMapReturn {
  userLocation: ILocationCoordinates | null;
  userAddress: string | null;
  permissionGranted: boolean | null;
  destinationCoordinates: ILocationCoordinates | null;
  destinationName: string | null;
  route: IRouteResult | null;
  searchResults: IGeocodingResult[];
  isSearching: boolean;
  isRouting: boolean;
  isConfigured: boolean;
  activeTrip: ITrip | null;
  errorMessage: string | null;
  activeTravelMode: TravelMode;
  setActiveTravelMode: (mode: TravelMode) => void;
  searchPlaces: (query: string) => Promise<void>;
  clearSearchResults: () => void;
  selectDestination: (coords: ILocationCoordinates, name: string) => void;
  calculateRoute: (destination?: ILocationCoordinates, mode?: TravelMode) => Promise<void>;
  clearRoute: () => void;
  refreshUserLocation: () => Promise<void>;
  loadTripDestination: (trip: ITrip) => Promise<void>;
  calculateRegion: () => MapRegion | null;
}

/**
 * Custom hook encapsulating mapping and location business logic.
 * Keeps the MapScreen thin and declarative.
 */
export function useMap(): UseMapReturn {
  const [userLocation, setUserLocation] = useState<ILocationCoordinates | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [destinationCoordinates, setDestinationCoordinates] =
    useState<ILocationCoordinates | null>(null);
  const [destinationName, setDestinationName] = useState<string | null>(null);
  const [route, setRoute] = useState<IRouteResult | null>(null);
  const [searchResults, setSearchResults] = useState<IGeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [activeTrip, setActiveTrip] = useState<ITrip | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTravelMode, setActiveTravelMode] = useState<TravelMode>(TravelMode.MOTORCYCLE);

  const isConfigured = mapService.isConfigured();

  const refreshUserLocation = useCallback(async () => {
    try {
      const hasPermission = await locationService.requestLocationPermissions();
      setPermissionGranted(hasPermission);

      const pos = await locationService.getCurrentLocation();
      setUserLocation(pos);

      if (mapService.isConfigured()) {
        try {
          const geo = await mapService.reverseGeocode(pos);
          if (geo) {
            setUserAddress(geo.name || geo.address);
          }
        } catch {
          // Ignore reverse geocoding failure
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to determine location');
    }
  }, []);

  // Fetch active trip if one exists
  const checkForActiveTrip = useCallback(async () => {
    try {
      const trips = await fetchMyTrips();
      const currentActive = trips.find((t) => t.status === TripStatus.ACTIVE);
      if (currentActive) {
        setActiveTrip(currentActive);
        if (currentActive.travelMode) {
          setActiveTravelMode(currentActive.travelMode);
        }
      }
    } catch {
      // Backend may be offline or user not logged in; continue gracefully
    }
  }, []);

  useEffect(() => {
    refreshUserLocation();
    checkForActiveTrip();
  }, [refreshUserLocation, checkForActiveTrip]);

  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);

    try {
      const results = await mapService.geocode(query);
      setSearchResults(results);
    } catch (err: any) {
      setErrorMessage(err.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  const selectDestination = useCallback((coords: ILocationCoordinates, name: string) => {
    setDestinationCoordinates(coords);
    setDestinationName(name);
    setSearchResults([]);
  }, []);

  const calculateRoute = useCallback(
    async (targetDestination?: ILocationCoordinates, mode?: TravelMode) => {
      const dest = targetDestination || destinationCoordinates;
      if (!dest) {
        setErrorMessage('Please specify or search for a destination first');
        return;
      }

      if (!userLocation) {
        setErrorMessage('Current user location is not yet available');
        return;
      }

      setIsRouting(true);
      setErrorMessage(null);

      const effectiveMode = mode || activeTravelMode;

      try {
        const routeData = await mapService.getDirections(userLocation, dest, effectiveMode);
        setRoute(routeData);
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setIsRouting(false);
      }
    },
    [userLocation, destinationCoordinates, activeTravelMode]
  );

  const loadTripDestination = useCallback(
    async (trip: ITrip) => {
      const dest = trip.destination;
      if (!dest) {
        setErrorMessage('This expedition has no destination specified');
        return;
      }

      const destName = dest.name || dest.address || 'Expedition Destination';
      setDestinationName(destName);

      if (dest.coordinates && dest.coordinates.latitude && dest.coordinates.longitude) {
        const coords: ILocationCoordinates = {
          latitude: dest.coordinates.latitude,
          longitude: dest.coordinates.longitude,
        };
        setDestinationCoordinates(coords);
        await calculateRoute(coords, trip.travelMode || activeTravelMode);
      } else if (dest.address || dest.name) {
        const query = (dest.address || dest.name || '').trim();
        if (!query) {
          setErrorMessage('Could not determine expedition destination name');
          return;
        }
        try {
          const results = await mapService.geocode(query);
          if (results.length > 0) {
            const first = results[0];
            setDestinationCoordinates(first.coordinates);
            await calculateRoute(first.coordinates, trip.travelMode || activeTravelMode);
          } else {
            setErrorMessage(`Could not resolve coordinates for ${query}`);
          }
        } catch (err: any) {
          setErrorMessage(err.message);
        }
      }
    },
    [calculateRoute, activeTravelMode]
  );

  const clearRoute = useCallback(() => {
    setRoute(null);
    setDestinationCoordinates(null);
    setDestinationName(null);
    setErrorMessage(null);
  }, []);

  const calculateRegion = useCallback((): MapRegion | null => {
    if (!userLocation) return null;

    if (!destinationCoordinates) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    const minLat = Math.min(userLocation.latitude, destinationCoordinates.latitude);
    const maxLat = Math.max(userLocation.latitude, destinationCoordinates.latitude);
    const minLng = Math.min(userLocation.longitude, destinationCoordinates.longitude);
    const maxLng = Math.max(userLocation.longitude, destinationCoordinates.longitude);

    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    const deltaLat = Math.max((maxLat - minLat) * 1.5, 0.04);
    const deltaLng = Math.max((maxLng - minLng) * 1.5, 0.04);

    return {
      latitude: midLat,
      longitude: midLng,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLng,
    };
  }, [userLocation, destinationCoordinates]);

  return {
    userLocation,
    userAddress,
    permissionGranted,
    destinationCoordinates,
    destinationName,
    route,
    searchResults,
    isSearching,
    isRouting,
    isConfigured,
    activeTrip,
    errorMessage,
    activeTravelMode,
    setActiveTravelMode,
    searchPlaces,
    clearSearchResults,
    selectDestination,
    calculateRoute,
    clearRoute,
    refreshUserLocation,
    loadTripDestination,
    calculateRegion,
  };
}
