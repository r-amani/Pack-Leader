export interface ICoordinatesPair {
  latitude: number;
  longitude: number;
}

export enum RoutePreference {
  FASTEST = 'fastest',
  SCENIC = 'scenic',
  TWISTY = 'twisty',
  CONVOY_SAFE = 'convoy_safe',
}

export interface ISmartPathPreferences {
  preference?: RoutePreference;
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  fuelRangeKm?: number;
  maxDetourMinutes?: number;
}

export interface ISmartPathStop {
  id: string;
  name: string;
  type: 'FUEL' | 'REST' | 'SCENIC_OVERLOOK' | 'FOOD';
  coordinates: ICoordinatesPair;
  distanceFromStartKm: number;
  notes?: string;
}

export interface ISmartPathRecommendation {
  id: string;
  name: string;
  preference: RoutePreference;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  curvatureScore: number; // 1 to 10 scale
  scenicScore: number; // 1 to 10 scale
  elevationGainMeters: number;
  recommendedStops: ISmartPathStop[];
  waypoints: ICoordinatesPair[];
  highlights: string[];
}
