import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ExpenseSplit } from "../../types/models";
import { colors, spacing, typography } from "../../theme/colors";
import { formatINR, getPaymentStatusBadge } from "../../utils/formatters";
import { Avatar } from "../common/Avatar";
import { Badge } from "../common/Badge";

interface ExpenseSplitRowProps {
  split: ExpenseSplit;
  isExpenseLeader: boolean;
  isCurrentUser: boolean;
  onPay?: () => void;
  onReview?: () => void;
}

export const ExpenseSplitRow: React.FC<ExpenseSplitRowProps> = ({
  split,
  isExpenseLeader,
  isCurrentUser,
  onPay,
  onReview,
}) => {
  const badge = getPaymentStatusBadge(split.status);
  const userName = split.user?.name || "Member";
  const userEmail = split.user?.email || "";
  const profileImage = split.user?.profile_image;

  const canPay = isCurrentUser && (split.status === "PENDING" || split.status === "REJECTED");
  const canReview = isExpenseLeader && split.status === "PAYMENT_SUBMITTED";

  return (
    <View style={styles.container}>
      <View style={styles.userSection}>
        <Avatar name={userName} imageUrl={profileImage} size={42} />
        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {userName}
            </Text>
            {isCurrentUser && <Text style={styles.youTag}>(You)</Text>}
          </View>
          {userEmail ? (
            <Text style={styles.email} numberOfLines={1}>
              {userEmail}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.actionSection}>
        <Text style={styles.amount}>{formatINR(split.amount)}</Text>
        <View style={styles.badgeWrapper}>
          <Badge label={badge.label} color={badge.color} bg={badge.bg} size="small" />
        </View>

        {canPay && onPay && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={onPay}
            activeOpacity={0.8}
          >
            <Ionicons name="card-outline" size={14} color={colors.textInverse} />
            <Text style={styles.payButtonText}>Pay Now</Text>
          </TouchableOpacity>
        )}

        {canReview && onReview && (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={onReview}
            activeOpacity={0.8}
          >
            <Ionicons name="eye-outline" size={14} color={colors.primary} />
            <Text style={styles.reviewButtonText}>Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.md,
  },
  nameSection: {
    marginLeft: spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    ...typography.body1,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  youTag: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  email: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionSection: {
    alignItems: "flex-end",
  },
  amount: {
    ...typography.body1,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  badgeWrapper: {
    marginTop: 4,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  payButtonText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: "700",
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  reviewButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
});
