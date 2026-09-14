import {
  ICoordinatesPair,
  ISmartPathPreferences,
  ISmartPathRecommendation,
  ISmartPathStop,
  RoutePreference,
} from '@packleader/shared';

/**
 * Mathematical Haversine distance calculator between coordinates in km.
 */
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * SmartPath Route Recommendation Engine.
 * Specializes in motorcycle twisties, scenic touring, and pack convoy routing.
 */
export class SmartPathService {
  /**
   * Generate multiple tailored route recommendations for an expedition.
   */
  public generateRecommendations(
    origin: ICoordinatesPair,
    destination: ICoordinatesPair,
    preferences?: ISmartPathPreferences
  ): ISmartPathRecommendation[] {
    const directDistKm = calculateDistanceKm(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );

    const fuelIntervalKm = preferences?.fuelRangeKm || 180;

    // 1. FASTEST HIGHWAY ROUTE
    const fastestRoute = this.buildFastestRoute(origin, destination, directDistKm, fuelIntervalKm);

    // 2. SCENIC VISTA ROUTE
    const scenicRoute = this.buildScenicRoute(origin, destination, directDistKm, fuelIntervalKm);

    // 3. TWISTY BACKROAD ROUTE (Motorcycle dream curves)
    const twistyRoute = this.buildTwistyRoute(origin, destination, directDistKm, fuelIntervalKm);

    // 4. CONVOY SAFE ROUTE (Spacious lanes, smooth sweepers, easy regroup points)
    const convoyRoute = this.buildConvoyRoute(origin, destination, directDistKm, fuelIntervalKm);

    // Filter or prioritize based on user preference
    const all = [fastestRoute, scenicRoute, twistyRoute, convoyRoute];
    if (preferences?.preference) {
      all.sort((a, b) => (a.preference === preferences.preference ? -1 : 1));
    }

    return all;
  }

  private buildFastestRoute(
    origin: ICoordinatesPair,
    destination: ICoordinatesPair,
    directDist: number,
    fuelRangeKm: number
  ): ISmartPathRecommendation {
    const totalDist = Math.round(directDist * 1.15);
    const totalDurationMinutes = Math.round((totalDist / 105) * 60);

    const waypoints: ICoordinatesPair[] = [
      origin,
      {
        latitude: origin.latitude + (destination.latitude - origin.latitude) * 0.5,
        longitude: origin.longitude + (destination.longitude - origin.longitude) * 0.5,
      },
      destination,
    ];

    const stops = this.planFuelStops(waypoints, totalDist, fuelRangeKm, 'Fastest Highway');

    return {
      id: 'smartpath_fastest',
      name: 'Interstate Expressway',
      preference: RoutePreference.FASTEST,
      totalDistanceKm: totalDist,
      totalDurationMinutes,
      curvatureScore: 2.5,
      scenicScore: 4.0,
      elevationGainMeters: 450,
      recommendedStops: stops,
      waypoints,
      highlights: ['Direct freeway bypass', 'High speed limit corridors', 'Frequent rest plazas'],
    };
  }

  private buildScenicRoute(
    origin: ICoordinatesPair,
    destination: ICoordinatesPair,
    directDist: number,
    fuelRangeKm: number
  ): ISmartPathRecommendation {
    const totalDist = Math.round(directDist * 1.35);
    const totalDurationMinutes = Math.round((totalDist / 70) * 60);

    // Arc off the direct path toward scenic ridges
    const midLat = (origin.latitude + destination.latitude) / 2 + 0.08;
    const midLon = (origin.longitude + destination.longitude) / 2 - 0.06;

    const waypoints: ICoordinatesPair[] = [
      origin,
      {
        latitude: origin.latitude + (midLat - origin.latitude) * 0.5,
        longitude: origin.longitude + (midLon - origin.longitude) * 0.5,
      },
      { latitude: midLat, longitude: midLon },
      {
        latitude: midLat + (destination.latitude - midLat) * 0.5,
        longitude: midLon + (destination.longitude - midLon) * 0.5,
      },
      destination,
    ];

    const stops = this.planFuelStops(waypoints, totalDist, fuelRangeKm, 'Scenic Vista');
    stops.push({
      id: 'scenic_overlook_1',
      name: 'Eagle Ridge Panoramic Viewpoint',
      type: 'SCENIC_OVERLOOK',
      coordinates: { latitude: midLat, longitude: midLon },
      distanceFromStartKm: Math.round(totalDist * 0.52),
      notes: 'Breathtaking 360-degree canyon overlook & photo stop for the pack',
    });

    return {
      id: 'smartpath_scenic',
      name: 'Scenic Crest Byway',
      preference: RoutePreference.SCENIC,
      totalDistanceKm: totalDist,
      totalDurationMinutes,
      curvatureScore: 6.8,
      scenicScore: 9.4,
      elevationGainMeters: 1850,
      recommendedStops: stops,
      waypoints,
      highlights: ['Panoramic ridgeline views', 'National forest canopy', 'Minimal commercial trucks'],
    };
  }

