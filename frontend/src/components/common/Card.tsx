import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors, spacing, shadows } from "../../theme/colors";
import { AnimatedPressable } from "../animated/AnimatedPressable";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <AnimatedPressable
        scaleTo={0.98}
        onPress={onPress}
        style={[styles.card, style]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
});
