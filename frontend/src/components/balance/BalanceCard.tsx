import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BalanceEntry } from "../../types/models";
import { colors, spacing, typography } from "../../theme/colors";
import { formatINR } from "../../utils/formatters";

interface BalanceCardProps {
  balance: BalanceEntry;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ balance }) => {
  const rawAmount = typeof balance.amount === "string" ? parseFloat(balance.amount) : balance.amount;
  // If amount > 0: that person owes you money (+ balance)
  // If amount < 0: you owe that person money (- balance)
  const owesYou = rawAmount > 0;
  const isSettled = rawAmount === 0;

  return (
    <View style={styles.card}>
      <View style={styles.leftRow}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isSettled
                ? colors.surfaceBorder
                : owesYou
                ? colors.primaryMuted
                : colors.dangerBg,
            },
          ]}
        >
          <Ionicons
            name={
              isSettled
                ? "checkmark-circle-outline"
                : owesYou
                ? "arrow-down-outline"
                : "arrow-up-outline"
            }
            size={22}
            color={
              isSettled
                ? colors.textMuted
                : owesYou
                ? colors.primary
                : colors.danger
            }
          />
        </View>

        <View style={styles.infoArea}>
          <Text style={styles.userName} numberOfLines={1}>
            {balance.user_name}
          </Text>
          <Text style={styles.relationText}>
            {isSettled
              ? "All settled up"
              : owesYou
              ? "Owes you"
              : "You owe"}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.amount,
          {
            color: isSettled
              ? colors.textMuted
              : owesYou
              ? colors.primary
              : colors.danger,
          },
        ]}
      >
        {isSettled ? "₹0.00" : formatINR(Math.abs(rawAmount))}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  infoArea: {
    flex: 1,
  },
  userName: {
    ...typography.body1,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  relationText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  amount: {
    ...typography.body1,
    fontWeight: "700",
  },
});
