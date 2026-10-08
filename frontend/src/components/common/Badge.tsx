import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { spacing } from "../../theme/colors";

export type BadgeSize = "sm" | "md" | "small" | "medium";

interface BadgeProps {
  label: string;
  color: string;
  backgroundColor?: string;
  bg?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: BadgeSize;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color,
  backgroundColor,
  bg,
  style,
  textStyle,
  size = "md",
}) => {
  const isSm = size === "sm" || size === "small";
  const finalBg = bg || backgroundColor || "rgba(255, 255, 255, 0.08)";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: finalBg,
          paddingVertical: isSm ? 2 : spacing.xs,
          paddingHorizontal: isSm ? spacing.sm : spacing.md,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color,
            fontSize: isSm ? 11 : 12,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontWeight: "500",
    textTransform: "capitalize",
  },
});
