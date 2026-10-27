import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View, Animated, Easing } from "react-native";
import { MonthlySpendingBucket } from "../../types/models";
import { formatINR } from "../../utils/formatters";
import { colors, spacing } from "../../theme/colors";

interface Props {
  months: MonthlySpendingBucket[];
  compact?: boolean;
}

function shortMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", { month: "short" });
}

function BarColumn({
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
  const personal = Number(item.personal_total) || 0;
  const group = Number(item.your_group_share) || 0;
  const total = personal + group;
  const targetHeight = Math.max(4, (total / max) * (compact ? 72 : 142));
  const groupHeight = total > 0 ? (group / total) * targetHeight : 0;

  useEffect(() => {
    anim.setValue(0);
    const animation = Animated.timing(anim, {
      toValue: targetHeight,
      duration: 520,
      delay: index * 40,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [anim, index, targetHeight]);

  const animatedHeight = anim.interpolate({
    inputRange: [0, targetHeight || 1],
    outputRange: [2, targetHeight],
  });

  return (
    <View style={styles.barColumn}>
      {!compact && <Text style={styles.barValue}>{formatINR(total)}</Text>}
      <Animated.View style={[styles.bar, compact && styles.barCompact, { height: animatedHeight }]}>
        <View style={[styles.groupSegment, { height: groupHeight }]} />
        <View style={[styles.personalSegment, { height: Math.max(2, targetHeight - groupHeight) }]} />
      </Animated.View>
      <Text style={styles.month}>{shortMonth(item.month)}</Text>
    </View>
  );
}

export function MonthlyBarChart({ months, compact = false }: Props) {
  const max = Math.max(
    1,
    ...months.map((item) => Number(item.personal_total) + Number(item.your_group_share))
  );

  return (
    <View style={[styles.chart, compact && styles.chartCompact]}>
      <View style={[styles.bars, compact && styles.barsCompact]}>
        {months.map((item, index) => (
          <BarColumn
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
            <View style={styles.personalDot} />
            <Text style={styles.legendText}>Personal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.groupDot} />
            <Text style={styles.legendText}>Your group share</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { padding: spacing.lg, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceBorder },
  chartCompact: { padding: spacing.md, borderRadius: 14 },
  bars: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", minHeight: 168, gap: spacing.sm },
  barsCompact: { minHeight: 88 },
  barColumn: { flex: 1, alignItems: "center", justifyContent: "flex-end", minWidth: 28 },
  barValue: { fontSize: 9, color: colors.textMuted, marginBottom: 5 },
  bar: { width: "60%", minWidth: 10, maxWidth: 26, overflow: "hidden", justifyContent: "flex-end", borderRadius: 7, backgroundColor: colors.surfaceElevated },
  barCompact: { maxWidth: 20, borderRadius: 5 },
  groupSegment: { width: "100%", backgroundColor: colors.info },
  personalSegment: { width: "100%", backgroundColor: colors.primary },
  month: { color: colors.textMuted, fontSize: 10, marginTop: 7 },
  legend: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.md },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  personalDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  groupDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.info },
  legendText: { color: colors.textSecondary, fontSize: 11 },
});
