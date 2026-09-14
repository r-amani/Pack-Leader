/**
 * Supported travel modes.
 */
export enum TravelMode {
  MOTORCYCLE = 'motorcycle',
  HIKING = 'hiking',
  ROAD_TRIP = 'roadtrip',
  SOLO = 'solo',
  FAMILY = 'family',
}

/**
 * Display labels for each travel mode.
 */
export const TRAVEL_MODE_LABELS: Record<TravelMode, string> = {
  [TravelMode.MOTORCYCLE]: 'Motorcycle Touring',
  [TravelMode.HIKING]: 'Hiking',
  [TravelMode.ROAD_TRIP]: 'Road Trip',
  [TravelMode.SOLO]: 'Solo Travel',
  [TravelMode.FAMILY]: 'Family Trip',
};

/**
 * Icon names for each travel mode (compatible with Ionicons).
 */
export const TRAVEL_MODE_ICONS: Record<TravelMode, string> = {
  [TravelMode.MOTORCYCLE]: 'bicycle-outline',
  [TravelMode.HIKING]: 'walk-outline',
  [TravelMode.ROAD_TRIP]: 'car-outline',
  [TravelMode.SOLO]: 'person-outline',
  [TravelMode.FAMILY]: 'people-outline',
};
