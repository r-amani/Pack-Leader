/**
 * Application color palette.
 *
 * Travel-themed design system with a dark-mode primary.
 * Colors are organized by intent, not by visual name.
 */
export const Colors = {
  // Primary brand — deep teal / ocean blue
  primary: {
    50: '#E0F7FA',
    100: '#B2EBF2',
    200: '#80DEEA',
    300: '#4DD0E1',
    400: '#26C6DA',
    500: '#00ACC1',
    600: '#0097A7',
    700: '#00838F',
    800: '#006064',
    900: '#004D40',
  },

  // Accent — warm amber / golden
  accent: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFC107',
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#FF6F00',
  },

  // Success
  success: {
    light: '#81C784',
    main: '#4CAF50',
    dark: '#388E3C',
  },

  // Warning
  warning: {
    light: '#FFB74D',
    main: '#FF9800',
    dark: '#F57C00',
  },

  // Danger / Error / SOS
  danger: {
    light: '#E57373',
    main: '#F44336',
    dark: '#D32F2F',
  },

  // Neutrals — dark mode
  dark: {
    background: '#0F1419',
    surface: '#1A1F2E',
    card: '#222842',
    border: '#2D3548',
    textPrimary: '#F5F5F5',
    textSecondary: '#9BA4B5',
    textMuted: '#5C6478',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },

  // Neutrals — light mode
  light: {
    background: '#F8F9FD',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E8ECF4',
    textPrimary: '#1A1F2E',
    textSecondary: '#5C6478',
    textMuted: '#9BA4B5',
    overlay: 'rgba(0, 0, 0, 0.3)',
  },

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;
