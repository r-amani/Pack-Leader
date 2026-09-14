import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TravelMode, TRAVEL_MODE_LABELS, TRAVEL_MODE_ICONS } from '@packleader/shared';
import { Button, Input } from '../../components/common';
import { Colors } from '../../styles/colors';
import { Theme } from '../../styles/theme';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../contexts/AuthContext';

type SignUpNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

const TRAVEL_MODES: TravelMode[] = [
  TravelMode.ROAD_TRIP,
  TravelMode.MOTORCYCLE,
  TravelMode.HIKING,
  TravelMode.SOLO,
  TravelMode.FAMILY,
];

/**
 * Sign-up screen — new user registration.
 * Connected to Pack Leader backend API via AuthContext.
 */
export function SignUpScreen() {
  const navigation = useNavigation<SignUpNavigationProp>();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedMode, setSelectedMode] = useState<TravelMode>(TravelMode.ROAD_TRIP);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
        preferredTravelMode: selectedMode,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Join the Pack</Text>
          <Text style={styles.subtitle}>Create your account to start exploring.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Input
            label="Full Name"
            icon="person-outline"
            placeholder="Your name"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (error) setError('');
            }}
            autoComplete="name"
          />

          <Input
            label="Email"
            icon="mail-outline"
            placeholder="you@example.com"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          {/* Travel Style Selector */}
          <Text style={styles.label}>Preferred Travel Style</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modesContainer}
          >
            {TRAVEL_MODES.map((mode) => {
              const isSelected = selectedMode === mode;
              const iconName = TRAVEL_MODE_ICONS[mode] as any;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeChip, isSelected && styles.modeChipSelected]}
                  onPress={() => setSelectedMode(mode)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={iconName}
                    size={16}
                    color={isSelected ? Colors.dark.background : Colors.dark.textSecondary}
                  />
                  <Text style={[styles.modeText, isSelected && styles.modeTextSelected]}>
                    {TRAVEL_MODE_LABELS[mode]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Input
            label="Password"
            icon="lock-closed-outline"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError('');
            }}
            secureTextEntry
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            icon="lock-closed-outline"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (error) setError('');
            }}
            secureTextEntry
          />

          <Button
            title="Create Account"
            onPress={handleSignUp}
            loading={loading}
            fullWidth
          />

          <Button
            title="Already have an account? Sign In"
            variant="ghost"
            onPress={() => navigation.goBack()}
            fullWidth
            style={styles.signInButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  title: {
    ...Theme.typography.h1,
    color: Colors.dark.textPrimary,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    ...Theme.typography.body,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
    marginBottom: Theme.spacing.xs,
    marginTop: Theme.spacing.xs,
  },
  modesContainer: {
    flexDirection: 'row',
    paddingVertical: Theme.spacing.xs,
    marginBottom: Theme.spacing.md,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    marginRight: Theme.spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modeChipSelected: {
    backgroundColor: Colors.primary[400],
    borderColor: Colors.primary[400],
  },
  modeText: {
    ...Theme.typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginLeft: 6,
  },
  modeTextSelected: {
    color: Colors.dark.background,
    fontWeight: '600',
  },
  error: {
    ...Theme.typography.bodySmall,
    color: Colors.danger.main,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.sm,
  },
  signInButton: {
    marginTop: Theme.spacing.sm,
  },
});
