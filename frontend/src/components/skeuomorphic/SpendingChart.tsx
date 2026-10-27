import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Platform,
} from "react-native";
import { MonthlySpendingBucket } from "../../types/models";
import { formatINR } from "../../utils/formatters";
import { colors, spacing, typography, shadows } from "../../theme/colors";

interface Props {
  months: MonthlySpendingBucket[];
  compact?: boolean;
}

function shortMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "short" });
}

function DimensionalBarItem({
  item,
  max,
  compact,
  index,
}: {
  item: MonthlySpendingBucket;
  max: number;
  compact: boolean;
  index: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 40,
      tension: 65,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [anim, index]);

  const personal = Number(item.personal_total) || 0;
  const groupShare = Number(item.your_group_share) || 0;
  const total = personal + groupShare;
  const maxBarHeight = compact ? 68 : 130;
  const targetHeight = Math.max(4, (total / max) * maxBarHeight);
  const groupHeight = total > 0 ? (groupShare / total) * targetHeight : 0;
  const personalHeight = Math.max(2, targetHeight - groupHeight);

  const animatedHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, targetHeight],
  });

  return (
    <View style={styles.barColumn}>
      {!compact && (
        <Text style={styles.barValue} numberOfLines={1}>
          {total > 0 ? formatINR(total) : ""}
        </Text>
      )}

      {/* Dimensional bar cylinder */}
      <Animated.View
        style={[
          styles.bar,
          compact && styles.barCompact,
          { height: animatedHeight },
        ]}
      >
        {/* Specular gloss cap at top of column */}
        <View style={styles.topGlossCap} pointerEvents="none" />

        {/* Group share segment (top) */}
        {groupShare > 0 && (
          <View style={[styles.groupSegment, { height: groupHeight }]}>
            <View style={styles.segmentHighlight} pointerEvents="none" />
          </View>
        )}

        {/* Personal segment (bottom) */}
        <View style={[styles.personalSegment, { height: personalHeight }]}>
          <View style={styles.segmentHighlight} pointerEvents="none" />
        </View>
      </Animated.View>

      <Text style={[styles.monthLabel, compact && styles.monthLabelCompact]}>
        {shortMonth(item.month)}
      </Text>
    </View>
  );
}

export function SpendingChart({ months, compact = false }: Props) {
  const max = Math.max(
    1,
    ...months.map((item) => Number(item.personal_total) + Number(item.your_group_share))
  );

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Background horizontal guideline lines */}
      <View style={styles.gridLines} pointerEvents="none">
        <View style={styles.gridLine} />
        <View style={styles.gridLine} />
        <View style={styles.gridLine} />
      </View>

      <View style={[styles.barsRow, compact && styles.barsRowCompact]}>
        {months.map((item, index) => (
          <DimensionalBarItem
            key={item.month}
            item={item}
            max={max}
            compact={compact}
            index={index}
          />
        ))}
      </View>

      {!compact && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>Personal Expenses</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
            <Text style={styles.legendText}>Your Group Share</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    position: "relative",
    overflow: "hidden",
    ...shadows.sm,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "inset 0 1px 3px rgba(32, 41, 35, 0.04)",
        }
      : {}),
  },
  containerCompact: {
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  gridLines: {
    position: "absolute",
    top: 24,
    left: spacing.md,
    right: spacing.md,
    bottom: 36,
    justifyContent: "space-between",
  },
  gridLine: {
    height: 1,
    backgroundColor: colors.borderLight,
    opacity: 0.6,
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 160,
    gap: spacing.xs,
  },
  barsRowCompact: {
    minHeight: 88,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 28,
  },
  barValue: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
  },
  bar: {
    width: "65%",
    minWidth: 12,
    maxWidth: 24,
    borderRadius: 6,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: colors.recessedBg,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    position: "relative",
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 2px 4px rgba(32, 41, 35, 0.08)",
        }
      : {}),
  },
  barCompact: {
    maxWidth: 18,
    borderRadius: 5,
  },
  topGlossCap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    zIndex: 2,
  },
  groupSegment: {
    width: "100%",
    backgroundColor: colors.secondary,
    position: "relative",
  },
  personalSegment: {
    width: "100%",
    backgroundColor: colors.primary,
    position: "relative",
  },
  segmentHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRightWidth: 1,
    borderRightColor: "rgba(0, 0, 0, 0.08)",
  },
  monthLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "600",
    color: colors.textMuted,
    marginTop: 6,
    textTransform: "uppercase",
  },
  monthLabelCompact: {
    fontSize: 9,
    marginTop: 4,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "500",
  },
});

