import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { Colors } from '../../styles/colors';
import { Theme } from '../../styles/theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated';
}

/**
 * Reusable card container with consistent styling.
 */
export function Card({ variant = 'default', style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && Theme.shadows.md,
        style as ViewStyle,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
});
