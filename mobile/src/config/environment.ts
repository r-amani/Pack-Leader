import Constants from 'expo-constants';

/**
 * Application configuration loaded from Expo environment variables.
 *
 * All env vars prefixed with EXPO_PUBLIC_ are available at runtime.
 */
export const AppConfig = {
  apiUrl: Constants.expoConfig?.extra?.apiUrl
    ?? process.env.EXPO_PUBLIC_API_URL
    ?? 'http://localhost:3000/api',

  socketUrl: Constants.expoConfig?.extra?.socketUrl
    ?? process.env.EXPO_PUBLIC_SOCKET_URL
    ?? 'http://localhost:3000',

  googleMapsApiKey: Constants.expoConfig?.extra?.googleMapsApiKey
    ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
    ?? '',

  mapboxAccessToken: Constants.expoConfig?.extra?.mapboxAccessToken
    ?? process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
    ?? '',
} as const;
