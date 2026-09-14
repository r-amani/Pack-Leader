import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TravelMode, TRAVEL_MODE_LABELS, TRAVEL_MODE_ICONS } from '@packleader/shared';
import { Button, Input, Card } from '../../components/common';
import { Colors } from '../../styles/colors';
import { Theme } from '../../styles/theme';
import { TripsStackParamList } from '../../navigation/types';
import { createTrip } from '../../services/trip.api';

type CreateTripNavProp = NativeStackNavigationProp<TripsStackParamList, 'CreateTrip'>;

const TRAVEL_MODES: TravelMode[] = [
  TravelMode.ROAD_TRIP,
  TravelMode.MOTORCYCLE,
  TravelMode.HIKING,
  TravelMode.SOLO,
  TravelMode.FAMILY,
];

export function CreateTripScreen() {
  const navigation = useNavigation<CreateTripNavProp>();

  const [name, setName] = useState('');
  const [selectedMode, setSelectedMode] = useState<TravelMode>(TravelMode.ROAD_TRIP);
  const [originName, setOriginName] = useState('');
  const [originAddress, setOriginAddress] = useState('');
  const [destName, setDestName] = useState('');
  const [destAddress, setDestAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateTrip = async () => {
    if (!name.trim()) {
      setError('Please provide a name for your trip');
      return;
    }
    if (!originName.trim() && !originAddress.trim()) {
      setError('Please specify a starting location / origin');
      return;
    }
    if (!destName.trim() && !destAddress.trim()) {
      setError('Please specify a destination');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const trip = await createTrip({
        name: name.trim(),
        travelMode: selectedMode,
        origin: {
          name: originName.trim() || 'Starting Point',
          address: originAddress.trim(),
          coordinates: { latitude: 0, longitude: 0 },
        },
        destination: {
          name: destName.trim() || 'Destination',
          address: destAddress.trim(),
          coordinates: { latitude: 0, longitude: 0 },
        },
        scheduledStart: startDate.trim() ? new Date(startDate.trim()).toISOString() : undefined,
        scheduledEnd: endDate.trim() ? new Date(endDate.trim()).toISOString() : undefined,
      });

      // Navigate to newly created trip details
      navigation.replace('TripDetail', { tripId: trip.id });
    } catch (err: any) {
      setError(err.message || 'Failed to create trip. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>Plan a New Adventure</Text>
        <Text style={styles.headerSubtitle}>
          Create your trip, set your itinerary, and invite your pack.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Trip Name */}
        <Input
          label="Trip Name"
          icon="compass-outline"
          placeholder="e.g. Pacific Coast Highway Run"
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (error) setError('');
          }}
        />

        {/* Travel Style Selector */}
        <Text style={styles.sectionLabel}>Travel Style</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeScroll}
        >
          {TRAVEL_MODES.map((mode) => {
            const isSelected = selectedMode === mode;
            const iconName = TRAVEL_MODE_ICONS[mode] as any;
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.modeChip, isSelected && styles.modeChipSelected]}
                onPress={() => setSelectedMode(mode)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={iconName}
                  size={16}
                  color={isSelected ? Colors.dark.background : Colors.dark.textSecondary}
                />
                <Text style={[styles.modeChipText, isSelected && styles.modeChipTextSelected]}>
                  {TRAVEL_MODE_LABELS[mode]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Route Details Card */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Route Overview</Text>

          <Input
            label="Origin (Start Location)"
            icon="navigate-outline"
            placeholder="e.g. San Francisco, CA"
            value={originName}
            onChangeText={(val) => {
              setOriginName(val);
              if (error) setError('');
            }}
          />

          <Input
            label="Origin Address / Landmark (Optional)"
            icon="location-outline"
            placeholder="e.g. 100 Golden Gate Ferry Terminal"
            value={originAddress}
            onChangeText={setOriginAddress}
          />

          <View style={styles.routeDivider}>
            <Ionicons name="arrow-down" size={20} color={Colors.primary[400]} />
          </View>

          <Input
            label="Destination"
            icon="flag-outline"
            placeholder="e.g. Big Sur, CA"
            value={destName}
            onChangeText={(val) => {
              setDestName(val);
              if (error) setError('');
            }}
          />

          <Input
            label="Destination Address / Landmark (Optional)"
            icon="pin-outline"
            placeholder="e.g. Pfeiffer Big Sur State Park"
            value={destAddress}
            onChangeText={setDestAddress}
          />
        </Card>

        {/* Schedule */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Timeline (Optional)</Text>
          <Input
            label="Start Date"
            icon="calendar-outline"
            placeholder="YYYY-MM-DD (e.g. 2026-10-01)"
            value={startDate}
            onChangeText={setStartDate}
          />
          <Input
            label="End Date"
            icon="calendar-outline"
            placeholder="YYYY-MM-DD (e.g. 2026-10-05)"
            value={endDate}
            onChangeText={setEndDate}
          />
        </Card>

        {/* Submit */}
        <Button
          title="Create Trip & Get Invite Code"
          onPress={handleCreateTrip}
          loading={loading}
          fullWidth
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xxl,
  },
  headerTitle: {
    ...Theme.typography.h2,
    color: Colors.dark.textPrimary,
    marginTop: Theme.spacing.xs,
  },
  headerSubtitle: {
    ...Theme.typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginBottom: Theme.spacing.md,
    marginTop: 2,
  },
  sectionLabel: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
    marginBottom: Theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modeScroll: {
    flexDirection: 'row',
    paddingBottom: Theme.spacing.md,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    marginRight: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modeChipSelected: {
    backgroundColor: Colors.primary[400],
    borderColor: Colors.primary[400],
  },
  modeChipText: {
    ...Theme.typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginLeft: 6,
  },
  modeChipTextSelected: {
    color: Colors.dark.background,
    fontWeight: '600',
  },
  card: {
    marginBottom: Theme.spacing.md,
  },
  cardTitle: {
    ...Theme.typography.body,
    fontWeight: '600',
    color: Colors.dark.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  routeDivider: {
    alignItems: 'center',
    marginVertical: Theme.spacing.xs,
  },
  errorText: {
    ...Theme.typography.bodySmall,
    color: Colors.danger.main,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: Theme.spacing.sm,
  },
});
