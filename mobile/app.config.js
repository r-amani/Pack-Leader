module.exports = ({ config }) => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    ios: {
      ...config.ios,
      config: {
        googleMapsApiKey: googleMapsApiKey,
      },
    },
    extra: {
      ...config.extra,
      googleMapsApiKey: googleMapsApiKey,
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:3000/api',
      socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.1.5:3000',
    },
  };
};
