// Source: Google Maps Platform Code Assist
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
 * Solution attribution identifier for Google Maps Platform tracking.
 */
const SOLUTION_ID = 'gmp_git_agentskills_v1';

/**
 * Decodes a Google encoded polyline string into an array of coordinate objects.
 * Standard pure TypeScript implementation of Google's Encoded Polyline Algorithm.
 */
export function decodeGooglePolyline(encoded: string): ILocationCoordinates[] {
  const points: ILocationCoordinates[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }
  return points;
}

/**
 * Google Maps Platform implementation of IMapService.
 * Uses modern Routes API v2 (with Directions fallback), Geocoding API, and Places API (New).
 */
export class GoogleMapsService implements IMapService {
  public readonly providerName = 'google-maps';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = (apiKey || '').trim();
  }

  /**
   * Check whether a valid Google Maps API key is configured.
   */
  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  /**
   * Format distance into human-friendly string (e.g. "12.4 km" or "350 m").
   */
  public formatDistance(meters: number, isMock = false): string {
    const prefix = isMock ? '[MOCK] ' : '';
    if (meters >= 1000) {
      return `${prefix}${(meters / 1000).toFixed(1)} km`;
    }
    return `${prefix}${Math.round(meters)} m`;
  }

  /**
   * Format duration into human-friendly string (e.g. "1 hr 15 mins" or "25 mins").
   */
  public formatDuration(seconds: number, isMock = false): string {
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
   * Parse duration string from Routes API (e.g. "1542s") or return raw seconds.
   */
  private parseDurationSeconds(duration: string | number): number {
    if (typeof duration === 'number') return duration;
    if (typeof duration === 'string') {
      const parsed = parseInt(duration.replace('s', ''), 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Request driving/riding/hiking directions using Google Routes API v2.
   * Falls back to Google Directions API if Routes API is unavailable on the key.
   */
  public async getDirections(
    origin: ILocationCoordinates,
    destination: ILocationCoordinates,
    mode?: TravelMode
  ): Promise<IRouteResult> {
    if (!this.isConfigured()) {
      throw new Error(
        'Google Maps API key is not configured. Please configure EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.'
      );
    }

    // Try Google Routes API v2 (Primary modern service)
    try {
      return await this.computeRoutesV2(origin, destination, mode);
    } catch (routesErr: any) {
      // If Routes API fails (e.g. 403 / disabled / billing required), attempt legacy Directions API fallback
      try {
        return await this.computeDirectionsLegacy(origin, destination, mode);
      } catch (directionsErr: any) {
        console.warn(
          `[GoogleMaps] Routing unavailable (${routesErr.message || directionsErr.message}). Using local route preview generator.`
        );
        return this.getMockRouteForTesting(origin, destination);
      }
    }
  }

  /**
   * Compute route using Google Routes API v2 (POST https://routes.googleapis.com/directions/v2:computeRoutes).
   */
  private async computeRoutesV2(
    origin: ILocationCoordinates,
    destination: ILocationCoordinates,
    mode?: TravelMode
  ): Promise<IRouteResult> {
    let travelMode = 'DRIVE';
    if (mode === TravelMode.HIKING) {
      travelMode = 'WALK';
    } else if (mode === TravelMode.MOTORCYCLE) {
      // Routes API v2 natively supports TWO_WHEELER
      travelMode = 'TWO_WHEELER';
    }

    const payload: any = {
      origin: {
        location: {
          latLng: {
            latitude: origin.latitude,
            longitude: origin.longitude,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
        },
      },
      travelMode,
      computeAlternativeRoutes: false,
    };

    // routingPreference is only allowed for DRIVE and TWO_WHEELER
    if (travelMode === 'DRIVE' || travelMode === 'TWO_WHEELER') {
      payload.routingPreference = 'TRAFFIC_AWARE';
    }

    const response = await axios.post(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask':
            'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps,routes.description',
          'X-Goog-Maps-Solution-ID': SOLUTION_ID,
        },
        timeout: 12000,
      }
    );

    const routes = response.data?.routes;
    if (!routes || routes.length === 0) {
      throw new Error('No route found between the specified locations.');
    }

    const route = routes[0];
    const encodedPolyline = route.polyline?.encodedPolyline || '';
    const coordinates = decodeGooglePolyline(encodedPolyline);
    const distanceMeters = route.distanceMeters || 0;
    const durationSeconds = this.parseDurationSeconds(route.duration);

    const steps: IRouteStep[] = [];
    if (route.legs && route.legs.length > 0) {
      for (const leg of route.legs) {
        if (leg.steps) {
          for (const s of leg.steps) {
            const instruction =
              s.navigationInstruction?.instructions ||
              s.navigationInstruction?.maneuver ||
              'Continue along route';
            steps.push({
              instruction,
              distance: s.distanceMeters || 0,
              duration: this.parseDurationSeconds(s.staticDuration || 0),
            });
          }
        }
      }
    }

    return {
      coordinates,
      distance: distanceMeters,
      duration: durationSeconds,
      distanceFormatted: this.formatDistance(distanceMeters),
      durationFormatted: this.formatDuration(durationSeconds),
      steps,
      isMock: false,
    };
  }

  /**
   * Fallback using Google Directions API (GET https://maps.googleapis.com/maps/api/directions/json).
   */
  private async computeDirectionsLegacy(
    origin: ILocationCoordinates,
    destination: ILocationCoordinates,
    mode?: TravelMode
  ): Promise<IRouteResult> {
    let gMode = 'driving';
    if (mode === TravelMode.HIKING) {
      gMode = 'walking';
    } else if (mode === TravelMode.MOTORCYCLE) {
      gMode = 'driving'; // Directions API uses driving for motorcycles
    }

    const url = 'https://maps.googleapis.com/maps/api/directions/json';
    const response = await axios.get(url, {
      params: {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode: gMode,
        key: this.apiKey,
        solution_id: SOLUTION_ID,
      },
      timeout: 12000,
    });

    if (response.data.status !== 'OK' || !response.data.routes?.length) {
      throw new Error(
        response.data.error_message ||
          `Directions request failed with status: ${response.data.status}`
      );
    }

    const route = response.data.routes[0];
    const encodedPolyline = route.overview_polyline?.points || '';
    const coordinates = decodeGooglePolyline(encodedPolyline);

    let totalDistance = 0;
    let totalDuration = 0;
    const steps: IRouteStep[] = [];

    if (route.legs) {
      for (const leg of route.legs) {
        totalDistance += leg.distance?.value || 0;
        totalDuration += leg.duration?.value || 0;
        if (leg.steps) {
          for (const s of leg.steps) {
            // Strip HTML tags from directions instructions
            const rawInstruction = s.html_instructions || '';
            const plainInstruction = rawInstruction.replace(/<[^>]*>?/gm, ' ').trim();
            steps.push({
              instruction: plainInstruction || 'Proceed',
              distance: s.distance?.value || 0,
              duration: s.duration?.value || 0,
            });
          }
        }
      }
    }

    return {
      coordinates,
      distance: totalDistance,
      duration: totalDuration,
      distanceFormatted: this.formatDistance(totalDistance),
      durationFormatted: this.formatDuration(totalDuration),
      steps,
      isMock: false,
    };
  }

  /**
   * Search places by text query via Places API (New) Text Search,
   * falling back to Geocoding API if Places API is not active.
   */
  public async geocode(query: string): Promise<IGeocodingResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    if (!this.isConfigured()) {
      throw new Error(
        'Google Maps API key is not configured. Please configure EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.'
      );
    }

    // Attempt Places API (New) Text Search first
    try {
      const placesResponse = await axios.post(
        'https://places.googleapis.com/v1/places:searchText',
        {
          textQuery: trimmed,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.formattedAddress,places.location',
            'X-Goog-Maps-Solution-ID': SOLUTION_ID,
          },
          timeout: 10000,
        }
      );

      const places = placesResponse.data?.places;
      if (places && places.length > 0) {
        return places.map((p: any) => ({
          name: p.displayName?.text || p.formattedAddress,
          address: p.formattedAddress || '',
          coordinates: {
            latitude: p.location.latitude,
            longitude: p.location.longitude,
          },
        }));
      }
    } catch {
      // Fall through to Geocoding API
    }

    // Geocoding API (GET https://maps.googleapis.com/maps/api/geocode/json)
    try {
      const geoResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: trimmed,
          key: this.apiKey,
          solution_id: SOLUTION_ID,
        },
        timeout: 10000,
      });

      if (geoResponse.data.status === 'OK' && geoResponse.data.results?.length > 0) {
        return geoResponse.data.results.slice(0, 5).map((r: any) => {
          const firstPart = r.formatted_address?.split(',')[0] || r.formatted_address;
          return {
            name: firstPart,
            address: r.formatted_address || '',
            coordinates: {
              latitude: r.geometry.location.lat,
              longitude: r.geometry.location.lng,
            },
          };
        });
      }

      if (geoResponse.data.status === 'REQUEST_DENIED' || geoResponse.data.status === 'OVER_QUERY_LIMIT') {
        console.warn(
          `[GoogleMaps] ${geoResponse.data.status}: ${geoResponse.data.error_message || 'Billing or permissions required'}. Falling back to OpenStreetMap geocoding.`
        );
        return await this.fallbackGeocodeNominatim(trimmed);
      }
      return [];
    } catch (err: any) {
      console.warn('[GoogleMaps] Geocoding request failed, trying fallback:', err.message);
      return await this.fallbackGeocodeNominatim(trimmed);
    }
  }

  /**
   * Graceful geocoding fallback via OpenStreetMap Nominatim when Google Cloud billing is pending or quota is exceeded.
   */
  private async fallbackGeocodeNominatim(query: string): Promise<IGeocodingResult[]> {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          limit: 5,
        },
        headers: {
          'User-Agent': 'PackLeaderApp/1.0',
        },
        timeout: 8000,
      });

      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data.map((item: any) => ({
          name: item.name || item.display_name?.split(',')[0] || query,
          address: item.display_name || '',
          coordinates: {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          },
        }));
      }
    } catch (err: any) {
      console.warn('[FallbackGeocode] Nominatim search failed:', err.message);
    }
    return [];
  }

  /**
   * Look up human-readable place/address from geographic coordinates using Google Geocoding API.
   */
  public async reverseGeocode(
    coordinates: ILocationCoordinates
  ): Promise<IGeocodingResult | null> {
    if (!this.isConfigured()) {
      throw new Error(
        'Google Maps API key is not configured. Please configure EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.'
      );
    }

    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          latlng: `${coordinates.latitude},${coordinates.longitude}`,
          key: this.apiKey,
          solution_id: SOLUTION_ID,
        },
        timeout: 10000,
      });

      if (response.data.status === 'OK' && response.data.results?.length > 0) {
        const first = response.data.results[0];
        const name = first.formatted_address?.split(',')[0] || first.formatted_address;
        return {
          name,
          address: first.formatted_address || '',
          coordinates: {
            latitude: first.geometry.location.lat,
            longitude: first.geometry.location.lng,
          },
        };
      }

      if (response.data.status === 'REQUEST_DENIED' || response.data.status === 'OVER_QUERY_LIMIT') {
        return await this.fallbackReverseGeocodeNominatim(coordinates);
      }
      return null;
    } catch {
      return await this.fallbackReverseGeocodeNominatim(coordinates);
    }
  }

  /**
   * Graceful reverse geocoding fallback via OpenStreetMap Nominatim.
   */
  private async fallbackReverseGeocodeNominatim(
    coordinates: ILocationCoordinates
  ): Promise<IGeocodingResult | null> {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: coordinates.latitude,
          lon: coordinates.longitude,
          format: 'json',
        },
        headers: {
          'User-Agent': 'PackLeaderApp/1.0',
        },
        timeout: 8000,
      });

      if (response.data && response.data.display_name) {
        const name = response.data.name || response.data.display_name.split(',')[0];
        return {
          name,
          address: response.data.display_name,
          coordinates: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
          },
        };
      }
    } catch {
      // Ignore fallback failure
    }
    return null;
  }

  /**
   * Explicit MOCK generator strictly for testing/offline simulation.
   * Strictly flagged with `isMock: true` and labeled with `[MOCK]` prefixes.
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
          latitude: (origin.latitude + destination.latitude) / 2 + 0.004,
          longitude: (origin.longitude + destination.longitude) / 2 - 0.004,
        },
        destination,
      ],
      distance: straightDistanceMeters,
      duration: mockDurationSeconds,
      distanceFormatted: this.formatDistance(straightDistanceMeters, true),
      durationFormatted: this.formatDuration(mockDurationSeconds, true),
      steps: [
        {
          instruction: '[MOCK] Depart from start point via Main Boulevard',
          distance: straightDistanceMeters * 0.25,
          duration: mockDurationSeconds * 0.25,
        },
        {
          instruction: '[MOCK] Continue onto Highway 101 towards destination',
          distance: straightDistanceMeters * 0.5,
          duration: mockDurationSeconds * 0.5,
        },
        {
          instruction: '[MOCK] Take exit and arrive at destination',
          distance: straightDistanceMeters * 0.25,
          duration: mockDurationSeconds * 0.25,
        },
      ],
      isMock: true,
    };
  }
}
