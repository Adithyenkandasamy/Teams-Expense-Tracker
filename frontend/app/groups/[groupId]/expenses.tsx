import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getGroupExpenses } from "../../../src/api/expenses";
import { colors, spacing, typography } from "../../../src/theme/colors";
import { Header } from "../../../src/components/common/Header";
import { ExpenseCard } from "../../../src/components/expense/ExpenseCard";
import { LoadingState } from "../../../src/components/common/LoadingState";
import { EmptyState } from "../../../src/components/common/EmptyState";

export default function GroupExpensesScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();

  const {
    data: expenses = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["groupExpenses", groupId],
    queryFn: () => getGroupExpenses(groupId),
    enabled: !!groupId,
    refetchInterval: 6000,
    refetchIntervalInBackground: false,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Group Expenses"
        subtitle={`${expenses.length} total`}
        showBack
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace(`/groups/${groupId}` as any);
          }
        }}

        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push(`/expenses/create?groupId=${groupId}` as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={22} color={colors.textInverse} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading group expenses..." fullScreen />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No Expenses"
          description="No expenses have been added to this group yet."
          actionTitle="Add First Expense"
          onAction={() => router.push(`/expenses/create?groupId=${groupId}` as any)}
        />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <ExpenseCard
              expense={item}
              onPress={() => router.push(`/expenses/${item.id}` as any)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
