import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/colors';
import { Theme } from '../../styles/theme';
import { triggerSosBeacon, resolveSosBeacon } from '../../services/safety.api';

interface SosBeaconModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string | null;
  coords: { latitude: number; longitude: number } | null;
}

export function SosBeaconModal({
  visible,
  onClose,
  tripId,
  coords,
}: SosBeaconModalProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [activeAlertId, setActiveAlertId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCountdown(null);
      executeSosBroadcast();
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const startSosCountdown = () => {
    setCountdown(10);
  };

  const cancelCountdown = () => {
    setCountdown(null);
  };

  const executeSosBroadcast = async () => {
    if (!tripId || !coords) return;
    setIsSubmitting(true);
    try {
      const alert = await triggerSosBeacon(
        tripId,
        coords.latitude,
        coords.longitude,
        '🚨 CRITICAL SOS: Rider involved in accident / emergency distress'
      );
      setActiveAlertId(alert.id);
    } catch (err: any) {
      console.warn('Failed to dispatch SOS beacon:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!activeAlertId) return;
    setIsSubmitting(true);
    try {
      await resolveSosBeacon(activeAlertId);
      setActiveAlertId(null);
      onClose();
    } catch (err: any) {
      console.warn('Failed to resolve SOS:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="warning" size={24} color="#FF1744" />
              <Text style={styles.title}>EMERGENCY SOS BEACON</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtext}>
            Instantly alerts every member in your pack with high-priority emergency sirens and GPS coordinates.
          </Text>

          {/* GPS Coordinates Box */}
          <View style={styles.coordsBox}>
            <Text style={styles.coordsLabel}>CURRENT GPS POSITION</Text>
            <Text style={styles.coordsValue}>
              {coords
                ? `${coords.latitude.toFixed(5)}° N, ${coords.longitude.toFixed(5)}° W`
                : 'Acquiring high-accuracy GPS fix...'}
            </Text>
          </View>

          {/* Countdown State */}
          {countdown !== null && (
            <View style={styles.countdownBox}>
              <Text style={styles.countdownTitle}>DISPATCHING SOS IN</Text>
              <Text style={styles.countdownTimer}>{countdown}</Text>
              <Text style={styles.countdownHint}>Tap below to abort false alarm</Text>
              <TouchableOpacity style={styles.abortBtn} onPress={cancelCountdown}>
                <Text style={styles.abortBtnText}>ABORT (I AM OKAY)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Active Beacon Triggered State */}
          {activeAlertId && (
            <View style={styles.activeBeaconBox}>
              <Ionicons name="radio" size={32} color="#FF1744" />
              <Text style={styles.activeBeaconText}>BEACON TRANSMITTING LIVE</Text>
              <Text style={styles.activeBeaconDesc}>
                All pack members have been notified with high-priority sirens.
              </Text>
              <TouchableOpacity
                style={styles.resolveBtn}
                onPress={handleResolve}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.resolveBtnText}>I AM SAFE — CANCEL DISTRESS</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Initial State Trigger Button */}
          {countdown === null && !activeAlertId && (
            <TouchableOpacity
              style={styles.sosButton}
              activeOpacity={0.8}
              onPress={startSosCountdown}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="large" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="alert-circle" size={44} color="#FFF" />
                  <Text style={styles.sosButtonText}>TRIGGER SOS</Text>
                  <Text style={styles.sosButtonSub}>(10s Safety Countdown)</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  card: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: '#FF1744',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...Theme.typography.h3,
    color: '#FF1744',
    marginLeft: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  closeBtn: {
    padding: 4,
  },
  subtext: {
    ...Theme.typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginTop: 6,
    marginBottom: Theme.spacing.md,
  },
  coordsBox: {
    backgroundColor: '#121212',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Theme.spacing.lg,
  },
  coordsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark.textMuted,
    letterSpacing: 1,
  },
  coordsValue: {
    ...Theme.typography.body,
    fontWeight: '700',
    color: Colors.white,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  sosButton: {
    backgroundColor: '#D50000',
    height: 120,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Theme.shadows.lg,
  },
  sosButtonText: {
    ...Theme.typography.h2,
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 4,
  },
  sosButtonSub: {
    ...Theme.typography.caption,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  countdownBox: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
  },
  countdownTitle: {
    ...Theme.typography.caption,
    color: '#FF1744',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  countdownTimer: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFF',
    marginVertical: Theme.spacing.xs,
  },
  countdownHint: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
    marginBottom: Theme.spacing.md,
  },
  abortBtn: {
    backgroundColor: Colors.dark.surface,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  abortBtnText: {
    ...Theme.typography.bodySmall,
    color: Colors.primary[400],
    fontWeight: '700',
  },
  activeBeaconBox: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
  },
  activeBeaconText: {
    ...Theme.typography.h3,
    color: '#FF1744',
    fontWeight: '800',
    marginTop: 8,
  },
  activeBeaconDesc: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginVertical: Theme.spacing.sm,
  },
  resolveBtn: {
    backgroundColor: '#2E7D32', // Green
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: Theme.borderRadius.md,
    marginTop: Theme.spacing.sm,
  },
  resolveBtnText: {
    ...Theme.typography.bodySmall,
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: 1,
  },
});
