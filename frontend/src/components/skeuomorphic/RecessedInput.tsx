import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../theme/colors";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leadingIcon?: keyof typeof Ionicons.glyphMap;
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

export function RecessedInput({
  label,
  error,
  hint,
  leadingIcon,
  onClear,
  containerStyle,
  value,
  style,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.recessedBox,
          isFocused && styles.boxFocused,
          !!error && styles.boxError,
        ]}
      >
        {/* Inset top shadow bar */}
        <View style={styles.insetTopShadow} pointerEvents="none" />

        {leadingIcon && (
          <Ionicons
            name={leadingIcon}
            size={18}
            color={isFocused ? colors.primary : colors.textMuted}
            style={styles.leadingIcon}
          />
        )}

        <TextInput
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          {...props}
        />

        {onClear && value && value.length > 0 && (
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.clearBtn}
          >
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Inset bottom highlight line */}
        <View style={styles.insetBottomHighlight} pointerEvents="none" />
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 11,
    marginBottom: 6,
  },
  recessedBox: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.recessedBg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.recessedTopBorder,
    borderBottomColor: colors.recessedBottomHighlight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    position: "relative",
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? {
          boxShadow: "inset 0 2px 4px rgba(32, 41, 35, 0.08), inset 0 1px 2px rgba(32, 41, 35, 0.05)",
        }
      : {}),
  },
  boxFocused: {
    borderColor: colors.primary,
    borderTopColor: colors.primary,
    backgroundColor: colors.surface,
  },
  boxError: {
    borderColor: colors.danger,
    borderTopColor: colors.danger,
  },
  insetTopShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.recessedTopBorder,
    opacity: 0.7,
  },
  insetBottomHighlight: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.recessedBottomHighlight,
  },
  leadingIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
    paddingVertical: 0,
    height: "100%",
    ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : {}),
  },
  clearBtn: {
    padding: 2,
    marginLeft: spacing.xs,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    fontSize: 11,
  },
  hintText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
});

