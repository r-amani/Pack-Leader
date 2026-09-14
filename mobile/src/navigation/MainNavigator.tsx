import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from './types';
import { HomeScreen } from '../screens/home/HomeScreen';
import { TripsNavigator } from './TripsNavigator';
import { MapScreen } from '../screens/map/MapScreen';
import { ExpensesScreen } from '../screens/expenses/ExpensesScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { Colors } from '../styles/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Trips: 'compass',
  Map: 'map',
  Expenses: 'wallet',
  Profile: 'person',
};

/**
 * Main bottom tab navigator with 5 primary sections.
 */
export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = String(TAB_ICONS[route.name]);
          return (
            <Ionicons
              name={focused ? (iconName as keyof typeof Ionicons.glyphMap) : (`${iconName}-outline` as keyof typeof Ionicons.glyphMap)}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: Colors.primary[500],
        tabBarInactiveTintColor: Colors.dark.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.dark.surface,
          borderTopColor: Colors.dark.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerTintColor: Colors.dark.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
        },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Pack Leader' }}
      />
      <Tab.Screen
        name="Trips"
        component={TripsNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
