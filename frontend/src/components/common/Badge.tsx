import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { spacing } from "../../theme/colors";

interface BadgeProps {
  label: string;
  color: string;
  backgroundColor: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color,
  backgroundColor,
  style,
  textStyle,
  size = "md",
}) => {
  const isSm = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
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
    borderRadius: 20,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
