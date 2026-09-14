import { TravelMode } from '@packleader/shared';

/**
 * Geographic coordinate pair.
 */
export interface ILocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Result returned from a geocoding (place search) lookup.
 */
export interface IGeocodingResult {
  name: string;
  address: string;
  coordinates: ILocationCoordinates;
}

/**
 * Individual turn-by-turn navigation maneuver.
 */
export interface IRouteStep {
  instruction: string;
  distance: number; // in meters
  duration: number; // in seconds
}

/**
 * Complete route calculation result containing geometry, distance, and ETA.
 */
export interface IRouteResult {
  coordinates: ILocationCoordinates[];
  distance: number; // total distance in meters
  duration: number; // total duration in seconds
  distanceFormatted: string; // e.g. "45.2 km"
  durationFormatted: string; // e.g. "35 mins"
  steps?: IRouteStep[];
  /** Flag explicitly indicating whether this is mock data for testing */
  isMock?: boolean;
}

/**
 * Provider-agnostic mapping service abstraction.
 * Allows Mapbox as current implementation while enabling future provider replacement (e.g. Google Maps).
 */
export interface IMapService {
  /** The identifier of the active provider (e.g., 'mapbox', 'google-maps') */
  readonly providerName: string;

  /** Check whether the provider has valid API credentials configured */
  isConfigured(): boolean;

  /**
   * Request driving/riding/hiking directions between two points.
   */
  getDirections(
    origin: ILocationCoordinates,
    destination: ILocationCoordinates,
    mode?: TravelMode
  ): Promise<IRouteResult>;

  /**
   * Forward geocoding: search places by name or address.
   */
  geocode(query: string): Promise<IGeocodingResult[]>;

  /**
   * Reverse geocoding: look up human-readable address from coordinates.
   */
  reverseGeocode(coordinates: ILocationCoordinates): Promise<IGeocodingResult | null>;
}
