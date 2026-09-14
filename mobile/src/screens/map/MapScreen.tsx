import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { TravelMode } from '@packleader/shared';
import { Card, Button } from '../../components/common';
import { Colors } from '../../styles/colors';
import { Theme } from '../../styles/theme';
import { useMap } from '../../hooks/useMap';

/**
 * Thin Map Screen component.
 * Delegates all mapping, geocoding, and routing logic to the useMap hook.
 * Renders native Google Maps (react-native-maps) with polyline, markers, and controls.
 */
export function MapScreen() {
  const {
    userLocation,
    userAddress,
    permissionGranted,
    destinationCoordinates,
    destinationName,
    route,
    searchResults,
    isSearching,
    isRouting,
    isConfigured,
    activeTrip,
    errorMessage,
    activeTravelMode,
    setActiveTravelMode,
    searchPlaces,
    clearSearchResults,
    selectDestination,
    calculateRoute,
    clearRoute,
    refreshUserLocation,
    loadTripDestination,
    calculateRegion,
  } = useMap();

  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<MapView | null>(null);

  // Animate camera when region changes (e.g. when route or destination updates)
  useEffect(() => {
    const region = calculateRegion();
    if (region && mapRef.current) {
      mapRef.current.animateToRegion(region, 800);
    }
  }, [calculateRegion]);

  const handleSelectPlace = (place: any) => {
    setSearchQuery(place.name);
    selectDestination(place.coordinates, place.name);
    calculateRoute(place.coordinates, activeTravelMode);
  };

  const handleZoom = (zoomIn: boolean) => {
    if (!userLocation || !mapRef.current) return;
    const factor = zoomIn ? 0.5 : 2.0;
    const current = calculateRegion();
    if (current) {
      mapRef.current.animateToRegion(
        {
          ...current,
          latitudeDelta: current.latitudeDelta * factor,
          longitudeDelta: current.longitudeDelta * factor,
        },
        300
      );
    }
  };

  const handleRecenter = () => {
    refreshUserLocation();
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        600
      );
    }
  };

  const initialRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };

  return (
    <View style={styles.container}>
      {/* Search Header Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color={Colors.dark.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destination (Google Places/Geocoding)..."
            placeholderTextColor={Colors.dark.textMuted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchPlaces(text);
            }}
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                clearSearchResults();
              }}
            >
              <Ionicons name="close-circle" size={18} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {isSearching && (
          <ActivityIndicator
            size="small"
            color={Colors.primary[400]}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>

      {/* Autocomplete Suggestions Dropdown */}
      {searchResults.length > 0 && (
        <View style={styles.dropdown}>
          {searchResults.map((result, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.dropdownItem}
              onPress={() => handleSelectPlace(result)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="location-sharp"
                size={16}
                color={Colors.primary[400]}
                style={{ marginRight: 8, marginTop: 2 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.dropdownName}>{result.name}</Text>
                <Text style={styles.dropdownAddress} numberOfLines={1}>
                  {result.address}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Map Container */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsCompass
          showsScale
        >
          {/* User Location Marker */}
          {userLocation && (
            <Marker
              coordinate={userLocation}
              title="Your Location"
              description={userAddress || 'GPS Fix'}
            >
              <View style={styles.userMarkerContainer}>
                <View style={styles.userMarkerPulse} />
                <View style={styles.userMarkerDot} />
              </View>
            </Marker>
          )}

          {/* Destination Marker */}
          {destinationCoordinates && (
            <Marker
              coordinate={destinationCoordinates}
              title={destinationName || 'Destination'}
              pinColor={Colors.accent[500]}
            >
              <View style={styles.destMarkerContainer}>
                <Ionicons name="flag" size={24} color={Colors.accent[500]} />
              </View>
            </Marker>
          )}

          {/* Route Polyline Overlay */}
          {route && route.coordinates && route.coordinates.length > 0 && (
            <Polyline
              coordinates={route.coordinates}
              strokeColor={Colors.primary[500]}
              strokeWidth={4}
            />
          )}
        </MapView>

        {/* Google Maps Provider Badge */}
        <View style={styles.providerBadge}>
          <Ionicons name="logo-google" size={12} color="#4285F4" />
          <Text style={styles.providerText}>Google Maps Platform</Text>
        </View>

        {/* Floating Map Action Controls */}
        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => handleZoom(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={Colors.dark.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => handleZoom(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="remove" size={20} color={Colors.dark.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mapButton, styles.recenterMapButton]}
            onPress={handleRecenter}
            activeOpacity={0.8}
          >
            <Ionicons name="locate" size={20} color={Colors.primary[400]} />
          </TouchableOpacity>
        </View>

        {/* Routing Activity Spinner */}
        {isRouting && (
          <View style={styles.routingOverlay}>
            <ActivityIndicator size="small" color={Colors.primary[500]} />
            <Text style={styles.routingOverlayText}>Computing Google Routes...</Text>
          </View>
        )}
      </View>

      {/* Bottom Info Panels */}
      <ScrollView
        style={styles.bottomSheet}
        contentContainerStyle={styles.bottomContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Token Configuration Alert Banner if key is missing */}
        {!isConfigured && (
          <Card style={styles.configBanner}>
            <View style={styles.configRow}>
              <Ionicons name="information-circle" size={24} color={Colors.warning.main} />
              <View style={styles.configTextContainer}>
                <Text style={styles.configTitle}>Google Maps API Key Not Detected</Text>
                <Text style={styles.configDesc}>
                  Set <Text style={styles.codeText}>EXPO_PUBLIC_GOOGLE_MAPS_API_KEY</Text> in
                  your mobile environment to enable live Google Routes, Places, and Geocoding.
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Error Notification */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger.main} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Active Trip Destination Quick Load Banner */}
        {activeTrip && activeTrip.destination && (
          <Card style={styles.activeTripCard}>
            <View style={styles.activeTripHeader}>
              <Ionicons name="compass" size={20} color={Colors.accent[500]} />
              <Text style={styles.activeTripTitle}>Current Expedition</Text>
            </View>
            <Text style={styles.activeTripName}>{activeTrip.name}</Text>
            <Text style={styles.activeTripDestination}>
              Destination: {activeTrip.destination.name || activeTrip.destination.address}
            </Text>
            <Button
              title="Route to Expedition Destination"
              variant="secondary"
              onPress={() => loadTripDestination(activeTrip)}
              style={{ marginTop: Theme.spacing.sm }}
            />
          </Card>
        )}

        {/* Travel Mode Selector */}
        <View style={styles.travelModeRow}>
          <TouchableOpacity
            style={[
              styles.modeChip,
              activeTravelMode === TravelMode.MOTORCYCLE && styles.modeChipActive,
            ]}
            onPress={() => {
              setActiveTravelMode(TravelMode.MOTORCYCLE);
              if (destinationCoordinates) calculateRoute(destinationCoordinates, TravelMode.MOTORCYCLE);
            }}
          >
            <Ionicons
              name="bicycle"
              size={16}
              color={activeTravelMode === TravelMode.MOTORCYCLE ? Colors.white : Colors.dark.textSecondary}
            />
            <Text
              style={[
                styles.modeChipText,
                activeTravelMode === TravelMode.MOTORCYCLE && styles.modeChipTextActive,
              ]}
            >
              Motorcycle
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeChip,
              activeTravelMode === TravelMode.ROAD_TRIP && styles.modeChipActive,
            ]}
            onPress={() => {
              setActiveTravelMode(TravelMode.ROAD_TRIP);
              if (destinationCoordinates) calculateRoute(destinationCoordinates, TravelMode.ROAD_TRIP);
            }}
          >
            <Ionicons
              name="car"
              size={16}
              color={activeTravelMode === TravelMode.ROAD_TRIP ? Colors.white : Colors.dark.textSecondary}
            />
            <Text
              style={[
                styles.modeChipText,
                activeTravelMode === TravelMode.ROAD_TRIP && styles.modeChipTextActive,
              ]}
            >
              Drive
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeChip,
              activeTravelMode === TravelMode.HIKING && styles.modeChipActive,
            ]}
            onPress={() => {
              setActiveTravelMode(TravelMode.HIKING);
              if (destinationCoordinates) calculateRoute(destinationCoordinates, TravelMode.HIKING);
            }}
          >
            <Ionicons
              name="walk"
              size={16}
              color={activeTravelMode === TravelMode.HIKING ? Colors.white : Colors.dark.textSecondary}
            />
            <Text
              style={[
                styles.modeChipText,
                activeTravelMode === TravelMode.HIKING && styles.modeChipTextActive,
              ]}
            >
              Hiking
            </Text>
          </TouchableOpacity>
        </View>

        {/* Route Details Card (Distance, ETA & Steps) */}
        {route && (
          <Card style={styles.routeCard}>
            <View style={styles.routeMetricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>DISTANCE</Text>
                <Text style={styles.metricValue}>{route.distanceFormatted}</Text>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>ESTIMATED TIME</Text>
                <Text style={styles.metricValue}>{route.durationFormatted}</Text>
              </View>
            </View>

            {route.isMock && (
              <View style={styles.mockTag}>
                <Text style={styles.mockTagText}>MOCK TEST DATA (Google Maps Key Inactive)</Text>
              </View>
            )}

            {/* Turn-by-turn Step Directions */}
            {route.steps && route.steps.length > 0 && (
              <View style={styles.stepsSection}>
                <Text style={styles.stepsTitle}>Navigation Maneuvers</Text>
                {route.steps.slice(0, 5).map((step, idx) => (
                  <View key={idx} style={styles.stepItem}>
                    <Ionicons
                      name="arrow-forward-circle-outline"
                      size={16}
                      color={Colors.primary[400]}
                      style={{ marginTop: 2 }}
                    />
                    <Text style={styles.stepText}>{step.instruction}</Text>
                  </View>
                ))}
              </View>
            )}

            <Button
              title="Clear Route"
              variant="outline"
              onPress={clearRoute}
              style={{ marginTop: Theme.spacing.md }}
            />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    zIndex: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.sm,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.textPrimary,
    marginLeft: 8,
    fontSize: 14,
  },
  dropdown: {
    position: 'absolute',
    top: 56,
    left: Theme.spacing.md,
    right: Theme.spacing.md,
    backgroundColor: Colors.dark.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    zIndex: 999,
    ...Theme.shadows.lg,
  },
  dropdownItem: {
    flexDirection: 'row',
    padding: Theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.border,
  },
  dropdownName: {
    ...Theme.typography.body,
    fontWeight: '600',
    color: Colors.dark.textPrimary,
  },
  dropdownAddress: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  mapContainer: {
    height: 280,
    position: 'relative',
    backgroundColor: '#1E1E1E',
  },
  providerBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  providerText: {
    ...Theme.typography.caption,
    fontSize: 10,
    color: Colors.white,
    marginLeft: 6,
    fontWeight: '600',
  },
  floatingControls: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    alignItems: 'center',
  },
  mapButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    ...Theme.shadows.md,
  },
  recenterMapButton: {
    marginTop: 4,
    borderColor: Colors.primary[500],
  },
  userMarkerContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerPulse: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 229, 255, 0.25)',
  },
  userMarkerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary[500],
    borderWidth: 2,
    borderColor: Colors.white,
  },
  destMarkerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  routingOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.sm,
  },
  routingOverlayText: {
    ...Theme.typography.caption,
    color: Colors.primary[400],
    marginLeft: 8,
    fontWeight: '600',
  },
  bottomSheet: {
    flex: 1,
  },
  bottomContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xxl,
  },
  configBanner: {
    backgroundColor: 'rgba(255, 193, 7, 0.08)',
    borderColor: 'rgba(255, 193, 7, 0.3)',
    borderWidth: 1,
    marginBottom: Theme.spacing.md,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  configTextContainer: {
    flex: 1,
    marginLeft: Theme.spacing.sm,
  },
  configTitle: {
    ...Theme.typography.bodySmall,
    fontWeight: '700',
    color: Colors.warning.main,
  },
  configDesc: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  codeText: {
    fontFamily: 'monospace',
    color: Colors.primary[400],
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    marginBottom: Theme.spacing.md,
  },
  errorText: {
    ...Theme.typography.bodySmall,
    color: Colors.danger.main,
    marginLeft: 8,
    flex: 1,
  },
  activeTripCard: {
    marginBottom: Theme.spacing.md,
    borderColor: Colors.accent[500],
    borderWidth: 1,
  },
  activeTripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeTripTitle: {
    ...Theme.typography.caption,
    color: Colors.accent[500],
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  activeTripName: {
    ...Theme.typography.h3,
    color: Colors.dark.textPrimary,
  },
  activeTripDestination: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  travelModeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modeChipActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[500],
  },
  modeChipText: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
    marginLeft: 6,
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: Colors.white,
  },
  routeCard: {
    marginBottom: Theme.spacing.md,
  },
  routeMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Theme.spacing.sm,
  },
  metricBox: {
    alignItems: 'center',
  },
  metricLabel: {
    ...Theme.typography.caption,
    color: Colors.dark.textMuted,
    letterSpacing: 1,
    fontWeight: '700',
  },
  metricValue: {
    ...Theme.typography.h2,
    color: Colors.primary[400],
    marginTop: 4,
  },
  metricDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.dark.border,
  },
  mockTag: {
    backgroundColor: 'rgba(255, 193, 7, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Theme.borderRadius.sm,
    alignSelf: 'center',
    marginTop: 4,
  },
  mockTagText: {
    ...Theme.typography.caption,
    color: Colors.warning.main,
    fontWeight: '700',
    fontSize: 10,
  },
  stepsSection: {
    marginTop: Theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.dark.border,
    paddingTop: Theme.spacing.sm,
  },
  stepsTitle: {
    ...Theme.typography.caption,
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Theme.spacing.xs,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  stepText: {
    ...Theme.typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
});
