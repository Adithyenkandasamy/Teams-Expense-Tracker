import React from "react";
import { View, StyleSheet, Platform, StyleProp, ViewStyle } from "react-native";
import { colors, shadows } from "../../theme/colors";

interface Props {
  children: React.ReactNode;
  size?: number;
  variant?: "raised" | "recessed" | "tinted";
  tintColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function RaisedIconContainer({
  children,
  size = 42,
  variant = "raised",
  tintColor,
  style,
}: Props) {
  const borderRadius = Math.round(size * 0.32);

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius,
        },
        variant === "raised" && styles.raised,
        variant === "recessed" && styles.recessed,
        variant === "tinted" && {
          backgroundColor: tintColor || colors.primaryMuted,
          borderColor: colors.surfaceBorder,
        },
        style,
      ]}
    >
      {/* Top highlight specular bevel for raised variant */}
      {variant === "raised" && <View style={styles.topBevel} pointerEvents="none" />}
      {variant === "recessed" && <View style={styles.topRecessedShadow} pointerEvents="none" />}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  raised: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    ...shadows.sm,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 2px 5px rgba(32, 41, 35, 0.06), 0 1px 2px rgba(32, 41, 35, 0.04)",
        }
      : {}),
  },
  recessed: {
    backgroundColor: colors.recessedBg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.recessedTopBorder,
    borderBottomColor: colors.recessedBottomHighlight,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "inset 0 1px 3px rgba(32, 41, 35, 0.08)",
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
  topRecessedShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.recessedTopBorder,
    opacity: 0.6,
  },
});

