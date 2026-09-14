import axios from 'axios';
import { TravelMode } from '@packleader/shared';
import {
  IGeocodingResult,
  ILocationCoordinates,
  IMapService,
  IRouteResult,
  IRouteStep,
} from './map.types';

/**
 * Mapbox implementation of IMapService.
 * Calls Mapbox Directions API v5 and Geocoding API v5.
 */
export class MapboxService implements IMapService {
  public readonly providerName = 'mapbox';
  private readonly baseUrl = 'https://api.mapbox.com';
  private readonly accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken.trim();
  }

  /**
   * Check whether a valid Mapbox token is configured.
   */
  public isConfigured(): boolean {
    return Boolean(this.accessToken && this.accessToken.length > 0);
  }

  /**
   * Map generic Pack Leader TravelMode to Mapbox routing profile.
   */
  private mapTravelModeToProfile(mode?: TravelMode): string {
    switch (mode) {
      case TravelMode.HIKING:
        return 'mapbox/walking';
      case TravelMode.MOTORCYCLE:
        return 'mapbox/driving-traffic';
      case TravelMode.ROAD_TRIP:
      case TravelMode.FAMILY:
      case TravelMode.SOLO:
      default:
        return 'mapbox/driving-traffic';
    }
  }

  /**
   * Format distance into friendly string (e.g. "12.4 km" or "350 m").
   */
  private formatDistance(meters: number, isMock = false): string {
    const prefix = isMock ? '[MOCK] ' : '';
    if (meters >= 1000) {
      return `${prefix}${(meters / 1000).toFixed(1)} km`;
    }
    return `${prefix}${Math.round(meters)} m`;
  }

  /**
   * Format duration into friendly string (e.g. "1 hr 15 mins" or "25 mins").
   */
  private formatDuration(seconds: number, isMock = false): string {
    const prefix = isMock ? '[MOCK] ' : '';
    if (seconds >= 3600) {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.round((seconds % 3600) / 60);
      return `${prefix}${hrs} hr ${mins} mins`;
    }
    const mins = Math.max(1, Math.round(seconds / 60));
    return `${prefix}${mins} mins`;
  }

  /**
   * Request directions between origin and destination from Mapbox.
   */
  public async getDirections(
    origin: ILocationCoordinates,
    destination: ILocationCoordinates,
    mode?: TravelMode
  ): Promise<IRouteResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'Mapbox access token is not configured. Please configure EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment.'
      );
    }

    const profile = this.mapTravelModeToProfile(mode);
    // Mapbox requires {longitude},{latitude}
    const coordsStr = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const url = `${this.baseUrl}/directions/v5/${profile}/${coordsStr}`;

    try {
      const response = await axios.get(url, {
        params: {
          geometries: 'geojson',
          overview: 'full',
          steps: true,
          access_token: this.accessToken,
        },
        timeout: 12000,
      });

      if (!response.data.routes || response.data.routes.length === 0) {
        throw new Error('No route could be found between the specified locations.');
      }

      const route = response.data.routes[0];
      const coordinates: ILocationCoordinates[] = (
        route.geometry?.coordinates || []
      ).map(([lng, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lng,
      }));

      const steps: IRouteStep[] = [];
      if (route.legs && route.legs.length > 0) {
        for (const leg of route.legs) {
          if (leg.steps) {
            for (const s of leg.steps) {
              steps.push({
                instruction: s.maneuver?.instruction || '',
                distance: s.distance || 0,
                duration: s.duration || 0,
              });
            }
          }
        }
      }

      return {
        coordinates,
        distance: route.distance,
        duration: route.duration,
        distanceFormatted: this.formatDistance(route.distance),
        durationFormatted: this.formatDuration(route.duration),
        steps,
        isMock: false,
      };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(`Mapbox Directions Error: ${error.response.data.message}`);
      }
      throw new Error(error.message || 'Failed to fetch directions from Mapbox');
    }
  }

  /**
   * Search places by query string via Mapbox Geocoding API.
   */
  public async geocode(query: string): Promise<IGeocodingResult[]> {
    if (!query.trim()) return [];

    if (!this.isConfigured()) {
      throw new Error(
        'Mapbox access token is not configured. Please configure EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment.'
      );
    }

    const endpoint = `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(
      query.trim()
    )}.json`;

    try {
      const response = await axios.get(endpoint, {
        params: {
          access_token: this.accessToken,
          limit: 5,
        },
        timeout: 10000,
      });

      const features = response.data.features || [];
      return features.map((f: any) => ({
        name: f.text || f.place_name,
        address: f.place_name || '',
        coordinates: {
          latitude: f.center[1],
          longitude: f.center[0],
        },
      }));
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(`Mapbox Geocoding Error: ${error.response.data.message}`);
      }
      throw new Error(error.message || 'Failed to geocode address');
    }
  }

  /**
   * Look up human-readable place name from coordinates.
   */
  public async reverseGeocode(
    coordinates: ILocationCoordinates
  ): Promise<IGeocodingResult | null> {
    if (!this.isConfigured()) {
      throw new Error(
        'Mapbox access token is not configured. Please configure EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment.'
      );
    }

    const coordsStr = `${coordinates.longitude},${coordinates.latitude}`;
    const endpoint = `${this.baseUrl}/geocoding/v5/mapbox.places/${coordsStr}.json`;

    try {
      const response = await axios.get(endpoint, {
        params: {
          access_token: this.accessToken,
          limit: 1,
        },
        timeout: 10000,
      });

      const features = response.data.features || [];
      if (features.length === 0) return null;

      const f = features[0];
      return {
        name: f.text || f.place_name,
        address: f.place_name || '',
        coordinates: {
          latitude: f.center[1],
          longitude: f.center[0],
        },
      };
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(`Mapbox Reverse Geocoding Error: ${error.response.data.message}`);
      }
      throw new Error(error.message || 'Failed to reverse geocode coordinates');
    }
  }

  /**
   * Explicit MOCK generator strictly for testing/offline developer simulation.
   * Labeled explicitly with `[MOCK]` and `isMock: true`.
   */
  public getMockRouteForTesting(
    origin: ILocationCoordinates,
    destination: ILocationCoordinates
  ): IRouteResult {
    const straightDistanceMeters = Math.round(
      Math.sqrt(
        Math.pow(destination.latitude - origin.latitude, 2) +
          Math.pow(destination.longitude - origin.longitude, 2)
      ) * 111000
    );
    const mockDurationSeconds = Math.round(straightDistanceMeters / 15); // ~54 km/h

    return {
      coordinates: [
        origin,
        {
          latitude: (origin.latitude + destination.latitude) / 2 + 0.005,
          longitude: (origin.longitude + destination.longitude) / 2 - 0.005,
        },
        destination,
      ],
      distance: straightDistanceMeters,
      duration: mockDurationSeconds,
      distanceFormatted: this.formatDistance(straightDistanceMeters, true),
      durationFormatted: this.formatDuration(mockDurationSeconds, true),
      steps: [
        {
          instruction: '[MOCK] Depart from starting point',
          distance: straightDistanceMeters * 0.2,
          duration: mockDurationSeconds * 0.2,
        },
        {
          instruction: '[MOCK] Continue along main scenic highway',
          distance: straightDistanceMeters * 0.6,
          duration: mockDurationSeconds * 0.6,
        },
        {
          instruction: '[MOCK] Arrive at destination',
          distance: straightDistanceMeters * 0.2,
          duration: mockDurationSeconds * 0.2,
        },
      ],
      isMock: true,
    };
  }
}
