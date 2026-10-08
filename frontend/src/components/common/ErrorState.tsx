import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../theme/colors";
import { Button } from "./Button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Something went wrong. Please try again.",
  onRetry,
  fullScreen = false,
}) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <View style={styles.iconCircle}>
        <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
      </View>
      <Text style={styles.title}>Error</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <View style={styles.actionContainer}>
          <Button title="Try Again" onPress={onRetry} variant="secondary" size="small" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: spacing.lg,
  },
});
