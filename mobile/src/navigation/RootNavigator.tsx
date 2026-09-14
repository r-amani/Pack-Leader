import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { Colors } from '../styles/colors';

/**
 * Dark navigation theme.
 */
const PackLeaderTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary[500],
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.textPrimary,
    border: Colors.dark.border,
    notification: Colors.accent[500],
  },
};

/**
 * Root navigator — switches between Auth and Main based on authentication state.
 */
export function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Loading Pack Leader..." />;
  }

  return (
    <NavigationContainer theme={PackLeaderTheme}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
