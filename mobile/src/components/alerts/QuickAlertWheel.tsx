import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QuickAlertType } from '@packleader/shared';
import { Colors } from '../../styles/colors';
import { Theme } from '../../styles/theme';

interface QuickAlertWheelProps {
  visible: boolean;
  onClose: () => void;
  onSendAlert: (type: QuickAlertType) => void;
}

const ALERTS_CONFIG = [
  {
    type: QuickAlertType.LOW_FUEL,
    title: 'Low Fuel',
    icon: 'water-outline',
    color: '#FFB300', // Amber
    desc: 'Need gas stop soon',
  },
  {
    type: QuickAlertType.OBSTACLE_AHEAD,
    title: 'Obstacle',
    icon: 'warning-outline',
    color: '#FF5722', // Deep Orange
    desc: 'Debris or road hazard',
  },
  {
    type: QuickAlertType.PULL_OVER,
    title: 'Pull Over',
    icon: 'hand-left-outline',
    color: '#F44336', // Red
    desc: 'Immediate shoulder stop',
  },
  {
    type: QuickAlertType.REGROUP,
    title: 'Regroup',
    icon: 'sync-outline',
    color: '#00E5FF', // Cyan
    desc: 'Slow down & close gap',
  },
  {
    type: QuickAlertType.HAZARD_WEATHER,
    title: 'Weather Hazard',
    icon: 'rainy-outline',
    color: '#42A5F5', // Blue
    desc: 'Rain, ice, or low visibility',
  },
  {
    type: QuickAlertType.POLICE_TRAP,
    title: 'Police Ahead',
    icon: 'shield-outline',
    color: '#AB47BC', // Purple
    desc: 'Speed check ahead',
  },
];

export function QuickAlertWheel({ visible, onClose, onSendAlert }: QuickAlertWheelProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="megaphone" size={20} color="#FF9800" />
              <Text style={styles.headerTitle}>1-Tap Convoy Quick Alerts</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSub}>
            Glove-friendly instant transmission to every rider in the pack.
          </Text>

          {/* 2x3 Large Grid of Tactile Alert Buttons */}
          <View style={styles.grid}>
            {ALERTS_CONFIG.map((item) => (
              <TouchableOpacity
                key={item.type}
                style={[styles.tile, { borderColor: item.color }]}
                activeOpacity={0.7}
                onPress={() => {
                  onSendAlert(item.type);
                  onClose();
                }}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${item.color}22` }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <Text style={[styles.tileTitle, { color: item.color }]}>{item.title}</Text>
                <Text style={styles.tileDesc} numberOfLines={1}>
                  {item.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.dark.surface,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    ...Theme.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...Theme.typography.h3,
    color: Colors.white,
    marginLeft: 8,
  },
  closeBtn: {
    padding: 4,
  },
  headerSub: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 4,
    marginBottom: Theme.spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    backgroundColor: Colors.dark.background,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1.5,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  tileTitle: {
    ...Theme.typography.bodySmall,
    fontWeight: '800',
    textAlign: 'center',
  },
  tileDesc: {
    ...Theme.typography.caption,
    color: Colors.dark.textMuted,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
