import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Group } from "../../types/models";
import { formatINR } from "../../utils/formatters";
import { colors, spacing, typography, shadows } from "../../theme/colors";
import { RaisedIconContainer } from "./RaisedIconContainer";
import { AnimatedPressable } from "../animated";

interface Props {
  group: Group;
  onPress: () => void;
  userBalance?: number;
}

export function GroupCard({ group, onPress, userBalance }: Props) {
  const memberCount = group.members?.length || 0;
  const hasBalance = userBalance !== undefined && userBalance !== 0;
  const isPositive = (userBalance || 0) > 0;

  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.98} style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.topBevel} pointerEvents="none" />

        {/* Group Icon */}
        <RaisedIconContainer size={44} variant="raised">
          <Ionicons name="people" size={22} color={colors.primary} />
        </RaisedIconContainer>

        {/* Group Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {group.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.memberBadge}>
              <Ionicons name="person-outline" size={11} color={colors.textSecondary} />
              <Text style={styles.memberText}>
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </Text>
            </View>
            {group.invite_code && (
              <Text style={styles.codeText}>Code: {group.invite_code}</Text>
            )}
          </View>
        </View>

        {/* User Balance Badge or Chevron */}
        <View style={styles.rightAction}>
          {hasBalance ? (
            <View
              style={[
                styles.balancePill,
                isPositive ? styles.balancePositive : styles.balanceNegative,
              ]}
            >
              <Text
                style={[
                  styles.balanceText,
                  { color: isPositive ? colors.positive : colors.negative },
                ]}
              >
                {isPositive ? `+${formatINR(userBalance!)}` : formatINR(userBalance!)}
              </Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    padding: spacing.md,
    gap: spacing.md,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 2px 8px rgba(32, 41, 35, 0.05), 0 1px 2px rgba(32, 41, 35, 0.03)",
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
  info: {
    flex: 1,
  },
  name: {
    ...typography.h3,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 4,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  memberText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  codeText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  rightAction: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  balancePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  balancePositive: {
    backgroundColor: "rgba(36, 134, 83, 0.10)",
    borderColor: "rgba(36, 134, 83, 0.25)",
  },
  balanceNegative: {
    backgroundColor: "rgba(198, 92, 85, 0.10)",
    borderColor: "rgba(198, 92, 85, 0.25)",
  },
  balanceText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "700",
  },
});
