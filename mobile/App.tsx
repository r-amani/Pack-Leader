import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';

/**
 * Pack Leader — Root Application Component.
 *
 * Wraps the entire app in the AuthProvider context and renders
 * the root navigator which switches between Auth and Main flows.
 */
export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}
