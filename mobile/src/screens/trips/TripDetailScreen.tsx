import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  ITrip,
  ITripMember,
  TravelMode,
  TRAVEL_MODE_LABELS,
  TRAVEL_MODE_ICONS,
  TripStatus,
  UserRole,
  USER_ROLE_LABELS,
} from '@packleader/shared';
import { Button, Card } from '../../components/common';
import { Colors } from '../../styles/colors';
import { Theme } from '../../styles/theme';
import { TripsStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchTripById,
  updateTripStatus,
  updateMemberRole,
  removeTripMember,
  deleteTrip,
} from '../../services/trip.api';

type TripDetailRouteProp = RouteProp<TripsStackParamList, 'TripDetail'>;

export function TripDetailScreen() {
  const route = useRoute<TripDetailRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { tripId } = route.params;
  const { user } = useAuth();

  const [trip, setTrip] = useState<ITrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTrip = useCallback(async () => {
    setError('');
    try {
      const data = await fetchTripById(tripId);
      setTrip(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load trip details');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const isLeader = trip && user && trip.leader === user.id;

  const handleShareInvite = async () => {
    if (!trip) return;
    try {
      await Share.share({
        message: `Join my trip "${trip.name}" on Pack Leader! Use invite code: ${trip.inviteCode}`,
        title: `Pack Leader Invite: ${trip.name}`,
      });
    } catch {
      // Fallback alert
      Alert.alert('Invite Code', `Share this code with your pack: ${trip.inviteCode}`);
    }
  };

  const handleStatusChange = async (nextStatus: TripStatus) => {
    if (!trip) return;
    setActionLoading(true);
    try {
      const updated = await updateTripStatus(trip.id, nextStatus);
      setTrip(updated);
      Alert.alert(
        'Status Updated',
        nextStatus === TripStatus.ACTIVE
          ? 'The expedition has officially started! Safe travels!'
          : 'The trip has been marked as completed.'
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMemberOptions = (member: ITripMember) => {
    if (!isLeader || member.userId === user?.id) return;

    Alert.alert(
      `Manage ${member.name}`,
      `Current Role: ${USER_ROLE_LABELS[member.role] || member.role}`,
      [
        {
          text: 'Set as Sweeper',
          onPress: async () => {
            try {
              const updated = await updateMemberRole(trip!.id, member.userId, UserRole.SWEEPER);
              setTrip(updated);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
        {
          text: 'Set as Navigator',
          onPress: async () => {
            try {
              const updated = await updateMemberRole(trip!.id, member.userId, UserRole.NAVIGATOR);
              setTrip(updated);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
        {
          text: 'Set as Standard Member',
          onPress: async () => {
            try {
              const updated = await updateMemberRole(trip!.id, member.userId, UserRole.MEMBER);
              setTrip(updated);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
        {
          text: 'Remove from Trip',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await removeTripMember(trip!.id, member.userId);
              setTrip(updated);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleLeaveTrip = () => {
    if (!trip || !user) return;
    Alert.alert(
      'Leave Trip',
      `Are you sure you want to leave "${trip.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeTripMember(trip.id, user.id);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteTrip = () => {
    if (!trip) return;
    Alert.alert(
      'Delete Trip',
      `Are you sure you want to permanently delete "${trip.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTrip(trip.id);
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </View>
    );
  }

  if (error || !trip) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.danger.main} />
        <Text style={styles.errorText}>{error || 'Trip not found'}</Text>
        <Button title="Retry" onPress={loadTrip} style={{ marginTop: Theme.spacing.md }} />
      </View>
    );
  }

  const travelIcon = TRAVEL_MODE_ICONS[trip.travelMode] as any;
  const travelLabel = TRAVEL_MODE_LABELS[trip.travelMode] || trip.travelMode;

  const statusColors = {
    [TripStatus.PLANNED]: { bg: 'rgba(255, 193, 7, 0.15)', text: Colors.warning.main },
    [TripStatus.ACTIVE]: { bg: 'rgba(76, 175, 80, 0.15)', text: Colors.success.main },
    [TripStatus.COMPLETED]: { bg: 'rgba(158, 158, 158, 0.15)', text: Colors.dark.textMuted },
  };

  const currentStatusConfig = statusColors[trip.status] || statusColors[TripStatus.PLANNED];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.travelBadge}>
            <Ionicons name={travelIcon} size={16} color={Colors.primary[400]} />
            <Text style={styles.travelBadgeText}>{travelLabel}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: currentStatusConfig.bg }]}>
            <Text style={[styles.statusBadgeText, { color: currentStatusConfig.text }]}>
              {trip.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.tripTitle}>{trip.name}</Text>
      </View>

      {/* Invite Code Card */}
      <Card style={styles.inviteCard}>
        <View style={styles.inviteRow}>
          <View style={styles.inviteLeft}>
            <Text style={styles.inviteLabel}>PACK INVITE CODE</Text>
            <Text style={styles.inviteCode}>{trip.inviteCode}</Text>
            <Text style={styles.inviteSub}>Share this 6-char code with your crew</Text>
          </View>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareInvite}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={20} color={Colors.dark.background} />
            <Text style={styles.shareText}>Invite</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Leader Primary Action Button */}
      {isLeader && trip.status === TripStatus.PLANNED && (
        <Button
          title="Start Expedition"
          icon="play"
          onPress={() => handleStatusChange(TripStatus.ACTIVE)}
          loading={actionLoading}
          fullWidth
          style={styles.actionButton}
        />
      )}

      {isLeader && trip.status === TripStatus.ACTIVE && (
        <Button
          title="Complete Trip"
          icon="checkmark-done"
          variant="outline"
          onPress={() => handleStatusChange(TripStatus.COMPLETED)}
          loading={actionLoading}
          fullWidth
          style={styles.actionButton}
        />
      )}

      {/* Live Pack Radar & Telemetry Button */}
      {(trip.status === TripStatus.ACTIVE || trip.status === TripStatus.PLANNED) && (
        <Button
          title="Open Live Pack Radar"
          icon="radio-outline"
          variant="secondary"
          onPress={() => {
            navigation.navigate('Map' as any);
          }}
          fullWidth
          style={styles.actionButton}
        />
      )}

      {/* Route Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Route & Destination</Text>
        <Card>
          <View style={styles.pointRow}>
            <View style={[styles.pointDot, { backgroundColor: Colors.primary[400] }]} />
            <View style={styles.pointTextContainer}>
              <Text style={styles.pointLabel}>Origin</Text>
              <Text style={styles.pointName}>{trip.origin.name || 'Starting Point'}</Text>
              {trip.origin.address ? (
                <Text style={styles.pointAddress}>{trip.origin.address}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.routeLine} />

          <View style={styles.pointRow}>
            <View style={[styles.pointDot, { backgroundColor: Colors.accent[500] }]} />
            <View style={styles.pointTextContainer}>
              <Text style={styles.pointLabel}>Destination</Text>
              <Text style={styles.pointName}>{trip.destination.name || 'Destination'}</Text>
              {trip.destination.address ? (
                <Text style={styles.pointAddress}>{trip.destination.address}</Text>
              ) : null}
            </View>
          </View>
        </Card>
      </View>

      {/* Pack Members Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pack Members ({trip.members.length})</Text>
          {isLeader ? (
            <Text style={styles.leaderHint}>Tap member to manage</Text>
          ) : null}
        </View>

        <Card>
          {trip.members.map((member, index) => {
            const isMemberLeader = member.role === UserRole.LEADER;
            const isSweeper = member.role === UserRole.SWEEPER;
            const isNavigator = member.role === UserRole.NAVIGATOR;

            return (
              <TouchableOpacity
                key={member.userId}
                style={[
                  styles.memberRow,
                  index < trip.members.length - 1 && styles.memberRowBorder,
                ]}
                onPress={() => handleMemberOptions(member)}
                disabled={!isLeader || member.userId === user?.id}
                activeOpacity={0.7}
              >
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.name} {member.userId === user?.id ? '(You)' : ''}
                  </Text>
                  <Text style={styles.memberJoined}>
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </Text>
                </View>

                {/* Role Pill */}
                <View
                  style={[
                    styles.rolePill,
                    isMemberLeader && styles.rolePillLeader,
                    isSweeper && styles.rolePillSweeper,
                    isNavigator && styles.rolePillNavigator,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleText,
                      isMemberLeader && styles.roleTextLeader,
                      isSweeper && styles.roleTextSweeper,
                      isNavigator && styles.roleTextNavigator,
                    ]}
                  >
                    {USER_ROLE_LABELS[member.role] || member.role}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </Card>
      </View>

      {/* Leave Trip Button (Members only) */}
      {!isLeader && (
        <View style={styles.leaveSection}>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveTrip}
            activeOpacity={0.7}
          >
            <Ionicons name="exit-outline" size={18} color={Colors.danger.main} />
            <Text style={styles.leaveText}>Leave This Trip</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Delete Trip Button (Leader only) */}
      {isLeader && (
        <View style={styles.leaveSection}>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleDeleteTrip}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.danger.main} />
            <Text style={styles.leaveText}>Delete This Trip</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    padding: Theme.spacing.xl,
  },
  loadingText: {
    ...Theme.typography.body,
    color: Colors.dark.textSecondary,
    marginTop: Theme.spacing.md,
  },
  errorText: {
    ...Theme.typography.body,
    color: Colors.danger.main,
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
  },
  header: {
    marginBottom: Theme.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  travelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  travelBadgeText: {
    ...Theme.typography.caption,
    color: Colors.primary[400],
    marginLeft: 6,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
  },
  statusBadgeText: {
    ...Theme.typography.caption,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  tripTitle: {
    ...Theme.typography.h2,
    color: Colors.dark.textPrimary,
  },
  inviteCard: {
    backgroundColor: 'rgba(0, 172, 193, 0.1)',
    borderColor: Colors.primary[500],
    borderWidth: 1,
    marginBottom: Theme.spacing.md,
  },
  inviteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteLeft: {
    flex: 1,
  },
  inviteLabel: {
    ...Theme.typography.caption,
    color: Colors.primary[400],
    fontWeight: '700',
    letterSpacing: 1,
  },
  inviteCode: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.dark.textPrimary,
    letterSpacing: 4,
    marginVertical: 2,
  },
  inviteSub: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[400],
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
  },
  shareText: {
    ...Theme.typography.button,
    fontSize: 14,
    color: Colors.dark.background,
    marginLeft: 4,
  },
  actionButton: {
    marginBottom: Theme.spacing.md,
  },
  section: {
    marginTop: Theme.spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  sectionTitle: {
    ...Theme.typography.caption,
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: Theme.spacing.xs,
  },
  leaderHint: {
    ...Theme.typography.caption,
    color: Colors.primary[400],
    fontStyle: 'italic',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pointDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
    marginRight: Theme.spacing.md,
  },
  pointTextContainer: {
    flex: 1,
  },
  pointLabel: {
    ...Theme.typography.caption,
    color: Colors.dark.textMuted,
  },
  pointName: {
    ...Theme.typography.body,
    fontWeight: '600',
    color: Colors.dark.textPrimary,
  },
  pointAddress: {
    ...Theme.typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.dark.border,
    marginLeft: 5,
    marginVertical: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  memberRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.border,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  memberAvatarText: {
    ...Theme.typography.caption,
    fontWeight: '700',
    color: Colors.primary[400],
  },
  memberInfo: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  memberName: {
    ...Theme.typography.body,
    fontWeight: '600',
    color: Colors.dark.textPrimary,
  },
  memberJoined: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
  },
  rolePill: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.dark.surface,
  },
  rolePillLeader: {
    backgroundColor: 'rgba(0, 172, 193, 0.15)',
  },
  rolePillSweeper: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
  },
  rolePillNavigator: {
    backgroundColor: 'rgba(156, 39, 176, 0.15)',
  },
  roleText: {
    ...Theme.typography.caption,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  roleTextLeader: {
    color: Colors.primary[400],
  },
  roleTextSweeper: {
    color: Colors.warning.main,
  },
  roleTextNavigator: {
    color: '#BA68C8',
  },
  leaveSection: {
    marginTop: Theme.spacing.xl,
    alignItems: 'center',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.sm,
  },
  leaveText: {
    ...Theme.typography.bodySmall,
    color: Colors.danger.main,
    marginLeft: 6,
  },
});
