import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors, spacing } from "../../theme/colors";

export type ButtonSize = "sm" | "md" | "lg" | "small" | "medium" | "large";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
        };
      case "outline":
        return {
          container: styles.outlineContainer,
          text: styles.outlineText,
        };
      case "danger":
        return {
          container: styles.dangerContainer,
          text: styles.dangerText,
        };
      case "ghost":
        return {
          container: styles.ghostContainer,
          text: styles.ghostText,
        };
      case "primary":
      default:
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
      case "small":
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: 13 };
      case "lg":
      case "large":
        return { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl, fontSize: 16 };
      case "md":
      case "medium":
      default:
        return { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, fontSize: 15 };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.baseContainer,
        vStyles.container,
        {
          paddingVertical: sStyles.paddingVertical,
          paddingHorizontal: sStyles.paddingHorizontal,
        },
        disabled && styles.disabledContainer,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? colors.textInverse : colors.textPrimary}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            style={[
              styles.baseText,
              vStyles.text,
              { fontSize: sStyles.fontSize },
              disabled && styles.disabledText,
              icon ? { marginLeft: spacing.sm } : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  baseText: {
    fontWeight: "600",
  },
  primaryContainer: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: colors.textInverse,
  },
  secondaryContainer: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  outlineContainer: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  outlineText: {
    color: colors.textPrimary,
  },
  dangerContainer: {
    backgroundColor: colors.danger,
  },
  dangerText: {
    color: "#FFFFFF",
  },
  ghostContainer: {
    backgroundColor: "transparent",
  },
  ghostText: {
    color: colors.textSecondary,
  },
  disabledContainer: {
    opacity: 0.4,
  },
  disabledText: {
    color: colors.textMuted,
  },
});
