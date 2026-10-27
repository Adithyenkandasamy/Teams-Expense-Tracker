import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Expense } from "../../types/models";
import { formatINR } from "../../utils/formatters";
import { colors, spacing, typography, shadows } from "../../theme/colors";
import { RaisedIconContainer } from "./RaisedIconContainer";
import { CATEGORY_ICONS } from "./CategoryButton";
import { AnimatedPressable } from "../animated";

interface Props {
  expense: Expense;
  onPress: () => void;
  currentUserId?: string;
  groupName?: string;
}

export function TransactionRow({
  expense,
  onPress,
  currentUserId,
  groupName,
}: Props) {
  const cat = expense.category || "Other";
  const iconName = CATEGORY_ICONS[cat] || "receipt-outline";
  const totalAmount = Number(expense.amount) || 0;

  // Find user's split share if present
  const userSplit = currentUserId
    ? expense.splits?.find((s) => s.user_id === currentUserId)
    : undefined;
  const userShare = userSplit ? Number(userSplit.amount) : undefined;

  const dateStr = expense.created_at
    ? new Date(expense.created_at).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.98} style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.topBevel} pointerEvents="none" />

        {/* Category Icon */}
        <RaisedIconContainer size={42} variant="raised">
          <Ionicons name={iconName} size={20} color={colors.primary} />
        </RaisedIconContainer>

        {/* Details */}
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={1}>
            {expense.description}
          </Text>
          <View style={styles.metaRow}>
            {groupName ? (
              <View style={styles.groupBadge}>
                <Text style={styles.groupBadgeText} numberOfLines={1}>
                  {groupName}
                </Text>
              </View>
            ) : null}
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
        </View>

        {/* Financial amounts */}
        <View style={styles.amountCol}>
          <Text style={styles.totalAmount}>{formatINR(totalAmount)}</Text>
          {userShare !== undefined && userShare > 0 ? (
            <Text style={styles.shareText}>
              Share: {formatINR(userShare)}
            </Text>
          ) : (
            <Text style={styles.categoryText}>{expense.category}</Text>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: spacing.xs + 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
    position: "relative",
    overflow: "hidden",
    ...shadows.sm,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 1px 4px rgba(32, 41, 35, 0.04)",
        }
      : {}),
  },
  topBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cardTopHighlight,
  },
  details: {
    flex: 1,
  },
  title: {
    ...typography.body1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  groupBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    maxWidth: 110,
  },
  groupBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  amountCol: {
    alignItems: "flex-end",
  },
  totalAmount: {
    ...typography.body1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  shareText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
    fontSize: 11,
    marginTop: 2,
  },
  categoryText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
