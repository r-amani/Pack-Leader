import { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Navigation route parameter definitions.
 */

// Auth stack
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

// Trips nested stack
export type TripsStackParamList = {
  TripsList: { openJoin?: boolean } | undefined;
  CreateTrip: undefined;
  TripDetail: { tripId: string };
};

// Main bottom tabs
export type MainTabParamList = {
  Home: undefined;
  Trips: NavigatorScreenParams<TripsStackParamList> | undefined;
  Map: { tripId?: string } | undefined;
  Expenses: { tripId?: string } | undefined;
  Profile: undefined;
};

// Root navigator
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