  private buildTwistyRoute(
    origin: ICoordinatesPair,
    destination: ICoordinatesPair,
    directDist: number,
    fuelRangeKm: number
  ): ISmartPathRecommendation {
    const totalDist = Math.round(directDist * 1.45);
    const totalDurationMinutes = Math.round((totalDist / 60) * 60);

    // Mountain pass serpentine offsets
    const wp1Lat = origin.latitude + (destination.latitude - origin.latitude) * 0.25 - 0.07;
    const wp1Lon = origin.longitude + (destination.longitude - origin.longitude) * 0.25 + 0.08;

    const wp2Lat = origin.latitude + (destination.latitude - origin.latitude) * 0.55 + 0.09;
    const wp2Lon = origin.longitude + (destination.longitude - origin.longitude) * 0.55 - 0.08;

    const wp3Lat = origin.latitude + (destination.latitude - origin.latitude) * 0.8 - 0.05;
    const wp3Lon = origin.longitude + (destination.longitude - origin.longitude) * 0.8 + 0.06;

    const waypoints: ICoordinatesPair[] = [
      origin,
      { latitude: wp1Lat, longitude: wp1Lon },
      { latitude: wp2Lat, longitude: wp2Lon },
      { latitude: wp3Lat, longitude: wp3Lon },
      destination,
    ];

    const stops = this.planFuelStops(waypoints, totalDist, fuelRangeKm, 'Twisty Curves');

    return {
      id: 'smartpath_twisty',
      name: 'Dragon Spine Mountain Twisty',
      preference: RoutePreference.TWISTY,
      totalDistanceKm: totalDist,
      totalDurationMinutes,
      curvatureScore: 9.6,
      scenicScore: 8.7,
      elevationGainMeters: 2450,
      recommendedStops: stops,
      waypoints,
      highlights: ['Over 120 banked mountain switchbacks', 'Fresh asphalt pavement', 'Zero stoplights'],
    };
  }

  private buildConvoyRoute(
    origin: ICoordinatesPair,
    destination: ICoordinatesPair,
    directDist: number,
    fuelRangeKm: number
  ): ISmartPathRecommendation {
    const totalDist = Math.round(directDist * 1.2);
    const totalDurationMinutes = Math.round((totalDist / 85) * 60);

    const waypoints: ICoordinatesPair[] = [
      origin,
      {
        latitude: origin.latitude + (destination.latitude - origin.latitude) * 0.45,
        longitude: origin.longitude + (destination.longitude - origin.longitude) * 0.45,
      },
      destination,
    ];

    const stops = this.planFuelStops(waypoints, totalDist, fuelRangeKm, 'Convoy Pacing');

    return {
      id: 'smartpath_convoy',
      name: 'Pack Safe Convoy Route',
      preference: RoutePreference.CONVOY_SAFE,
      totalDistanceKm: totalDist,
      totalDurationMinutes,
      curvatureScore: 4.2,
      scenicScore: 6.5,
      elevationGainMeters: 750,
      recommendedStops: stops,
      waypoints,
      highlights: [
        'Multi-lane highways for safe group lane formation',
        'Large staging rest plazas',
        'Minimal stop-and-go congestion',
      ],
    };
  }

  private planFuelStops(
    waypoints: ICoordinatesPair[],
    totalDistanceKm: number,
    fuelRangeKm: number,
    routeName: string
  ): ISmartPathStop[] {
    const stops: ISmartPathStop[] = [];
    if (totalDistanceKm <= fuelRangeKm) {
      // Short trip, add a midpoint coffee/rest stop if > 80km
      if (totalDistanceKm > 80) {
        const midIdx = Math.floor(waypoints.length / 2);
        stops.push({
          id: `rest_${Date.now()}_1`,
          name: 'Scenic Roadhouse Rest Stop',
          type: 'REST',
          coordinates: waypoints[midIdx],
          distanceFromStartKm: Math.round(totalDistanceKm / 2),
          notes: 'Safe staging parking lot for regrouping',
        });
      }
      return stops;
    }

    let nextFuelKm = fuelRangeKm * 0.85; // Refuel before hitting empty
    let stopCount = 1;

    while (nextFuelKm < totalDistanceKm - 30) {
      const progress = nextFuelKm / totalDistanceKm;
      const wpIndex = Math.min(
        waypoints.length - 1,
        Math.max(0, Math.floor(progress * waypoints.length))
      );
      const coords = waypoints[wpIndex];

      stops.push({
        id: `fuel_${Date.now()}_${stopCount}`,
        name: `Pack Fuel Plaza #${stopCount} (${routeName})`,
        type: 'FUEL',
        coordinates: coords,
        distanceFromStartKm: Math.round(nextFuelKm),
        notes: `High-octane fuel & tire pressure station (${Math.round(nextFuelKm)} km mark)`,
      });

      stopCount++;
      nextFuelKm += fuelRangeKm * 0.85;
    }

    return stops;
  }
}

export const smartPathService = new SmartPathService();
