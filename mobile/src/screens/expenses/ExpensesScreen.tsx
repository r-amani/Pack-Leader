import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { Colors } from '../../styles/colors';
import { EmptyState } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { fetchMyTrips, fetchTripById } from '../../services/trip.api';
import {
  fetchTripExpenses,
  fetchTripExpenseSummary,
  createExpense,
  deleteExpense,
} from '../../services/expense.api';
import {
  ITrip,
  IExpense,
  IExpenseSummary,
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
} from '@packleader/shared';
import { MainTabParamList } from '../../navigation/types';

type ExpensesScreenRouteProp = RouteProp<MainTabParamList, 'Expenses'>;

const CATEGORY_ICONS: Record<ExpenseCategory, keyof typeof Ionicons.glyphMap> = {
  [ExpenseCategory.FUEL]: 'speedometer-outline',
  [ExpenseCategory.FOOD]: 'restaurant-outline',
  [ExpenseCategory.ACCOMMODATION]: 'bed-outline',
  [ExpenseCategory.TOLL]: 'cash-outline',
  [ExpenseCategory.PARKING]: 'car-outline',
  [ExpenseCategory.TICKETS]: 'ticket-outline',
  [ExpenseCategory.OTHER]: 'receipt-outline',
};

export function ExpensesScreen() {
  const route = useRoute<ExpensesScreenRouteProp>();
  const navigation = useNavigation();
  const { user } = useAuth();

  const [trips, setTrips] = useState<ITrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<ITrip | null>(null);
  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [summary, setSummary] = useState<IExpenseSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'expenses' | 'settlements' | 'categories'>('expenses');

  // Add Expense Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.FUEL);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Load Trips
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const myTrips = await fetchMyTrips();
      setTrips(myTrips);

      let targetTrip: ITrip | null = null;
      if (route.params?.tripId) {
        targetTrip = myTrips.find((t) => t.id === route.params?.tripId) || null;
        if (!targetTrip) {
          targetTrip = await fetchTripById(route.params.tripId);
        }
      } else if (myTrips.length > 0) {
        targetTrip = myTrips[0];
      }

      setSelectedTrip(targetTrip);

      if (targetTrip) {
        await loadTripExpenses(targetTrip.id);
      }
    } catch (err: any) {
      console.warn('Failed to load expense trip data:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [route.params?.tripId]);

  const loadTripExpenses = async (tripId: string) => {
    try {
      const [expList, sum] = await Promise.all([
        fetchTripExpenses(tripId),
        fetchTripExpenseSummary(tripId),
      ]);
      setExpenses(expList);
      setSummary(sum);
    } catch (err: any) {
      console.warn('Failed to load trip expenses:', err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle open add modal
  const openAddModal = () => {
    if (!selectedTrip) return;
    setDesc('');
    setAmount('');
    setCategory(ExpenseCategory.FUEL);
    // Default participants = all members
    const allMemberIds = selectedTrip.members.map((m) =>
      typeof m.userId === 'string' ? m.userId : (m as any).userId?.toString() || (m as any).user?.toString()
    ).filter(Boolean);
    setSelectedParticipants(allMemberIds);
    setModalVisible(true);
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSaveExpense = async () => {
    if (!selectedTrip) return;
    const parsedAmount = parseFloat(amount);
    if (!desc.trim()) {
      Alert.alert('Missing Field', 'Please enter a description for the expense.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount greater than 0.');
      return;
    }
    if (selectedParticipants.length === 0) {
      Alert.alert('No Riders Selected', 'Please select at least one rider to split this expense with.');
      return;
    }

    try {
      setSubmitting(true);
      await createExpense({
        tripId: selectedTrip.id,
        category,
        amount: parsedAmount,
        currency: 'USD',
        description: desc.trim(),
        date: new Date().toISOString(),
        participantIds: selectedParticipants,
      });

      setModalVisible(false);
      await loadTripExpenses(selectedTrip.id);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (expenseId: string) => {
    Alert.alert('Delete Expense', 'Are you sure you want to remove this expense entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!selectedTrip) return;
          try {
            await deleteExpense(expenseId);
            await loadTripExpenses(selectedTrip.id);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Could not delete expense');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={styles.loadingText}>Loading Pack Ledger...</Text>
      </View>
    );
  }

  if (!selectedTrip) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="wallet-outline"
          title="No Active Trip Selected"
          message="Join or create an expedition to track and split convoy expenses."
        />
      </View>
    );
  }

  // Calculate current user's balance
  const currentUserId = user?.id;
  const myBalance = summary?.memberBalances.find((b) => b.userId === currentUserId);
  const net = myBalance?.netBalance ?? 0;

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.tripSubtitle}>EXPEDITION LEDGER</Text>
          <Text style={styles.tripTitle} numberOfLines={1}>
            {selectedTrip.name}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={20} color={Colors.white} />
          <Text style={styles.addBtnText}>Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Convoy Spend</Text>
          <Text style={styles.statValue}>
            ${(summary?.totalTripCost ?? 0).toFixed(2)}
          </Text>
          <Text style={styles.statSub}>{expenses.length} entries</Text>
        </View>

        <View style={[styles.statCard, net > 0 ? styles.positiveCard : net < 0 ? styles.negativeCard : null]}>
          <Text style={styles.statLabel}>Your Net Balance</Text>
          <Text
            style={[
              styles.statValue,
              net > 0 ? styles.positiveText : net < 0 ? styles.negativeText : styles.neutralText,
            ]}
          >
            {net > 0 ? `+$${net.toFixed(2)}` : net < 0 ? `-$${Math.abs(net).toFixed(2)}` : '$0.00'}
          </Text>
          <Text style={styles.statSub}>
            {net > 0 ? 'To receive' : net < 0 ? 'You owe' : 'All settled'}
          </Text>
        </View>
      </View>

      {/* Segmented Control Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            Expenses ({expenses.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settlements' && styles.activeTab]}
          onPress={() => setActiveTab('settlements')}
        >
          <Text style={[styles.tabText, activeTab === 'settlements' && styles.activeTabText]}>
            Settlement ({summary?.settlements.length ?? 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'categories' && styles.activeTab]}
          onPress={() => setActiveTab('categories')}
        >
          <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>
            Categories
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Contents */}
      {activeTab === 'expenses' && (
        expenses.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No Expenses Logged"
            message="Tap '+ Expense' to record fuel, food, or toll costs for the convoy."
          />
        ) : (
          <FlatList
            data={expenses}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const iconName = CATEGORY_ICONS[item.category] || 'receipt-outline';
              const isPayer = item.paidBy === currentUserId;
              return (
                <View style={styles.expenseItem}>
                  <View style={styles.categoryIconWrap}>
                    <Ionicons name={iconName} size={22} color={Colors.accent[400]} />
                  </View>
                  <View style={styles.expenseDetails}>
                    <Text style={styles.expenseDesc}>{item.description}</Text>
                    <Text style={styles.expenseMeta}>
                      Paid by {isPayer ? 'You' : item.paidByName} • {new Date(item.date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.participantCount}>
                      Split between {item.participants.length} rider{item.participants.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.expensePriceWrap}>
                    <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
                    {isPayer && (
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.trashBtn}>
                        <Ionicons name="trash-outline" size={16} color={Colors.danger.light} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )
      )}

      {activeTab === 'settlements' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          <Text style={styles.sectionHeader}>Optimal Cash-Flow Settlements</Text>
          <Text style={styles.sectionSub}>
            Automated minimum debt settlement path for the entire pack:
          </Text>

          {(!summary?.settlements || summary.settlements.length === 0) ? (
            <View style={styles.allSettledCard}>
              <Ionicons name="checkmark-circle" size={40} color={Colors.success.main} />
              <Text style={styles.allSettledTitle}>All Balances Even!</Text>
              <Text style={styles.allSettledSub}>No outstanding settlements needed between riders.</Text>
            </View>
          ) : (
            summary.settlements.map((s, idx) => (
              <View key={idx} style={styles.settlementRow}>
                <View style={styles.settleAvatars}>
                  <Text style={styles.riderName}>{s.fromName}</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.accent[400]} style={{ marginHorizontal: 8 }} />
                  <Text style={styles.riderName}>{s.toName}</Text>
                </View>
                <Text style={styles.settleAmount}>${s.amount.toFixed(2)}</Text>
              </View>
            ))
          )}

          <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Individual Net Balances</Text>
          {summary?.memberBalances.map((mb) => (
            <View key={mb.userId} style={styles.memberBalanceRow}>
              <Text style={styles.mbName}>{mb.name}</Text>
              <Text style={[styles.mbVal, mb.netBalance > 0 ? styles.positiveText : mb.netBalance < 0 ? styles.negativeText : null]}>
                {mb.netBalance > 0 ? `+$${mb.netBalance.toFixed(2)}` : mb.netBalance < 0 ? `-$${Math.abs(mb.netBalance).toFixed(2)}` : '$0.00'}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {activeTab === 'categories' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          <Text style={styles.sectionHeader}>Convoy Spend by Category</Text>
          {Object.entries(summary?.categoryBreakdown || {}).map(([cat, amt]) => {
            const label = EXPENSE_CATEGORY_LABELS[cat as ExpenseCategory] || cat;
            const pct = summary?.totalTripCost ? Math.round((amt / summary.totalTripCost) * 100) : 0;
            return (
              <View key={cat} style={styles.categoryRow}>
                <View style={styles.catHeader}>
                  <Text style={styles.catLabel}>{label}</Text>
                  <Text style={styles.catAmount}>${amt.toFixed(2)} ({pct}%)</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add Expense Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Mountain Pass Fuel Stop"
                placeholderTextColor={Colors.dark.textMuted}
                value={desc}
                onChangeText={setDesc}
              />

              <Text style={styles.inputLabel}>Amount (USD)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={Colors.dark.textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {Object.values(ExpenseCategory).map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catChip, isSelected && styles.catChipActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Ionicons
                        name={CATEGORY_ICONS[cat]}
                        size={16}
                        color={isSelected ? Colors.white : Colors.dark.textSecondary}
                      />
                      <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                        {EXPENSE_CATEGORY_LABELS[cat]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Split Between Riders</Text>
              {selectedTrip.members.map((m) => {
                const id = typeof m.userId === 'string' ? m.userId : (m as any).userId?.toString() || (m as any).user?.toString();
                const isSelected = selectedParticipants.includes(id);
                return (
                  <TouchableOpacity
                    key={id}
                    style={styles.memberCheckRow}
                    onPress={() => toggleParticipant(id)}
                  >
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isSelected ? Colors.accent[400] : Colors.dark.textSecondary}
                    />
                    <Text style={styles.memberCheckName}>{m.name || 'Pack Member'}</Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSaveExpense}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Save to Pack Ledger</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  tripSubtitle: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    color: Colors.accent[400],
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.textPrimary,
    marginTop: 2,
    maxWidth: 220,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  positiveCard: {
    borderColor: Colors.success.main,
  },
  negativeCard: {
    borderColor: Colors.danger.main,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark.textPrimary,
    marginVertical: 4,
  },
  positiveText: {
    color: Colors.success.light,
  },
  negativeText: {
    color: Colors.danger.light,
  },
  neutralText: {
    color: Colors.dark.textPrimary,
  },
  statSub: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 10,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.accent[400],
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  activeTabText: {
    color: Colors.accent[400],
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  categoryIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDesc: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark.textPrimary,
  },
  expenseMeta: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  participantCount: {
    fontSize: 10,
    color: Colors.accent[400],
    marginTop: 2,
  },
  expensePriceWrap: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark.textPrimary,
  },
  trashBtn: {
    marginTop: 6,
    padding: 4,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginBottom: 14,
  },
  allSettledCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.card,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  allSettledTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.textPrimary,
    marginTop: 10,
  },
  allSettledSub: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  settleAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textPrimary,
  },
  settleAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.accent[400],
  },
  memberBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  mbName: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  mbVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.textPrimary,
  },
  categoryRow: {
    marginBottom: 16,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textPrimary,
  },
  catAmount: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.dark.card,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.textPrimary,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.dark.textPrimary,
    fontSize: 14,
    marginBottom: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 4,
  },
  catChipActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[500],
  },
  catChipText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  catChipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  memberCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  memberCheckName: {
    fontSize: 13,
    color: Colors.dark.textPrimary,
  },
  submitBtn: {
    backgroundColor: Colors.primary[600],
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
