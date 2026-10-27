import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from "react-native";
import { colors, shadows } from "../../theme/colors";
import { AnimatedPressable } from "../animated";

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
  onPress?: () => void;
  accent?: boolean;
}

export function RaisedCard({
  children,
  style,
  interactive = false,
  onPress,
  accent = false,
}: Props) {
  const content = (
    <View
      style={[
        styles.card,
        accent && styles.accentBorder,
        style,
      ]}
    >
      {/* Specular top highlight bevel */}
      <View style={styles.topHighlight} pointerEvents="none" />
      {children}
    </View>
  );

  if (interactive && onPress) {
    return (
      <AnimatedPressable onPress={onPress} scaleTo={0.98} style={styles.pressable}>
        {content}
      </AnimatedPressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  pressable: {
    width: "100%",
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 4px 14px rgba(32, 41, 35, 0.07), 0 1px 3px rgba(32, 41, 35, 0.04)",
          transition: "transform 150ms ease, box-shadow 150ms ease",
        }
      : {}),
  },
  accentBorder: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cardTopHighlight,
  },
});
