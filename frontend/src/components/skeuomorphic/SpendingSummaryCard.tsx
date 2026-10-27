import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MonthlySpendingBucket } from "../../types/models";
import { formatINR } from "../../utils/formatters";
import { colors, spacing, typography, shadows } from "../../theme/colors";
import { SpendingChart } from "./SpendingChart";

interface Props {
  months: MonthlySpendingBucket[];
  onPressStats: () => void;
}

export function SpendingSummaryCard({ months, onPressStats }: Props) {
  // Current month is the last item in the 6-month array
  const currentMonthData = months[months.length - 1] || {
    month: "",
    personal_total: 0,
    your_group_share: 0,
    group_total: 0,
  };

  const personalTotal = Number(currentMonthData.personal_total) || 0;
  const groupShareTotal = Number(currentMonthData.your_group_share) || 0;
  const combinedTotal = personalTotal + groupShareTotal;

  const hasData = months.some(
    (m) => Number(m.personal_total) > 0 || Number(m.your_group_share) > 0
  );

  return (
    <View style={styles.card}>
      {/* Specular top highlight bevel */}
      <View style={styles.topBevel} pointerEvents="none" />

      {/* Header bar */}
      <View style={styles.headerRow}>
        <View style={styles.headerBadge}>
          <Ionicons name="journal-outline" size={13} color={colors.primary} />
          <Text style={styles.headerBadgeText}>MONTHLY LEDGER</Text>
        </View>

        <TouchableOpacity
          onPress={onPressStats}
          style={styles.statsLink}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.statsLinkText}>View Stats</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Main spending total */}
      <View style={styles.mainAmountRow}>
        <Text style={styles.mainAmount}>{formatINR(combinedTotal)}</Text>
        <Text style={styles.mainSubtitle}>
          Tracked spending this month
        </Text>
      </View>

      {/* Breakdown Pills: Personal vs Group Share */}
      <View style={styles.breakdownRow}>
        <View style={styles.breakdownPill}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <Text style={styles.pillLabel}>Personal:</Text>
          <Text style={styles.pillValue}>{formatINR(personalTotal)}</Text>
        </View>

        <View style={styles.breakdownPill}>
          <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
          <Text style={styles.pillLabel}>Group Share:</Text>
          <Text style={styles.pillValue}>{formatINR(groupShareTotal)}</Text>
        </View>
      </View>

      {/* Compact Chart or Empty state */}
      <View style={styles.chartSection}>
        {hasData ? (
          <SpendingChart months={months} compact />
        ) : (
          <View style={styles.chartEmpty}>
            <Ionicons name="bar-chart-outline" size={24} color={colors.textMuted} />
            <Text style={styles.emptyText}>Add expenses to see your 6-month spending trend.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    padding: spacing.lg,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 6px 18px rgba(32, 41, 35, 0.08), 0 1px 3px rgba(32, 41, 35, 0.05)",
        }
      : {}),
  },
  topBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.cardTopHighlight,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.recessedBg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.recessedTopBorder,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  headerBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.6,
  },
  statsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statsLinkText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
    fontSize: 12,
  },
  mainAmountRow: {
    marginVertical: spacing.xs,
  },
  mainAmount: {
    ...typography.amount,
    fontSize: 32,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  breakdownRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  breakdownPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
  pillValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 12,
  },
  chartSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  chartEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
});

