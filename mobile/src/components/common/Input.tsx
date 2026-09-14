import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/colors';
import { Theme } from '../../styles/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: ViewStyle;
}

/**
 * Reusable text input with label, error state, and optional icon.
 */
export function Input({
  label,
  error,
  icon,
  containerStyle,
  style,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={error ? Colors.danger.main : isFocused ? Colors.primary[500] : Colors.dark.textMuted}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.dark.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    ...Theme.typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginBottom: Theme.spacing.xs,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Theme.spacing.md,
    minHeight: 50,
  },
  inputFocused: {
    borderColor: Colors.primary[500],
  },
  inputError: {
    borderColor: Colors.danger.main,
  },
  icon: {
    marginRight: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...Theme.typography.body,
    color: Colors.dark.textPrimary,
    paddingVertical: 12,
  },
  error: {
    ...Theme.typography.caption,
    color: Colors.danger.main,
    marginTop: Theme.spacing.xs,
  },
});
