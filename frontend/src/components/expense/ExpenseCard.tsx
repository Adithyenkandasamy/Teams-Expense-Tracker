import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Expense } from "../../types/models";
import { colors, spacing, typography } from "../../theme/colors";
import {
  formatINR,
  formatDate,
  formatDeadlineStatus,
  getExpenseStatusBadge,
  getPaymentStatusBadge,
} from "../../utils/formatters";
import { Badge } from "../common/Badge";
import { useAuthStore } from "../../store/authStore";

interface ExpenseCardProps {
  expense: Expense;
  onPress: () => void;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense, onPress }) => {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const statusBadge = getExpenseStatusBadge(expense.status);
  const deadlineInfo = formatDeadlineStatus(expense.current_deadline);

  // Check if current user is the Expense Leader
  const isLeader = currentUserId === expense.created_by;

  // Find user's split if any
  const mySplit = expense.splits?.find((s) => s.user_id === currentUserId);
  const mySplitBadge = mySplit ? getPaymentStatusBadge(mySplit.status) : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <Text style={styles.description} numberOfLines={1}>
            {expense.description}
          </Text>
          <View style={styles.metaRow}>
            {expense.category && (
              <Text style={styles.category}>{expense.category}</Text>
            )}
            <Text style={styles.dateDot}>•</Text>
            <Text style={styles.date}>{formatDate(expense.created_at)}</Text>
          </View>
        </View>
        <Badge label={statusBadge.label} color={statusBadge.color} bg={statusBadge.bg} />
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.amountLabel}>Total Bill</Text>
          <Text style={styles.amount}>{formatINR(expense.amount)}</Text>
        </View>

        <View style={styles.rightInfo}>
          {isLeader ? (
            <View style={styles.leaderBadge}>
              <Ionicons name="star" size={12} color={colors.primary} />
              <Text style={styles.leaderText}>You are Expense Leader</Text>
            </View>
          ) : mySplit ? (
            <View style={styles.splitOwed}>
              <Text style={styles.splitOwedLabel}>Your Share</Text>
              <Text style={styles.splitOwedAmount}>{formatINR(mySplit.amount)}</Text>
              {mySplitBadge && (
                <View style={styles.splitBadgeWrapper}>
                  <Badge
                    label={mySplitBadge.label}
                    color={mySplitBadge.color}
                    bg={mySplitBadge.bg}
                    size="small"
                  />
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.creatorName}>
              Paid by {expense.creator?.name || "Expense Leader"}
            </Text>
          )}
        </View>
      </View>

      {/* Deadline reminder indicator */}
      {expense.status !== "CLOSED" && (
        <View style={styles.deadlineRow}>
          <Ionicons
            name="time-outline"
            size={13}
            color={deadlineInfo.isOverdue ? colors.warning : colors.textMuted}
          />
          <Text
            style={[
              styles.deadlineText,
              deadlineInfo.isOverdue && styles.deadlineToOverdue,
            ]}
          >
            {deadlineInfo.label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleArea: {
    flex: 1,
    marginRight: spacing.md,
  },
  description: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  category: {
    ...typography.caption,
    color: colors.primary,
    textTransform: "capitalize",
  },
  dateDot: {
    color: colors.textMuted,
    marginHorizontal: 4,
    fontSize: 10,
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginVertical: spacing.md,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  amountLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  amount: {
    ...typography.amount,
    color: colors.textPrimary,
    marginTop: 2,
  },
  rightInfo: {
    alignItems: "flex-end",
  },
  leaderBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  leaderText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  splitOwed: {
    alignItems: "flex-end",
  },
  splitOwedLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  splitOwedAmount: {
    ...typography.body1,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 1,
  },
  splitBadgeWrapper: {
    marginTop: 4,
  },
  creatorName: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.md,
    paddingTop: spacing.xs,
  },
  deadlineText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  deadlineToOverdue: {
    color: colors.warning,
    fontWeight: "600",
  },
});
