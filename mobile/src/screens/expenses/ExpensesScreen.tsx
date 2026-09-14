import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmptyState } from '../../components/common';
import { Colors } from '../../styles/colors';

/**
 * Expenses screen — group expense tracking.
 * Stage 1: Empty state. Stage 9: Full expense management.
 */
export function ExpensesScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="wallet-outline"
        title="No Expenses"
        message="Trip expenses will appear here once you start tracking."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
});
