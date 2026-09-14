import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TripsStackParamList } from './types';
import { TripsScreen } from '../screens/trips/TripsScreen';
import { CreateTripScreen } from '../screens/trips/CreateTripScreen';
import { TripDetailScreen } from '../screens/trips/TripDetailScreen';
import { Colors } from '../styles/colors';

const Stack = createNativeStackNavigator<TripsStackParamList>();

export function TripsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerTintColor: Colors.primary[400],
        headerTitleStyle: {
          fontWeight: '700',
          color: Colors.dark.textPrimary,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="TripsList"
        component={TripsScreen}
        options={{ title: 'My Trips' }}
      />
      <Stack.Screen
        name="CreateTrip"
        component={CreateTripScreen}
        options={{ title: 'Create a Trip' }}
      />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{ title: 'Trip Details' }}
      />
    </Stack.Navigator>
  );
}
