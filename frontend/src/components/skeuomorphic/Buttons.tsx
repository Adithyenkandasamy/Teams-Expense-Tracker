import React, { useRef } from "react";
import {
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
  Animated,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, shadows } from "../../theme/colors";

interface BaseButtonProps {
  title?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  size?: "small" | "medium" | "large";
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  size = "medium",
}: BaseButtonProps) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== "web",
      tension: 300,
      friction: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 0,
      useNativeDriver: Platform.OS !== "web",
      tension: 300,
      friction: 20,
    }).start();
  };

  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });

  const isSmall = size === "small";
  const isLarge = size === "large";

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[styles.pressableWrapper, style]}
    >
      <Animated.View
        style={[
          styles.primaryButton,
          isSmall && styles.btnSmall,
          isLarge && styles.btnLarge,
          disabled && styles.btnDisabled,
          { transform: [{ translateY }] },
        ]}
      >
        {/* Specular top bevel reflection */}
        <View style={styles.topBevel} pointerEvents="none" />

        {loading ? (
          <ActivityIndicator color={colors.textInverse} size="small" />
        ) : (
          <View style={styles.contentRow}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            {title && (
              <Text
                style={[
                  styles.primaryText,
                  isSmall && styles.textSmall,
                  isLarge && styles.textLarge,
                  disabled && styles.textDisabled,
                  textStyle,
                ]}
              >
                {title}
              </Text>
            )}
          </View>
        )}

        {/* Bottom shadow lip */}
        <View style={styles.bottomLip} pointerEvents="none" />
      </Animated.View>
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  size = "medium",
}: BaseButtonProps) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== "web",
      tension: 300,
      friction: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 0,
      useNativeDriver: Platform.OS !== "web",
      tension: 300,
      friction: 20,
    }).start();
  };

  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1.5],
  });

  const isSmall = size === "small";
  const isLarge = size === "large";

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[styles.pressableWrapper, style]}
    >
      <Animated.View
        style={[
          styles.secondaryButton,
          isSmall && styles.btnSmall,
          isLarge && styles.btnLarge,
          disabled && styles.btnDisabled,
          { transform: [{ translateY }] },
        ]}
      >
        <View style={styles.secondaryTopBevel} pointerEvents="none" />

        {loading ? (
          <ActivityIndicator color={colors.textPrimary} size="small" />
        ) : (
          <View style={styles.contentRow}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            {title && (
              <Text
                style={[
                  styles.secondaryText,
                  isSmall && styles.textSmall,
                  isLarge && styles.textLarge,
                  textStyle,
                ]}
              >
                {title}
              </Text>
            )}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  disabled = false,
  size = 40,
  style,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: Platform.OS !== "web", tension: 300, friction: 20 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 0, useNativeDriver: Platform.OS !== "web", tension: 300, friction: 20 }).start();
  };

  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1.5],
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      style={style}
    >
      <Animated.View
        style={[
          styles.iconBtn,
          { width: size, height: size, borderRadius: size / 2 },
          disabled && styles.btnDisabled,
          { transform: [{ translateY }] },
        ]}
      >
        <View style={styles.iconTopBevel} pointerEvents="none" />
        <Ionicons name={icon} size={Math.round(size * 0.52)} color={colors.textPrimary} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressableWrapper: {
    width: "100%",
  },
  primaryButton: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    borderTopColor: colors.buttonBevelTop,
    borderBottomWidth: 2.5,
    borderBottomColor: colors.buttonBevelBottom,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 3px 8px rgba(35, 122, 87, 0.28), 0 1px 2px rgba(35, 122, 87, 0.20)",
        }
      : {}),
  },
  secondaryButton: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomWidth: 2,
    borderBottomColor: colors.cardBottomBorder,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    ...shadows.sm,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 2px 6px rgba(32, 41, 35, 0.06), 0 1px 2px rgba(32, 41, 35, 0.04)",
        }
      : {}),
  },
  btnSmall: {
    height: 38,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
  },
  btnLarge: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: spacing.xl,
  },
  btnDisabled: {
    opacity: 0.5,
    borderBottomWidth: 1,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textInverse,
    letterSpacing: -0.2,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  textSmall: {
    fontSize: 13,
  },
  textLarge: {
    fontSize: 17,
  },
  textDisabled: {
    color: colors.textInverse,
  },
  topBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.buttonBevelTop,
  },
  bottomLip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  secondaryTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cardTopHighlight,
  },
  iconBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomWidth: 2,
    borderBottomColor: colors.cardBottomBorder,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...shadows.sm,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 2px 6px rgba(32, 41, 35, 0.06)",
        }
      : {}),
  },
  iconTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cardTopHighlight,
  },
});

