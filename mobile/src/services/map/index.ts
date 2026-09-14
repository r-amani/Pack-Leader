import { AppConfig } from '../../config/environment';
import { GoogleMapsService } from './google-maps.service';
import { MapboxService } from './mapbox.service';
import { IMapService } from './map.types';

export * from './map.types';
export * from './mapbox.service';
export * from './google-maps.service';

export type MapProvider = 'google-maps' | 'mapbox';

/**
 * Factory creating an IMapService instance based on the desired provider.
 * Supports transparent switching between Google Maps and Mapbox without impacting UI/business logic.
 */
export function createMapService(provider: MapProvider = 'google-maps'): IMapService {
  if (provider === 'mapbox') {
    return new MapboxService(AppConfig.mapboxAccessToken);
  }
  return new GoogleMapsService(AppConfig.googleMapsApiKey);
}

/**
 * Global singleton map service instance.
 * Configured with Google Maps Platform as the active provider.
 */
export const mapService: IMapService = createMapService('google-maps');
