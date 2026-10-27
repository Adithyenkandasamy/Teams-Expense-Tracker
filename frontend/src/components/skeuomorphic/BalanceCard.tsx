import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatINR } from "../../utils/formatters";
import { colors, spacing, typography, shadows } from "../../theme/colors";

interface Props {
  type: "owe" | "owed";
  amount: number;
  count: number;
  onPress: () => void;
}

export function BalanceCard({ type, amount, count, onPress }: Props) {
  const isOwe = type === "owe";
  const statusColor = isOwe ? colors.negative : colors.positive;
  const label = isOwe ? "YOU OWE" : "OWED TO YOU";
  const iconName = isOwe ? "arrow-up-circle-outline" : "arrow-down-circle-outline";
  const countLabel = isOwe
    ? `${count} pending ${count === 1 ? "payment" : "payments"}`
    : `${count} for your review`;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        styles.card,
        isOwe ? styles.oweBorder : styles.owedBorder,
      ]}
    >
      <View style={styles.topBevel} pointerEvents="none" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name={iconName} size={16} color={statusColor} />
          <Text style={[styles.label, { color: statusColor }]}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </View>

      <Text style={[styles.amount, { color: statusColor }]} numberOfLines={1}>
        {formatINR(amount)}
      </Text>

      <Text style={styles.countText}>{countLabel}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    padding: spacing.md,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 3px 10px rgba(32, 41, 35, 0.06), 0 1px 2px rgba(32, 41, 35, 0.04)",
        }
      : {}),
  },
  oweBorder: {
    borderLeftWidth: 3.5,
    borderLeftColor: colors.negative,
  },
  owedBorder: {
    borderLeftWidth: 3.5,
    borderLeftColor: colors.positive,
  },
  topBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cardTopHighlight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  label: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  amount: {
    ...typography.h2,
    fontSize: 20,
    fontWeight: "800",
    marginVertical: 2,
    letterSpacing: -0.3,
  },
  countText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },
});

