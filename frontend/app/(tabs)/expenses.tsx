import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getGroups } from "../../src/api/groups";
import { getGroupExpenses } from "../../src/api/expenses";
import { useAuthStore } from "../../src/store/authStore";
import { colors, spacing, typography } from "../../src/theme/colors";
import { Header } from "../../src/components/common/Header";
import { ExpenseCard } from "../../src/components/expense/ExpenseCard";
import { LoadingState } from "../../src/components/common/LoadingState";
import { EmptyState } from "../../src/components/common/EmptyState";
import { Expense } from "../../src/types/models";

type FilterType = "ALL" | "YOU_OWE" | "LEADER";

export default function ExpensesScreen() {
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
  });

  const {
    data: expenses = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["allExpenses", groups.map((g) => g.id)],
    queryFn: async () => {
      if (!groups || groups.length === 0) return [];
      const promises = groups.map((g) =>
        getGroupExpenses(g.id).catch(() => [] as Expense[])
      );
      const results = await Promise.all(promises);
      const all = results.flat();
      return all.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: groups.length > 0,
  });

  const filteredExpenses = useMemo(() => {
    if (!currentUserId) return expenses;

    if (activeFilter === "YOU_OWE") {
      return expenses.filter((e) =>
        e.splits?.some(
          (s) =>
            s.user_id === currentUserId &&
            (s.status === "PENDING" || s.status === "REJECTED")
        )
      );
    }

    if (activeFilter === "LEADER") {
      return expenses.filter((e) => e.created_by === currentUserId);
    }

    return expenses;
  }, [expenses, activeFilter, currentUserId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Expenses"
        subtitle="Shared bills & settlements"
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/expenses/create")}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={22} color={colors.textInverse} />
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeFilter === "ALL" && styles.tabItemActive]}
          onPress={() => setActiveFilter("ALL")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeFilter === "ALL" && styles.tabTextActive,
            ]}
          >
            All ({expenses.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeFilter === "YOU_OWE" && styles.tabItemActive]}
          onPress={() => setActiveFilter("YOU_OWE")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeFilter === "YOU_OWE" && styles.tabTextActive,
            ]}
          >
            You Owe
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeFilter === "LEADER" && styles.tabItemActive]}
          onPress={() => setActiveFilter("LEADER")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeFilter === "LEADER" && styles.tabTextActive,
            ]}
          >
            You Created
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingState message="Loading expenses..." fullScreen />
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title={
            activeFilter === "YOU_OWE"
              ? "All Clear!"
              : activeFilter === "LEADER"
              ? "No Expenses Created"
              : "No Expenses Found"
          }
          description={
            activeFilter === "YOU_OWE"
              ? "You do not have any pending payments. Great job staying settled!"
              : activeFilter === "LEADER"
              ? "You haven't posted any expenses as leader yet."
              : "No expenses have been added to your groups yet."
          }
          actionTitle="Add New Expense"
          onAction={() => router.push("/expenses/create")}
        />
      ) : (
        <FlatList
          data={filteredExpenses}
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
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    padding: 3,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    borderRadius: 6,
  },
  tabItemActive: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  tabText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
