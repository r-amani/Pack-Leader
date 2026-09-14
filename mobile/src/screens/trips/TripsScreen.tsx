import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  ITrip,
  TravelMode,
  TRAVEL_MODE_LABELS,
  TRAVEL_MODE_ICONS,
  TripStatus,
} from '@packleader/shared';
import { Card, Button, EmptyState } from '../../components/common';
import { Colors } from '../../styles/colors';
import { Theme } from '../../styles/theme';
import { TripsStackParamList } from '../../navigation/types';
import { fetchMyTrips, joinTripByCode } from '../../services/trip.api';

type TripsNavProp = NativeStackNavigationProp<TripsStackParamList, 'TripsList'>;
type TripsRouteProp = RouteProp<TripsStackParamList, 'TripsList'>;

type FilterType = 'ALL' | TripStatus;

export function TripsScreen() {
  const navigation = useNavigation<TripsNavProp>();
  const route = useRoute<TripsRouteProp>();

  const [trips, setTrips] = useState<ITrip[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joining, setJoining] = useState(false);

  // If navigated with openJoin param (e.g. from Home screen), open modal
  useEffect(() => {
    if (route.params?.openJoin) {
      setJoinModalVisible(true);
    }
  }, [route.params?.openJoin]);

  const loadTrips = useCallback(async () => {
    try {
      const data = await fetchMyTrips();
      setTrips(data);
    } catch (err: any) {
      console.warn('Failed to load trips:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTrips();
  };

  const handleJoinTrip = async () => {
    if (!inviteCodeInput.trim()) {
      Alert.alert('Missing Code', 'Please enter a 6-character invite code');
      return;
    }
    setJoining(true);
    try {
      const joinedTrip = await joinTripByCode(inviteCodeInput.trim());
      setJoinModalVisible(false);
      setInviteCodeInput('');
      loadTrips();
      navigation.navigate('TripDetail', { tripId: joinedTrip.id });
    } catch (err: any) {
      Alert.alert('Join Failed', err.message || 'Invalid invite code');
    } finally {
      setJoining(false);
    }
  };

  const filteredTrips = trips.filter((t) => {
    if (filter === 'ALL') return true;
    return t.status === filter;
  });

  return (
    <View style={styles.container}>
      {/* Top Action Bar */}
      <View style={styles.topActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('CreateTrip')}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={20} color={Colors.primary[400]} />
          <Text style={styles.actionButtonText}>Create Trip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.joinButton]}
          onPress={() => setJoinModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="enter-outline" size={20} color={Colors.accent[400]} />
          <Text style={[styles.actionButtonText, { color: Colors.accent[400] }]}>
            Join with Code
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['ALL', TripStatus.ACTIVE, TripStatus.PLANNED, TripStatus.COMPLETED] as FilterType[]).map(
          (tab) => {
            const isSelected = filter === tab;
            const label =
              tab === 'ALL'
                ? 'All'
                : tab === TripStatus.ACTIVE
                ? 'Active'
                : tab === TripStatus.PLANNED
                ? 'Upcoming'
                : 'Finished';

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setFilter(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          }
        )}
      </View>

      {/* Trip List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      ) : filteredTrips.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <EmptyState
            icon="compass-outline"
            title="No Trips Found"
            message={
              filter === 'ALL'
                ? 'Plan your next adventure or join a group with an invite code.'
                : `You do not have any ${filter} trips right now.`
            }
            actionLabel={filter === 'ALL' ? 'Create a Trip' : undefined}
            onAction={() => navigation.navigate('CreateTrip')}
          />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredTrips.map((trip) => {
            const travelIcon = TRAVEL_MODE_ICONS[trip.travelMode] as any;
            const travelLabel = TRAVEL_MODE_LABELS[trip.travelMode] || trip.travelMode;

            const isTripActive = trip.status === TripStatus.ACTIVE;

            return (
              <TouchableOpacity
                key={trip.id}
                onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })}
                activeOpacity={0.8}
              >
                <Card style={[styles.tripCard, isTripActive && styles.tripCardActive]}>
                  {/* Top Bar */}
                  <View style={styles.cardHeader}>
                    <View style={styles.modeTag}>
                      <Ionicons name={travelIcon} size={14} color={Colors.primary[400]} />
                      <Text style={styles.modeTagText}>{travelLabel}</Text>
                    </View>

                    <View
                      style={[
                        styles.statusTag,
                        isTripActive ? styles.statusTagActive : styles.statusTagPlanned,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusTagText,
                          isTripActive
                            ? { color: Colors.success.main }
                            : { color: Colors.warning.main },
                        ]}
                      >
                        {trip.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Trip Title */}
                  <Text style={styles.cardTitle}>{trip.name}</Text>

                  {/* Route Overview */}
                  <View style={styles.routeContainer}>
                    <View style={styles.routeItem}>
                      <Ionicons name="navigate-circle" size={16} color={Colors.primary[400]} />
                      <Text style={styles.routeText} numberOfLines={1}>
                        {trip.origin.name || 'Origin'}
                      </Text>
                    </View>

                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={Colors.dark.textMuted}
                      style={{ marginHorizontal: 8 }}
                    />

                    <View style={styles.routeItem}>
                      <Ionicons name="flag" size={16} color={Colors.accent[500]} />
                      <Text style={styles.routeText} numberOfLines={1}>
                        {trip.destination.name || 'Destination'}
                      </Text>
                    </View>
                  </View>

                  {/* Footer Stats */}
                  <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                      <Ionicons name="people-outline" size={16} color={Colors.dark.textSecondary} />
                      <Text style={styles.footerText}>
                        {trip.members.length} {trip.members.length === 1 ? 'member' : 'members'}
                      </Text>
                    </View>

                    <View style={styles.footerItem}>
                      <Ionicons name="key-outline" size={14} color={Colors.primary[400]} />
                      <Text style={[styles.footerText, { color: Colors.primary[400], fontWeight: '700' }]}>
                        {trip.inviteCode}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Join Trip Modal Dialog */}
      <Modal
        visible={joinModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Join with Invite Code</Text>
            <Text style={styles.modalSubtitle}>
              Enter the 6-character code provided by your Pack Leader.
            </Text>

            <TextInput
              style={styles.codeInput}
              placeholder="e.g. PK9X2A"
              placeholderTextColor={Colors.dark.textMuted}
              value={inviteCodeInput}
              onChangeText={(t) => setInviteCodeInput(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => {
                  setJoinModalVisible(false);
                  setInviteCodeInput('');
                }}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Join Pack"
                onPress={handleJoinTrip}
                loading={joining}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  topActions: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.sm,
    paddingBottom: Theme.spacing.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.surface,
    paddingVertical: 10,
    borderRadius: Theme.borderRadius.md,
    marginRight: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  joinButton: {
    marginRight: 0,
    marginLeft: Theme.spacing.xs,
  },
  actionButtonText: {
    ...Theme.typography.button,
    fontSize: 13,
    color: Colors.primary[400],
    marginLeft: 6,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.dark.surface,
    marginRight: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  filterChipSelected: {
    backgroundColor: Colors.primary[400],
    borderColor: Colors.primary[400],
  },
  filterChipText: {
    ...Theme.typography.caption,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  filterChipTextSelected: {
    color: Colors.dark.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xxl,
  },
  tripCard: {
    marginBottom: Theme.spacing.md,
  },
  tripCardActive: {
    borderColor: Colors.primary[500],
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeTagText: {
    ...Theme.typography.caption,
    color: Colors.primary[400],
    marginLeft: 4,
    fontWeight: '600',
  },
  statusTag: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
  },
  statusTagActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  statusTagPlanned: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
  },
  statusTagText: {
    ...Theme.typography.caption,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  cardTitle: {
    ...Theme.typography.h3,
    color: Colors.dark.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
    marginBottom: Theme.spacing.md,
  },
  routeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    ...Theme.typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.dark.border,
    paddingTop: Theme.spacing.sm,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
    marginLeft: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: Colors.dark.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalTitle: {
    ...Theme.typography.h3,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xs,
  },
  modalSubtitle: {
    ...Theme.typography.bodySmall,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  codeInput: {
    backgroundColor: Colors.dark.background,
    borderColor: Colors.primary[500],
    borderWidth: 2,
    borderRadius: Theme.borderRadius.md,
    color: Colors.dark.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 6,
    paddingVertical: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
  },
});
