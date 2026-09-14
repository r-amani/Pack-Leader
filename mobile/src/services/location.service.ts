import * as Location from 'expo-location';
import { ILocationCoordinates } from './map/map.types';

export interface ILocationStatus {
  hasPermission: boolean;
  canAskAgain: boolean;
  isServicesEnabled?: boolean;
}

/**
 * Service managing device location permissions and GPS positioning via expo-location.
 * Supports fine/coarse GPS positioning, continuous tracking, and graceful fallback.
 */
export class LocationService {
  private static defaultLocation: ILocationCoordinates = {
    latitude: 37.7749,
    longitude: -122.4194,
  };

  /**
   * Request foreground location permissions from the device.
   * Alias: requestLocationPermissions()
   */
  public async requestPermissions(): Promise<boolean> {
    return this.requestLocationPermissions();
  }

  public async requestLocationPermissions(): Promise<boolean> {
    try {
      if (Location && Location.requestForegroundPermissionsAsync) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === Location.PermissionStatus.GRANTED;
      }

      // Browser / web fallback
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 5000 }
          );
        });
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if location services (GPS) are enabled on the device.
   */
  public async isLocationEnabled(): Promise<boolean> {
    try {
      if (Location && Location.hasServicesEnabledAsync) {
        return await Location.hasServicesEnabledAsync();
      }
      return true;
    } catch {
      return true;
    }
  }

  /**
   * Get the current GPS position of the device.
   * Alias: getCurrentLocation()
   */
  public async getCurrentPosition(): Promise<ILocationCoordinates> {
    return this.getCurrentLocation();
  }

  public async getCurrentLocation(): Promise<ILocationCoordinates> {
    try {
      if (Location && Location.getCurrentPositionAsync) {
        // Attempt high-accuracy GPS acquisition
        try {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          return {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
        } catch {
          // If high-accuracy times out, attempt last known position
          if (Location.getLastKnownPositionAsync) {
            const lastKnown = await Location.getLastKnownPositionAsync();
            if (lastKnown) {
              return {
                latitude: lastKnown.coords.latitude,
                longitude: lastKnown.coords.longitude,
              };
            }
          }
        }
      }

      // Browser / web fallback
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
              });
            },
            () => resolve(LocationService.defaultLocation),
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
      }

      return LocationService.defaultLocation;
    } catch {
      return LocationService.defaultLocation;
    }
  }

  /**
   * Subscribe to continuous location updates.
   * Alias: watchLocation()
   * Returns an unsubscribe function.
   */
  public watchPosition(
    onLocation: (coords: ILocationCoordinates) => void,
    onError?: (error: string) => void
  ): () => void {
    return this.watchLocation(onLocation, onError);
  }

  public watchLocation(
    onLocation: (coords: ILocationCoordinates) => void,
    onError?: (error: string) => void
  ): () => void {
    let subscription: Location.LocationSubscription | null = null;
    let isCancelled = false;

    if (Location && Location.watchPositionAsync) {
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        (loc) => {
          if (!isCancelled) {
            onLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        }
      ).then(
        (sub) => {
          if (isCancelled) {
            sub.remove();
          } else {
            subscription = sub;
          }
        },
        (err) => {
          if (onError && !isCancelled) onError(err.message || 'Location tracking error');
        }
      );

      return () => {
        isCancelled = true;
        if (subscription) {
          subscription.remove();
        }
      };
    }

    // Web / browser fallback
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          onLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          if (onError) onError(err.message);
        },
        { enableHighAccuracy: true }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }

    // Default immediate callback
    onLocation(LocationService.defaultLocation);
    return () => {};
  }
}

export const locationService = new LocationService();
