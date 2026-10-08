import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/store/authStore";
import { getGroups } from "../../src/api/groups";
import { getGroupExpenses } from "../../src/api/expenses";
import { colors, spacing, typography } from "../../src/theme/colors";
import { formatINR } from "../../src/utils/formatters";
import { Avatar } from "../../src/components/common/Avatar";
import { ExpenseCard } from "../../src/components/expense/ExpenseCard";
import { GroupCard } from "../../src/components/group/GroupCard";
import { LoadingState } from "../../src/components/common/LoadingState";
import { EmptyState } from "../../src/components/common/EmptyState";
import { Expense } from "../../src/types/models";

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Fetch groups
  const {
    data: groups = [],
    isLoading: loadingGroups,
    refetch: refetchGroups,
  } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
  });

  // Fetch expenses for all groups
  const {
    data: allExpenses = [],
    isLoading: loadingExpenses,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: ["allExpenses", groups.map((g) => g.id)],
    queryFn: async () => {
      if (!groups || groups.length === 0) return [];
      const expensePromises = groups.map((g) =>
        getGroupExpenses(g.id).catch(() => [] as Expense[])
      );
      const results = await Promise.all(expensePromises);
      return results.flat();
    },
    enabled: groups.length > 0,
  });

  const isRefreshing = loadingGroups || loadingExpenses;

  const handleRefresh = () => {
    refetchGroups();
    refetchExpenses();
  };

  // Derive dashboard statistics
  const {
    totalYouOwe,
    totalOthersOweYou,
    pendingPaymentsCount,
    reviewPendingCount,
    recentExpenses,
  } = useMemo(() => {
    let youOwe = 0;
    let othersOweYou = 0;
    let pendingCount = 0;
    let reviewCount = 0;

    const currentUserId = user?.id;

    allExpenses.forEach((exp) => {
      const isLeader = exp.created_by === currentUserId;

      exp.splits?.forEach((split) => {
        const splitAmount =
          typeof split.amount === "string" ? parseFloat(split.amount) : split.amount;

        if (split.user_id === currentUserId) {
          if (split.status === "PENDING" || split.status === "REJECTED") {
            youOwe += splitAmount;
            pendingCount++;
          }
        } else if (isLeader) {
          if (split.status === "PENDING" || split.status === "REJECTED") {
            othersOweYou += splitAmount;
          } else if (split.status === "PAYMENT_SUBMITTED") {
            othersOweYou += splitAmount;
            reviewCount++;
          }
        }
      });
    });

    // Sort recent expenses by created_at descending
    const sorted = [...allExpenses].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return {
      totalYouOwe: youOwe,
      totalOthersOweYou: othersOweYou,
      pendingPaymentsCount: pendingCount,
      reviewPendingCount: reviewCount,
      recentExpenses: sorted.slice(0, 5),
    };
  }, [allExpenses, user?.id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header Profile Section */}
        <View style={styles.headerRow}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name || "Friend"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.8}
          >
            <Avatar name={user?.name || "User"} imageUrl={user?.profile_image} size={48} />
          </TouchableOpacity>
        </View>

        {/* Balance Overview Cards */}
        <View style={styles.balanceContainer}>
          <View style={[styles.balanceCard, styles.oweCard]}>
            <View style={styles.balanceCardHeader}>
              <Ionicons name="arrow-up-circle-outline" size={20} color={colors.danger} />
              <Text style={styles.balanceLabel}>You Owe</Text>
            </View>
            <Text style={[styles.balanceValue, { color: colors.danger }]}>
              {formatINR(totalYouOwe)}
            </Text>
            <Text style={styles.balanceSubtext}>
              {pendingPaymentsCount} pending {pendingPaymentsCount === 1 ? "payment" : "payments"}
            </Text>
          </View>

          <View style={[styles.balanceCard, styles.owedCard]}>
            <View style={styles.balanceCardHeader}>
              <Ionicons name="arrow-down-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.balanceLabel}>Owed to You</Text>
            </View>
            <Text style={[styles.balanceValue, { color: colors.primary }]}>
              {formatINR(totalOthersOweYou)}
            </Text>
            <Text style={styles.balanceSubtext}>
              {reviewPendingCount} for your review
            </Text>
          </View>
        </View>

        {/* Pending Actions Alert Banner */}
        {(pendingPaymentsCount > 0 || reviewPendingCount > 0) && (
          <View style={styles.actionBanner}>
            <Ionicons name="notifications" size={22} color={colors.warning} />
            <View style={styles.actionBannerText}>
              <Text style={styles.actionBannerTitle}>Pending Actions</Text>
              <Text style={styles.actionBannerSub}>
                {pendingPaymentsCount > 0 && reviewPendingCount > 0
                  ? `You have ${pendingPaymentsCount} bills to settle & ${reviewPendingCount} payments to review.`
                  : pendingPaymentsCount > 0
                  ? `You have ${pendingPaymentsCount} unpaid bills requiring your attention.`
                  : `You have ${reviewPendingCount} submitted payments to approve/reject.`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/expenses")}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Action Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/groups/create")}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name="add" size={22} color={colors.primary} />
            </View>
            <Text style={styles.actionButtonText}>New Group</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/groups/join")}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: colors.secondaryMuted }]}>
              <Ionicons name="enter-outline" size={22} color={colors.secondary} />
            </View>
            <Text style={styles.actionButtonText}>Join Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/expenses/create")}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
              <Ionicons name="receipt-outline" size={22} color={colors.warning} />
            </View>
            <Text style={styles.actionButtonText}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        {/* Your Groups Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Groups</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/groups")}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {loadingGroups ? (
          <LoadingState message="Loading your groups..." />
        ) : groups.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No Groups Yet"
            description="Create a group or join one using an invite code to start splitting expenses."
            actionTitle="Create Group"
            onAction={() => router.push("/groups/create")}
          />
        ) : (
          groups.slice(0, 3).map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onPress={() => router.push(`/groups/${group.id}` as any)}
            />
          ))
        )}

        {/* Recent Expenses Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/expenses")}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {loadingExpenses ? (
          <LoadingState message="Loading recent expenses..." />
        ) : recentExpenses.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No Recent Expenses"
            description="Expenses added in your groups will appear here."
            actionTitle="Add Expense"
            onAction={() => router.push("/expenses/create")}
          />
        ) : (
          recentExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onPress={() => router.push(`/expenses/${expense.id}` as any)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  userInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  greeting: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  userName: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  balanceContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  oweCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  owedCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  balanceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  balanceValue: {
    ...typography.h3,
    fontWeight: "700",
    marginVertical: 4,
  },
  balanceSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  actionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  actionBannerText: {
    flex: 1,
  },
  actionBannerTitle: {
    ...typography.body2,
    fontWeight: "700",
    color: colors.warning,
  },
  actionBannerSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actionButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  seeAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
});
