import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  ITrip,
  TravelMode,
  TripStatus,
  TRAVEL_MODE_LABELS,
  TRAVEL_MODE_ICONS,
} from '@packleader/shared';
import { Card, Button } from '../../components/common';
import { Colors } from '../../styles/colors';
import { Theme } from '../../styles/theme';
import { fetchMyTrips } from '../../services/trip.api';

interface FeatureCardData {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const FEATURES: FeatureCardData[] = [
  {
    icon: 'compass',
    title: 'Plan Your Trip',
    description: 'Create trips, invite your crew, and plan routes together.',
    color: Colors.primary[500],
  },
  {
    icon: 'location',
    title: 'Live Tracking',
    description: 'See your group in real-time on the map as you travel.',
    color: Colors.accent[500],
  },
  {
    icon: 'shield-checkmark',
    title: 'Stay Safe',
    description: 'SOS alerts, check-ins, and emergency contact notifications.',
    color: Colors.success.main,
  },
  {
    icon: 'wallet',
    title: 'Split Expenses',
    description: 'Track costs and settle up with your travel group easily.',
    color: Colors.warning.main,
  },
];

/**
 * Home screen — app overview, active trip banner, and quick actions.
 */
export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [activeTrip, setActiveTrip] = useState<ITrip | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      fetchMyTrips()
        .then((trips) => {
          if (isMounted) {
            const currentActive = trips.find((t) => t.status === TripStatus.ACTIVE);
            setActiveTrip(currentActive || null);
          }
        })
        .catch(() => {});

      return () => {
        isMounted = false;
      };
    }, [])
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>🐾</Text>
        <Text style={styles.heroTitle}>Welcome to Pack Leader</Text>
        <Text style={styles.heroSubtitle}>
          Your all-in-one travel companion for group adventures.
        </Text>
      </View>

      {/* Active Trip Live Banner (if ongoing expedition exists) */}
      {activeTrip && (
        <View style={styles.section}>
          <View style={styles.activeHeader}>
            <View style={styles.pulsingDot} />
            <Text style={styles.activeHeaderText}>CURRENT EXPEDITION IN PROGRESS</Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Trips', {
                screen: 'TripDetail',
                params: { tripId: activeTrip.id },
              })
            }
            activeOpacity={0.8}
          >
            <Card style={styles.activeCard}>
              <View style={styles.activeCardTop}>
                <View style={styles.activeModeTag}>
                  <Ionicons
                    name={(TRAVEL_MODE_ICONS[activeTrip.travelMode] || 'car-outline') as any}
                    size={16}
                    color={Colors.primary[400]}
                  />
                  <Text style={styles.activeModeText}>
                    {TRAVEL_MODE_LABELS[activeTrip.travelMode]}
                  </Text>
                </View>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              </View>

              <Text style={styles.activeTripName}>{activeTrip.name}</Text>

              <View style={styles.activeRoute}>
                <Ionicons name="flag" size={14} color={Colors.accent[500]} />
                <Text style={styles.activeRouteText} numberOfLines={1}>
                  Heading to: {activeTrip.destination.name || 'Destination'}
                </Text>
              </View>

              <View style={styles.activeCardFooter}>
                <View style={styles.memberCount}>
                  <Ionicons name="people-outline" size={14} color={Colors.dark.textSecondary} />
                  <Text style={styles.memberCountText}>
                    {activeTrip.members.length} {activeTrip.members.length === 1 ? 'member' : 'members'}
                  </Text>
                </View>
                <Text style={styles.viewTripAction}>View Details →</Text>
              </View>
            </Card>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Get Started</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Trips', { screen: 'CreateTrip' })}
          activeOpacity={0.7}
        >
          <Card style={styles.quickAction}>
            <View style={styles.quickActionRow}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.primary[800] }]}>
                <Ionicons name="add" size={24} color={Colors.primary[400]} />
              </View>
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>Create a Trip</Text>
                <Text style={styles.quickActionDesc}>Start planning your next adventure</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.dark.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Trips', {
              screen: 'TripsList',
              params: { openJoin: true },
            })
          }
          activeOpacity={0.7}
        >
          <Card style={styles.quickAction}>
            <View style={styles.quickActionRow}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.accent[900] }]}>
                <Ionicons name="enter-outline" size={24} color={Colors.accent[400]} />
              </View>
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>Join a Trip</Text>
                <Text style={styles.quickActionDesc}>Enter an invite code to join your group</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.dark.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Feature Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        {FEATURES.map((feature) => (
          <Card key={feature.title} style={styles.featureCard}>
            <View style={styles.featureRow}>
              <View style={[styles.iconCircle, { backgroundColor: `${feature.color}22` }]}>
                <Ionicons name={feature.icon} size={24} color={feature.color} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>
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
  hero: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.lg,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: Theme.spacing.sm,
  },
  heroTitle: {
    ...Theme.typography.h2,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xs,
  },
  heroSubtitle: {
    ...Theme.typography.body,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  section: {
    marginTop: Theme.spacing.lg,
  },
  sectionTitle: {
    ...Theme.typography.h3,
    color: Colors.dark.textPrimary,
    marginBottom: Theme.spacing.md,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
    marginLeft: Theme.spacing.xs,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success.main,
    marginRight: 6,
  },
  activeHeaderText: {
    ...Theme.typography.caption,
    fontWeight: '700',
    color: Colors.success.main,
    letterSpacing: 1,
  },
  activeCard: {
    borderColor: Colors.success.main,
    borderWidth: 1.5,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  activeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  activeModeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeModeText: {
    ...Theme.typography.caption,
    color: Colors.primary[400],
    marginLeft: 4,
    fontWeight: '600',
  },
  liveBadge: {
    backgroundColor: Colors.success.main,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Theme.borderRadius.full,
  },
  liveBadgeText: {
    ...Theme.typography.caption,
    color: Colors.dark.background,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  activeTripName: {
    ...Theme.typography.h3,
    color: Colors.dark.textPrimary,
    marginBottom: Theme.spacing.xs,
  },
  activeRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  activeRouteText: {
    ...Theme.typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginLeft: 6,
  },
  activeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.dark.border,
    paddingTop: Theme.spacing.sm,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCountText: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
    marginLeft: 4,
  },
  viewTripAction: {
    ...Theme.typography.caption,
    color: Colors.primary[400],
    fontWeight: '700',
  },
  quickAction: {
    marginBottom: Theme.spacing.sm,
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionText: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  quickActionTitle: {
    ...Theme.typography.body,
    color: Colors.dark.textPrimary,
    fontWeight: '600',
  },
  quickActionDesc: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCard: {
    marginBottom: Theme.spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  featureTitle: {
    ...Theme.typography.body,
    color: Colors.dark.textPrimary,
    fontWeight: '600',
  },
  featureDesc: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
});
