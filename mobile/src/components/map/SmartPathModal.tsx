import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ICoordinatesPair,
  ISmartPathRecommendation,
  RoutePreference,
} from '@packleader/shared';
import { Colors } from '../../styles/colors';
import { Theme } from '../../styles/theme';
import { Button, Card } from '../common';
import { getSmartPathRecommendations } from '../../services/smartpath.service';

interface SmartPathModalProps {
  visible: boolean;
  onClose: () => void;
  origin: ICoordinatesPair | null;
  destination: ICoordinatesPair | null;
  onSelectRoute: (recommendation: ISmartPathRecommendation) => void;
}

export function SmartPathModal({
  visible,
  onClose,
  origin,
  destination,
  onSelectRoute,
}: SmartPathModalProps) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<ISmartPathRecommendation[]>([]);
  const [selectedPref, setSelectedPref] = useState<RoutePreference>(RoutePreference.TWISTY);

  useEffect(() => {
    if (visible && origin && destination) {
      loadSmartPaths();
    }
  }, [visible, origin, destination]);

  const loadSmartPaths = async () => {
    if (!origin || !destination) return;
    setLoading(true);
    try {
      const recs = await getSmartPathRecommendations(origin, destination, {
        preference: selectedPref,
        fuelRangeKm: 180,
      });
      setRecommendations(recs);
    } catch (err) {
      console.warn('Failed to fetch smartpath recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPreferenceIcon = (pref: RoutePreference) => {
    switch (pref) {
      case RoutePreference.TWISTY:
        return 'git-branch';
      case RoutePreference.SCENIC:
        return 'camera';
      case RoutePreference.CONVOY_SAFE:
        return 'shield-checkmark';
      default:
        return 'flash';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="sparkles" size={22} color={Colors.accent[500]} />
              <Text style={styles.headerTitle}>SmartPath Route Optimizer</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.dark.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSub}>
            AI-tuned mountain curves, scenic overlooks, and automated pack fuel stops.
          </Text>

          {/* Preferences Filter Chips */}
          <View style={styles.filterRow}>
            {[
              { id: RoutePreference.TWISTY, label: 'Twisties', icon: 'bicycle' },
              { id: RoutePreference.SCENIC, label: 'Scenic', icon: 'leaf' },
              { id: RoutePreference.CONVOY_SAFE, label: 'Convoy Safe', icon: 'shield' },
              { id: RoutePreference.FASTEST, label: 'Fastest', icon: 'flash' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterChip,
                  selectedPref === f.id && styles.filterChipActive,
                ]}
                onPress={() => {
                  setSelectedPref(f.id);
                  loadSmartPaths();
                }}
              >
                <Ionicons
                  name={f.icon as any}
                  size={14}
                  color={selectedPref === f.id ? Colors.white : Colors.dark.textMuted}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    selectedPref === f.id && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recommendations Content */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={Colors.primary[400]} />
              <Text style={styles.loadingText}>Synthesizing optimal curves & fuel stops...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
              {recommendations.map((rec) => (
                <Card key={rec.id} style={styles.routeCard}>
                  <View style={styles.routeHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={styles.iconCircle}>
                        <Ionicons
                          name={getPreferenceIcon(rec.preference)}
                          size={18}
                          color={Colors.primary[400]}
                        />
                      </View>
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={styles.routeName}>{rec.name}</Text>
                        <Text style={styles.routeMeta}>
                          {rec.totalDistanceKm} km • {Math.floor(rec.totalDurationMinutes / 60)}h{' '}
                          {rec.totalDurationMinutes % 60}m • +{rec.elevationGainMeters}m gain
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Scores Grid */}
                  <View style={styles.scoresGrid}>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>CURVATURE</Text>
                      <Text style={styles.scoreValue}>{rec.curvatureScore} / 10</Text>
                    </View>
                    <View style={styles.scoreDivider} />
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>SCENIC RATING</Text>
                      <Text style={styles.scoreValue}>{rec.scenicScore} / 10</Text>
                    </View>
                    <View style={styles.scoreDivider} />
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>PLANNED STOPS</Text>
                      <Text style={styles.scoreValue}>{rec.recommendedStops.length} stops</Text>
                    </View>
                  </View>

                  {/* Highlights */}
                  {rec.highlights.map((h, i) => (
                    <View key={i} style={styles.highlightItem}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.accent[500]} />
                      <Text style={styles.highlightText}>{h}</Text>
                    </View>
                  ))}

                  <Button
                    title="Apply This SmartPath"
                    icon="navigate"
                    variant="primary"
                    onPress={() => {
                      onSelectRoute(rec);
                      onClose();
                    }}
                    style={{ marginTop: Theme.spacing.sm }}
                  />
                </Card>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Theme.spacing.md,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...Theme.typography.h3,
    color: Colors.dark.textPrimary,
    marginLeft: 8,
  },
  closeBtn: {
    padding: 4,
  },
  headerSub: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 4,
    marginBottom: Theme.spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[500],
  },
  filterChipText: {
    ...Theme.typography.caption,
    color: Colors.dark.textMuted,
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 11,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  centerBox: {
    padding: Theme.spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    ...Theme.typography.bodySmall,
    color: Colors.primary[400],
    marginTop: Theme.spacing.md,
  },
  list: {
    marginVertical: Theme.spacing.xs,
  },
  routeCard: {
    marginBottom: Theme.spacing.md,
    borderColor: Colors.dark.border,
    borderWidth: 1,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeName: {
    ...Theme.typography.body,
    fontWeight: '700',
    color: Colors.white,
  },
  routeMeta: {
    ...Theme.typography.caption,
    color: Colors.primary[400],
    marginTop: 2,
  },
  scoresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.dark.background,
    borderRadius: Theme.borderRadius.sm,
    paddingVertical: Theme.spacing.xs,
    marginVertical: Theme.spacing.xs,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.dark.textMuted,
    letterSpacing: 0.5,
  },
  scoreValue: {
    ...Theme.typography.caption,
    fontWeight: '800',
    color: Colors.white,
    marginTop: 2,
  },
  scoreDivider: {
    width: 1,
    backgroundColor: Colors.dark.border,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  highlightText: {
    ...Theme.typography.caption,
    color: Colors.dark.textSecondary,
    marginLeft: 6,
  },
});
