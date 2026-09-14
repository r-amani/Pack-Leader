import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/colors';
import { Theme } from '../../styles/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Reusable button component with multiple visual variants.
 */
export function Button({
  title,
  icon,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const iconColor =
    variant === 'outline' || variant === 'ghost'
      ? Colors.primary[500]
      : variant === 'secondary'
      ? Colors.dark.textPrimary
      : Colors.white;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style as ViewStyle,
      ]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary[500] : Colors.white}
        />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={iconColor}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={[styles.text, textVariantStyles[variant]]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 50,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...Theme.typography.button,
  },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: Colors.primary[500],
  },
  secondary: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary[500],
  },
  danger: {
    backgroundColor: Colors.danger.main,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
};

const textVariantStyles: Record<ButtonVariant, TextStyle> = {
  primary: {
    color: Colors.white,
  },
  secondary: {
    color: Colors.dark.textPrimary,
  },
  outline: {
    color: Colors.primary[500],
  },
  danger: {
    color: Colors.white,
  },
  ghost: {
    color: Colors.primary[500],
  },
};
