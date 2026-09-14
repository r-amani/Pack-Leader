import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TRAVEL_MODE_LABELS, TRAVEL_MODE_ICONS, TravelMode } from '@packleader/shared';
import { Card } from '../../components/common';
import { Colors } from '../../styles/colors';
import { Theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Profile screen — user profile, settings, and session management.
 */
export function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of Pack Leader?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (err) {
              console.error('Logout error:', err);
            }
          },
        },
      ]
    );
  };

  const travelModeLabel = user?.preferredTravelMode
    ? TRAVEL_MODE_LABELS[user.preferredTravelMode]
    : 'Road Trip';

  const travelModeIcon = user?.preferredTravelMode
    ? (TRAVEL_MODE_ICONS[user.preferredTravelMode] as any)
    : 'car-outline';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={Colors.primary[400]} />
        </View>
        <Text style={styles.name}>{user?.name || 'Pack Leader Traveler'}</Text>
        <Text style={styles.email}>{user?.email || 'explorer@packleader.app'}</Text>

        {/* Travel Mode Badge */}
        <View style={styles.badge}>
          <Ionicons name={travelModeIcon} size={14} color={Colors.primary[400]} />
          <Text style={styles.badgeText}>{travelModeLabel}</Text>
        </View>
      </View>

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Card style={styles.settingCard}>
          <SettingRow
            icon="shield-outline"
            label="Emergency Contacts"
            value={`${user?.emergencyContacts?.length || 0} configured`}
          />
          <SettingRow
            icon="compass-outline"
            label="Preferred Travel Style"
            value={travelModeLabel}
          />
          <SettingRow
            icon="calendar-outline"
            label="Member Since"
            value={memberSince}
          />
        </Card>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card style={styles.settingCard}>
          <SettingRow icon="notifications-outline" label="Push Notifications" value="Enabled" />
          <SettingRow icon="moon-outline" label="Theme" value="Dark (Auto)" />
          <SettingRow icon="location-outline" label="Location Sharing" value="Pack Only" />
        </Card>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Card style={styles.settingCard}>
          <SettingRow icon="information-circle-outline" label="Version" value="1.0.0 (Stage 2)" />
          <SettingRow icon="document-text-outline" label="Terms of Service" />
          <SettingRow icon="lock-closed-outline" label="Privacy Policy" />
        </Card>
      </View>

      {/* Sign Out Button */}
      <View style={styles.signOutSection}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.danger.main} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SettingRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
}) {
  return (
    <View style={settingRowStyles.row}>
      <Ionicons name={icon} size={20} color={Colors.dark.textSecondary} />
      <Text style={settingRowStyles.label}>{label}</Text>
      {value ? (
        <Text style={settingRowStyles.value}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={Colors.dark.textMuted} />
      )}
    </View>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.dark.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary[500],
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.md,
  },
  name: {
    ...Theme.typography.h3,
    color: Colors.dark.textPrimary,
  },
  email: {
    ...Theme.typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    marginTop: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  badgeText: {
    ...Theme.typography.caption,
    color: Colors.primary[400],
    marginLeft: 6,
    fontWeight: '600',
  },
  section: {
    marginTop: Theme.spacing.lg,
  },
  sectionTitle: {
    ...Theme.typography.caption,
    color: Colors.dark.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Theme.spacing.sm,
    marginLeft: Theme.spacing.xs,
  },
  settingCard: {
    paddingVertical: Theme.spacing.xs,
  },
  signOutSection: {
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  signOutText: {
    ...Theme.typography.button,
    color: Colors.danger.main,
    marginLeft: Theme.spacing.sm,
  },
});

const settingRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.border,
  },
  label: {
    ...Theme.typography.body,
    color: Colors.dark.textPrimary,
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  value: {
    ...Theme.typography.bodySmall,
    color: Colors.dark.textSecondary,
  },
});
