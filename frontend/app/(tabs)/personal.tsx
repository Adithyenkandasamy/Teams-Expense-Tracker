import React, { useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getPersonalExpenses, deletePersonalExpense } from "../../src/api/personalExpenses";
import { useAuthStore } from "../../src/store/authStore";
import { formatDate, formatINR } from "../../src/utils/formatters";
import { colors, spacing, typography } from "../../src/theme/colors";
import { Header } from "../../src/components/common/Header";
import { EmptyState } from "../../src/components/common/EmptyState";
import { LoadingState } from "../../src/components/common/LoadingState";

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Food: "restaurant-outline",
  Transport: "car-outline",
  Housing: "home-outline",
  Bills: "flash-outline",
  Shopping: "bag-outline",
  Health: "heart-outline",
  Entertainment: "film-outline",
  Other: "ellipsis-horizontal-circle-outline",
};

export default function PersonalExpensesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth() + 1;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  const {
    data: expenses = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["personalExpenses", year, month],
    queryFn: () => getPersonalExpenses(year, month),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePersonalExpense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personalExpenses"] }),
    onError: () => Alert.alert("Could not delete", "Please try again."),
  });

  const stats = useMemo(() => {
    const byCategory = new Map<string, number>();
    let total = 0;
    for (const expense of expenses) {
      const amount = Number(expense.amount) || 0;
      total += amount;
      byCategory.set(expense.category, (byCategory.get(expense.category) || 0) + amount);
    }
    const days = new Date(year, month, 0).getDate();
    const today = new Date();
    const elapsedDays = year === today.getFullYear() && month === today.getMonth() + 1
      ? today.getDate()
      : days;
    return {
      total,
      average: elapsedDays ? total / elapsedDays : 0,
      categories: [...byCategory.entries()]
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount),
    };
  }, [expenses, year, month]);

  const moveMonth = (step: number) => {
    setSelectedMonth((current) => new Date(current.getFullYear(), current.getMonth() + step, 1));
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Delete expense?", "This personal entry will be removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="My Spending"
        subtitle="Personal expenses and monthly stats"
        rightAction={
          <TouchableOpacity style={styles.addButton} onPress={() => router.push("/personal-expenses/create")}>
            <Ionicons name="add" size={22} color={colors.textInverse} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      >
        <View style={styles.monthRow}>
          <TouchableOpacity style={styles.monthArrow} onPress={() => moveMonth(-1)}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{selectedMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</Text>
          <TouchableOpacity
            style={styles.monthArrow}
            onPress={() => moveMonth(1)}
            disabled={monthKey === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {isLoading ? <LoadingState message="Loading your spending..." /> : (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.eyebrow}>TOTAL SPENT</Text>
              <Text style={styles.total}>{formatINR(stats.total)}</Text>
              <Text style={styles.heroFoot}>{expenses.length} {expenses.length === 1 ? "expense" : "expenses"} this month</Text>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>DAILY AVERAGE</Text>
                <Text style={styles.statValue}>{formatINR(stats.average)}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>TOP CATEGORY</Text>
                <Text style={styles.statValue} numberOfLines={1}>{stats.categories[0]?.category || "—"}</Text>
              </View>
            </View>

            {!!stats.categories.length && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Spending by category</Text>
                {stats.categories.slice(0, 5).map(({ category, amount }) => (
                  <View key={category} style={styles.categoryRow}>
                    <View style={styles.categoryNameRow}>
                      <Ionicons name={CATEGORY_ICONS[category] || CATEGORY_ICONS.Other} size={17} color={colors.textSecondary} />
                      <Text style={styles.categoryName}>{category}</Text>
                      <Text style={styles.categoryAmount}>{formatINR(amount)}</Text>
                    </View>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${Math.max(4, (amount / stats.total) * 100)}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transactions</Text>
              {!expenses.length ? (
                <EmptyState
                  icon="wallet-outline"
                  title="No personal expenses yet"
                  description="Add everyday spending to see your monthly trends here."
                  actionTitle="Add expense"
                  onAction={() => router.push("/personal-expenses/create")}
                />
              ) : expenses.map((expense) => (
                <View key={expense.id} style={styles.expenseRow}>
                  <View style={styles.expenseIcon}>
                    <Ionicons name={CATEGORY_ICONS[expense.category] || CATEGORY_ICONS.Other} size={19} color={colors.textPrimary} />
                  </View>
                  <View style={styles.expenseDetails}>
                    <Text style={styles.expenseDescription} numberOfLines={1}>{expense.description}</Text>
                    <Text style={styles.expenseMeta}>{expense.category} · {formatDate(expense.spent_at)}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>{formatINR(expense.amount)}</Text>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(expense.id)}>
                    <Ionicons name="trash-outline" size={17} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  addButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.lg },
  monthArrow: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.surfaceBorder },
  monthLabel: { ...typography.h3 },
  heroCard: { padding: spacing.xl, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
  eyebrow: { fontSize: 11, fontWeight: "700", color: colors.textMuted, letterSpacing: 1.1 },
  total: { color: colors.textPrimary, fontSize: 34, fontWeight: "800", marginTop: 8 },
  heroFoot: { color: colors.textSecondary, fontSize: 13, marginTop: 6 },
  statRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  statCard: { flex: 1, padding: spacing.lg, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
  statLabel: { fontSize: 10, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.6 },
  statValue: { color: colors.textPrimary, fontSize: 17, fontWeight: "700", marginTop: 8 },
  section: { marginTop: spacing.xl },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  categoryRow: { marginBottom: spacing.md },
  categoryNameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: 7 },
  categoryName: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  categoryAmount: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  track: { height: 6, borderRadius: 4, backgroundColor: colors.surfaceBorder, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4, backgroundColor: colors.primary },
  expenseRow: { minHeight: 68, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.surfaceBorder, gap: spacing.sm },
  expenseIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceElevated, alignItems: "center", justifyContent: "center" },
  expenseDetails: { flex: 1 },
  expenseDescription: { color: colors.textPrimary, fontSize: 14, fontWeight: "600" },
  expenseMeta: { color: colors.textMuted, fontSize: 11, marginTop: 5 },
  expenseAmount: { color: colors.textPrimary, fontSize: 13, fontWeight: "700" },
  deleteButton: { padding: spacing.sm },
});
