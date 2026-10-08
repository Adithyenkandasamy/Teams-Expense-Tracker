import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getGroupDetail, getGroupMembers } from "../../src/api/groups";
import { getGroupExpenses } from "../../src/api/expenses";
import { getGroupBalances } from "../../src/api/balances";
import { useAuthStore } from "../../src/store/authStore";
import { colors, spacing, typography } from "../../src/theme/colors";
import { formatINR } from "../../src/utils/formatters";
import { Header } from "../../src/components/common/Header";
import { ExpenseCard } from "../../src/components/expense/ExpenseCard";
import { MemberRow } from "../../src/components/group/MemberRow";
import { LoadingState } from "../../src/components/common/LoadingState";
import { EmptyState } from "../../src/components/common/EmptyState";
import { Button } from "../../src/components/common/Button";

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);

  // Group Details
  const {
    data: group,
    isLoading: loadingGroup,
    refetch: refetchGroup,
  } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroupDetail(groupId),
    enabled: !!groupId,
  });

  // Group Members
  const {
    data: members = [],
    isLoading: loadingMembers,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ["groupMembers", groupId],
    queryFn: () => getGroupMembers(groupId),
    enabled: !!groupId,
  });

  // Group Expenses
  const {
    data: expenses = [],
    isLoading: loadingExpenses,
    refetch: refetchExpenses,
  } = useQuery({
    queryKey: ["groupExpenses", groupId],
    queryFn: () => getGroupExpenses(groupId),
    enabled: !!groupId,
  });

  // Group Balances
  const {
    data: balances,
    refetch: refetchBalances,
  } = useQuery({
    queryKey: ["groupBalances", groupId],
    queryFn: () => getGroupBalances(groupId),
    enabled: !!groupId,
  });

  const isRefreshing = loadingGroup || loadingMembers || loadingExpenses;

  const handleRefresh = () => {
    refetchGroup();
    refetchMembers();
    refetchExpenses();
    refetchBalances();
  };

  const handleShareInviteCode = async () => {
    if (!group?.invite_code) return;
    try {
      await Share.share({
        message: `Join our group "${group.name}" on Team Expense Tracker! Use invite code: ${group.invite_code}`,
      });
    } catch (error) {
      console.warn("Share error:", error);
    }
  };

  // Group Leader check (for group management options, NOT expense approvals)
  const isGroupLeader = group?.created_by === currentUserId || group?.leader_id === currentUserId;

  if (loadingGroup && !group) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Group Details" showBack onBack={() => router.back()} />
        <LoadingState message="Loading group details..." fullScreen />
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Group Not Found" showBack onBack={() => router.back()} />
        <EmptyState
          icon="alert-circle-outline"
          title="Group Not Found"
          description="Could not find the requested group. You may not be a member."
          actionTitle="Back to Groups"
          onAction={() => router.replace("/(tabs)/groups")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={group.name}
        subtitle={`${members.length} ${members.length === 1 ? "member" : "members"}`}
        showBack
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShareInviteCode}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Group Info Header */}
        <View style={styles.groupInfoCard}>
          <View style={styles.inviteCodeRow}>
            <View>
              <Text style={styles.inviteLabel}>INVITE CODE</Text>
              <Text style={styles.inviteCode}>{group.invite_code}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyCodeButton}
              onPress={handleShareInviteCode}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={16} color={colors.primary} />
              <Text style={styles.copyCodeText}>Share</Text>
            </TouchableOpacity>
          </View>

          {group.description && (
            <Text style={styles.descriptionText}>{group.description}</Text>
          )}

          {isGroupLeader && (
            <View style={styles.leaderBanner}>
              <Ionicons name="shield-checkmark" size={16} color={colors.secondary} />
              <Text style={styles.leaderBannerText}>You are the Group Leader</Text>
            </View>
          )}
        </View>

        {/* Balance Snapshot Card */}
        {balances && (
          <View style={styles.balancesCard}>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceItemLabel}>You Owe</Text>
                <Text style={[styles.balanceItemValue, { color: colors.danger }]}>
                  {formatINR(balances.total_you_owe)}
                </Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                <Text style={styles.balanceItemLabel}>Owed to You</Text>
                <Text style={[styles.balanceItemValue, { color: colors.primary }]}>
                  {formatINR(balances.total_owed_to_you)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewBalancesBtn}
              onPress={() => router.push(`/balances/${group.id}` as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.viewBalancesText}>View Detailed Balances</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <View style={styles.actionCol}>
            <Button
              title="Add Expense"
              icon={<Ionicons name="receipt-outline" size={18} color={colors.textInverse} />}
              onPress={() => router.push(`/expenses/create?groupId=${group.id}` as any)}
              variant="primary"
            />
          </View>
          <View style={styles.actionCol}>
            <Button
              title="Members"
              icon={<Ionicons name="people-outline" size={18} color={colors.textPrimary} />}
              onPress={() => router.push(`/groups/${group.id}/members` as any)}
              variant="outline"
            />
          </View>
        </View>

        {/* Expenses List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Group Expenses ({expenses.length})</Text>
          <TouchableOpacity
            onPress={() => router.push(`/groups/${group.id}/expenses` as any)}
          >
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {expenses.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No Expenses Yet"
            description="Share your first expense with roommates in this group."
            actionTitle="Add Expense"
            onAction={() => router.push(`/expenses/create?groupId=${group.id}` as any)}
          />
        ) : (
          expenses.slice(0, 5).map((exp) => (
            <ExpenseCard
              key={exp.id}
              expense={exp}
              onPress={() => router.push(`/expenses/${exp.id}` as any)}
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
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  groupInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.lg,
  },
  inviteCodeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inviteLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  inviteCode: {
    ...typography.h2,
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 2,
  },
  copyCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
  },
  copyCodeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  descriptionText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  leaderBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.secondaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  leaderBannerText: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: "600",
  },
  balancesCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.lg,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceItem: {
    flex: 1,
    alignItems: "center",
  },
  balanceDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.surfaceBorder,
  },
  balanceItemLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  balanceItemValue: {
    ...typography.h3,
    fontWeight: "700",
    marginTop: 2,
  },
  viewBalancesBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  viewBalancesText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionCol: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
