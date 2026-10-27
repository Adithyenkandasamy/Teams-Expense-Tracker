import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/store/authStore";
import { getGroups } from "../../src/api/groups";
import { getMyExpenses } from "../../src/api/expenses";
import { getMonthlySpending } from "../../src/api/analytics";
import { useNotificationStore } from "../../src/store/notificationStore";
import { colors, spacing, typography, shadows } from "../../src/theme/colors";
import { formatINR } from "../../src/utils/formatters";
import { Avatar } from "../../src/components/common/Avatar";
import { ExpenseCard } from "../../src/components/expense/ExpenseCard";
import { GroupCard } from "../../src/components/group/GroupCard";
import { LoadingState } from "../../src/components/common/LoadingState";
import { EmptyState } from "../../src/components/common/EmptyState";
import { FadeInView, AnimatedPressable } from "../../src/components/animated";
import { MonthlyBarChart } from "../../src/components/analytics/MonthlyBarChart";

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  // Fetch groups
  const {
    data: groups = [],
    isLoading: loadingGroups,
    refetch: refetchGroups,
  } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
  });

  // Fetch expenses across all groups in one request
  const {
    data: allExpenses = [],
    isLoading: loadingExpenses,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: ["allExpenses"],
    queryFn: getMyExpenses,
    enabled: !!user,
  });

  const isRefreshing = loadingGroups || loadingExpenses;
  const { data: spending, refetch: refetchSpending } = useQuery({
    queryKey: ["monthlySpending", 6],
    queryFn: () => getMonthlySpending(6),
    enabled: !!user,
  });

  const handleRefresh = () => {
    refetchGroups();
    refetchExpenses();
    refetchSpending();
  };

  const fallbackSpendingMonths = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return { month: key, personal_total: 0, group_total: 0, your_group_share: 0 };
    });
    const monthIndex = new Map(months.map((bucket, index) => [bucket.month, index]));
    allExpenses.forEach((expense) => {
      const date = new Date(expense.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const index = monthIndex.get(key);
      if (index === undefined) return;
      const bucket = months[index];
      bucket.group_total += Number(expense.amount) || 0;
      bucket.your_group_share += expense.splits
        ?.filter((split) => split.user_id === user?.id)
        .reduce((sum, split) => sum + (Number(split.amount) || 0), 0) || 0;
    });
    return months;
  }, [allExpenses, user?.id]);
  const spendingMonths = spending?.months ?? fallbackSpendingMonths;

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
        <FadeInView delay={0}>
          <View style={styles.headerRow}>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || "Friend"}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.notificationButton} onPress={() => router.push("/(tabs)/notifications")} accessibilityLabel="Notifications">
                <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
                {unreadCount > 0 && <View style={styles.notificationDot} />}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.8}>
                <Avatar name={user?.name || "User"} imageUrl={user?.profile_image} size={44} />
              </TouchableOpacity>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={80} style={styles.spendingSection}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/(tabs)/stats")}>
            <View style={styles.spendingHeader}>
              <View>
                <Text style={styles.spendingTitle}>Monthly spending</Text>
                <Text style={styles.spendingSubtitle}>Personal and your group share</Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />
            </View>
            {spendingMonths.some((month) => Number(month.group_total) > 0 || Number(month.personal_total) > 0) ? <MonthlyBarChart months={spendingMonths} compact /> : (
              <View style={styles.spendingEmpty}><Text style={styles.spendingEmptyText}>Add expenses to see your monthly trend.</Text></View>
            )}
          </TouchableOpacity>
        </FadeInView>

        {/* Balance Overview Cards */}
        <FadeInView delay={60}>
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
                <Ionicons name="arrow-down-circle-outline" size={20} color={colors.status.paid} />
                <Text style={styles.balanceLabel}>Owed to You</Text>
              </View>
              <Text style={[styles.balanceValue, { color: colors.status.paid }]}>
                {formatINR(totalOthersOweYou)}
              </Text>
              <Text style={styles.balanceSubtext}>
                {reviewPendingCount} for your review
              </Text>
            </View>
          </View>
        </FadeInView>

        {/* Pending Actions Alert Banner */}
        {(pendingPaymentsCount > 0 || reviewPendingCount > 0) && (
          <FadeInView delay={100}>
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
          </FadeInView>
        )}

        {/* Quick Action Buttons */}
        <FadeInView delay={140}>
          <View style={styles.quickActions}>
            <AnimatedPressable
              style={styles.actionButton}
              onPress={() => router.push("/groups/create")}
              scaleTo={0.94}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="add" size={22} color={colors.primary} />
              </View>
              <Text style={styles.actionButtonText}>New Group</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={styles.actionButton}
              onPress={() => router.push("/groups/join")}
              scaleTo={0.94}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="enter-outline" size={22} color={colors.primary} />
              </View>
              <Text style={styles.actionButtonText}>Join Code</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={styles.actionButton}
              onPress={() => router.push("/expenses/create")}
              scaleTo={0.94}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                <Ionicons name="receipt-outline" size={22} color={colors.warning} />
              </View>
              <Text style={styles.actionButtonText}>Add Expense</Text>
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Your Groups Section */}
        <FadeInView delay={200}>
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
        </FadeInView>

        {/* Recent Expenses Section */}
        <FadeInView delay={260}>
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
        </FadeInView>
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
    minWidth: 0,
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.md, flexShrink: 0 },
  notificationButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
  notificationDot: { position: "absolute", top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, borderWidth: 1, borderColor: colors.surface },
  spendingHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  spendingTitle: { ...typography.h3, color: colors.textPrimary },
  spendingSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  spendingEmpty: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.surfaceBorder, padding: spacing.lg },
  spendingEmptyText: { ...typography.caption, color: colors.textSecondary },
  spendingSection: { marginBottom: spacing.lg },
  balanceContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  oweCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  owedCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.status.paid,
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
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceValue: {
    ...typography.amount,
    fontSize: 22,
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
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  actionBannerText: {
    flex: 1,
  },
  actionBannerTitle: {
    ...typography.body2,
    fontWeight: "600",
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
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  actionIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  actionButtonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "500",
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
    color: colors.textSecondary,
    fontWeight: "500",
  },
});
