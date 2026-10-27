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
import { colors, spacing, typography } from "../../src/theme/colors";
import { Avatar } from "../../src/components/common/Avatar";
import { FadeInView, AnimatedPressable } from "../../src/components/animated";
import {
  SpendingSummaryCard,
  BalanceCard,
  GroupCard,
  TransactionRow,
  RaisedIconContainer,
  EmptyState,
  LoadingSkeleton,
} from "../../src/components/skeuomorphic";

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

  // Map of group IDs to names
  const groupMap = useMemo(() => {
    const map = new Map<string, string>();
    groups.forEach((g) => map.set(g.id, g.name));
    return map;
  }, [groups]);

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
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => router.push("/(tabs)/notifications")}
                accessibilityLabel="Notifications"
                activeOpacity={0.8}
              >
                <RaisedIconContainer size={42} variant="raised">
                  <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
                  {unreadCount > 0 && <View style={styles.notificationDot} />}
                </RaisedIconContainer>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/(tabs)/profile")}
                activeOpacity={0.8}
              >
                <Avatar name={user?.name || "User"} imageUrl={user?.profile_image} size={42} />
              </TouchableOpacity>
            </View>
          </View>
        </FadeInView>

        {/* Skeuomorphic Monthly Spending Summary Card */}
        <FadeInView delay={50} style={styles.spendingSection}>
          <SpendingSummaryCard
            months={spendingMonths}
            onPressStats={() => router.push("/(tabs)/stats")}
          />
        </FadeInView>

        {/* Balance Overview Cards */}
        <FadeInView delay={100}>
          <View style={styles.balanceContainer}>
            <BalanceCard
              type="owe"
              amount={totalYouOwe}
              count={pendingPaymentsCount}
              onPress={() => router.push("/(tabs)/expenses")}
            />
            <BalanceCard
              type="owed"
              amount={totalOthersOweYou}
              count={reviewPendingCount}
              onPress={() => router.push("/(tabs)/expenses")}
            />
          </View>
        </FadeInView>

        {/* Pending Actions Alert Banner if any */}
        {(pendingPaymentsCount > 0 || reviewPendingCount > 0) && (
          <FadeInView delay={140}>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/expenses")}
              activeOpacity={0.9}
              style={styles.actionBanner}
            >
              <View style={styles.actionBannerTop} pointerEvents="none" />
              <Ionicons name="alert-circle" size={22} color={colors.warning} />
              <View style={styles.actionBannerText}>
                <Text style={styles.actionBannerTitle}>Pending Settlements</Text>
                <Text style={styles.actionBannerSub}>
                  {pendingPaymentsCount > 0 && reviewPendingCount > 0
                    ? `You have ${pendingPaymentsCount} bills to settle & ${reviewPendingCount} payments to review.`
                    : pendingPaymentsCount > 0
                    ? `You have ${pendingPaymentsCount} unpaid bills requiring your attention.`
                    : `You have ${reviewPendingCount} submitted payments to approve or reject.`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </FadeInView>
        )}

        {/* Quick Action Buttons */}
        <FadeInView delay={180}>
          <View style={styles.quickActions}>
            <AnimatedPressable
              style={styles.actionButton}
              onPress={() => router.push("/groups/create")}
              scaleTo={0.94}
            >
              <RaisedIconContainer size={48} variant="raised">
                <Ionicons name="add" size={24} color={colors.primary} />
              </RaisedIconContainer>
              <Text style={styles.actionButtonText}>New Group</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={styles.actionButton}
              onPress={() => router.push("/groups/join")}
              scaleTo={0.94}
            >
              <RaisedIconContainer size={48} variant="raised">
                <Ionicons name="enter-outline" size={22} color={colors.primary} />
              </RaisedIconContainer>
              <Text style={styles.actionButtonText}>Join Code</Text>
            </AnimatedPressable>

            <AnimatedPressable
              style={styles.actionButton}
              onPress={() => router.push("/expenses/create")}
              scaleTo={0.94}
            >
              <RaisedIconContainer size={48} variant="raised">
                <Ionicons name="receipt-outline" size={22} color={colors.primary} />
              </RaisedIconContainer>
              <Text style={styles.actionButtonText}>Add Expense</Text>
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Your Groups Section */}
        <FadeInView delay={220}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Groups</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/groups")}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {loadingGroups ? (
            <LoadingSkeleton count={2} />
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
            <Text style={styles.sectionTitle}>Recent Group Expenses</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/expenses")}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {loadingExpenses ? (
            <LoadingSkeleton count={3} />
          ) : recentExpenses.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No Recent Expenses"
              description="Expenses added across your groups will appear here."
              actionTitle="Add Expense"
              onAction={() => router.push("/expenses/create")}
            />
          ) : (
            recentExpenses.map((expense) => (
              <TransactionRow
                key={expense.id}
                expense={expense}
                groupName={groupMap.get(expense.group_id)}
                currentUserId={user?.id}
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
    marginBottom: spacing.lg,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.md,
  },
  greeting: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  userName: {
    ...typography.h2,
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  notificationButton: {
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  spendingSection: {
    marginBottom: spacing.md,
  },
  balanceContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warning,
    borderLeftWidth: 4,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    position: "relative",
    overflow: "hidden",
  },
  actionBannerTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cardTopHighlight,
  },
  actionBannerText: {
    flex: 1,
  },
  actionBannerTitle: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  actionBannerSub: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    flex: 1,
  },
  actionButtonText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  seeAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
});
