import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SavingsTarget } from "../../types/models";
import { formatINR } from "../../utils/formatters";
import { formatDate } from "../../utils/formatters";
import { colors, spacing, typography, shadows } from "../../theme/colors";
import { RaisedIconContainer } from "./RaisedIconContainer";
import { ProgressBar } from "./ProgressBar";

interface Props {
  target: SavingsTarget;
  onUpdateSaved: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SavingsTargetCard({
  target,
  onUpdateSaved,
  onEdit,
  onDelete,
}: Props) {
  const targetAmount = Number(target.target_amount) || 0;
  const savedAmount = Number(target.saved_amount) || 0;
  const progressPercent = Math.min(
    100,
    targetAmount > 0 ? (savedAmount / targetAmount) * 100 : 0
  );
  const isCompleted = progressPercent >= 100;

  return (
    <View style={styles.card}>
      <View style={styles.topBevel} pointerEvents="none" />

      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.iconAndTitle}>
          <RaisedIconContainer size={38} variant="raised">
            <Ionicons
              name={isCompleted ? "checkmark-circle" : "flag"}
              size={18}
              color={isCompleted ? colors.positive : colors.primary}
            />
          </RaisedIconContainer>
          <View style={styles.titleCol}>
            <Text style={styles.name} numberOfLines={1}>
              {target.name}
            </Text>
            <Text style={styles.percentText}>
              {Math.round(progressPercent)}% funded
            </Text>
          </View>
        </View>

        <View style={styles.actionIcons}>
          <TouchableOpacity
            onPress={onEdit}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Edit target"
          >
            <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Delete target"
          >
            <Ionicons name="trash-outline" size={16} color={colors.negative} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Amounts Row */}
      <View style={styles.amountsRow}>
        <View>
          <Text style={styles.amountLabel}>SAVED</Text>
          <Text style={styles.savedValue}>{formatINR(savedAmount)}</Text>
        </View>

        <View style={styles.targetCol}>
          <Text style={styles.amountLabel}>TARGET</Text>
          <Text style={styles.targetValue}>{formatINR(targetAmount)}</Text>
        </View>
      </View>

      {/* Tactile Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={progressPercent}
          height={10}
          color={isCompleted ? colors.positive : colors.primary}
        />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.remainingText}>
          {isCompleted ? "Goal achieved" : `${formatINR(Math.max(targetAmount - savedAmount, 0))} remaining`}
        </Text>
        {target.target_date ? (
          <Text style={styles.dateText}>By {formatDate(target.target_date)}</Text>
        ) : null}
      </View>
      <Text style={styles.modeText}>
        {target.funding_mode === "WALLET" ? "Wallet-linked" : "Manual tracking"}
      </Text>

      {/* Bottom Update Action */}
      <View style={styles.bottomRow}>
        <TouchableOpacity
          onPress={onUpdateSaved}
          activeOpacity={0.8}
          style={styles.updateBtn}
        >
          <Ionicons name="add-circle-outline" size={15} color={colors.primary} />
          <Text style={styles.updateBtnText}>Add Amount</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    padding: spacing.md + 2,
    marginBottom: spacing.md,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 3px 10px rgba(32, 41, 35, 0.06), 0 1px 2px rgba(32, 41, 35, 0.04)",
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
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  iconAndTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    flex: 1,
  },
  titleCol: {
    flex: 1,
  },
  name: {
    ...typography.h3,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  percentText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  actionIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  amountsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  amountLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  savedValue: {
    ...typography.amount,
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  targetCol: {
    alignItems: "flex-end",
  },
  targetValue: {
    ...typography.body1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  progressContainer: {
    marginVertical: spacing.sm,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  remainingText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  dateText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  modeText: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  updateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.recessedBg,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.recessedTopBorder,
  },
  updateBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
});
