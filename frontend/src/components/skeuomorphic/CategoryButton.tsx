import React from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, shadows } from "../../theme/colors";

export const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "Food & Drinks": "fast-food-outline",
  Groceries: "cart-outline",
  Rent: "home-outline",
  Utilities: "flash-outline",
  Travel: "airplane-outline",
  Entertainment: "film-outline",
  Other: "pricetag-outline",
};

interface Props {
  category: string;
  selected: boolean;
  onPress: () => void;
  size?: "default" | "compact";
}

export function CategoryButton({
  category,
  selected,
  onPress,
  size = "default",
}: Props) {
  const iconName = CATEGORY_ICONS[category] || "pricetag-outline";
  const isCompact = size === "compact";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.chip,
        isCompact && styles.chipCompact,
        selected ? styles.chipSelected : styles.chipUnselected,
      ]}
    >
      {selected && <View style={styles.selectedInsetTop} pointerEvents="none" />}
      {!selected && <View style={styles.unselectedTopBevel} pointerEvents="none" />}

      <Ionicons
        name={iconName}
        size={isCompact ? 14 : 16}
        color={selected ? colors.primary : colors.textSecondary}
      />
      <Text
        style={[
          styles.label,
          isCompact && styles.labelCompact,
          selected ? styles.labelSelected : styles.labelUnselected,
        ]}
      >
        {category}
      </Text>
      {selected && (
        <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
  },
  chipCompact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  chipUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    ...shadows.sm,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 1px 3px rgba(32, 41, 35, 0.05)",
        }
      : {}),
  },
  chipSelected: {
    backgroundColor: colors.recessedBg,
    borderColor: colors.primary,
    borderTopColor: colors.recessedTopBorder,
    borderBottomColor: colors.recessedBottomHighlight,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "inset 0 1px 3px rgba(35, 122, 87, 0.15)",
        }
      : {}),
  },
  unselectedTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cardTopHighlight,
  },
  selectedInsetTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.recessedTopBorder,
    opacity: 0.6,
  },
  label: {
    ...typography.body2,
    fontSize: 13,
    fontWeight: "600",
  },
  labelCompact: {
    fontSize: 11,
  },
  labelUnselected: {
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
});

