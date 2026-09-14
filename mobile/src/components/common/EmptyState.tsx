import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/colors';
import { Theme } from '../../styles/theme';

import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Empty state placeholder with icon, title, and optional message and action.
 */
export function EmptyState({
  icon = 'folder-open-outline',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={Colors.dark.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          style={{ marginTop: Theme.spacing.lg }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  title: {
    ...Theme.typography.h3,
    color: Colors.dark.textPrimary,
    marginTop: Theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    ...Theme.typography.body,
    color: Colors.dark.textSecondary,
    marginTop: Theme.spacing.sm,
    textAlign: 'center',
  },
});
