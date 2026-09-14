import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors } from '../../styles/colors';
import { Theme } from '../../styles/theme';

interface LoadingScreenProps {
  message?: string;
}

/**
 * Full-screen loading indicator.
 */
export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary[500]} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  message: {
    ...Theme.typography.body,
    color: Colors.dark.textSecondary,
    marginTop: Theme.spacing.md,
  },
});
