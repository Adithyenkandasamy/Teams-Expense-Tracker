import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Platform,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, shadows } from "../../theme/colors";
import { PrimaryButton, SecondaryButton } from "./Buttons";
import { RaisedIconContainer } from "./RaisedIconContainer";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon,
  title,
  description,
  actionTitle,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.emptyContainer, style]}>
      <RaisedIconContainer size={64} variant="raised" style={styles.emptyIconPlaque}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </RaisedIconContainer>

      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>

      {actionTitle && onAction && (
        <View style={styles.emptyAction}>
          <PrimaryButton
            title={actionTitle}
            onPress={onAction}
            size="small"
            style={styles.emptyBtn}
          />
        </View>
      )}
    </View>
  );
}

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View key={i} style={[styles.skeletonCard, { opacity: pulseAnim }]}>
          <View style={styles.skeletonTop}>
            <View style={styles.skeletonCircle} />
            <View style={styles.skeletonLines}>
              <View style={[styles.skeletonLine, { width: "60%" }]} />
              <View style={[styles.skeletonLine, { width: "40%", marginTop: 6 }]} />
            </View>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

export function ErrorState({
  message = "Something went wrong loading this data.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.errorCard}>
      <View style={styles.errorIconCircle}>
        <Ionicons name="alert-circle-outline" size={24} color={colors.danger} />
      </View>
      <Text style={styles.errorTitle}>Error Loading Content</Text>
      <Text style={styles.errorMsg}>{message}</Text>
      {onRetry && (
        <SecondaryButton
          title="Try Again"
          onPress={onRetry}
          size="small"
          style={styles.retryBtn}
        />
      )}
    </View>
  );
}

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalTopBevel} pointerEvents="none" />

          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>

          <View style={styles.modalActions}>
            <SecondaryButton
              title={cancelText}
              onPress={onCancel}
              size="small"
              style={styles.modalActionBtn}
            />
            <PrimaryButton
              title={confirmText}
              onPress={onConfirm}
              size="small"
              style={[
                styles.modalActionBtn,
                isDestructive && { backgroundColor: colors.negative },
              ]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    marginVertical: spacing.md,
  },
  emptyIconPlaque: {
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptyDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 18,
  },
  emptyAction: {
    marginTop: spacing.lg,
  },
  emptyBtn: {
    minWidth: 140,
  },
  skeletonContainer: {
    width: "100%",
    gap: spacing.sm,
  },
  skeletonCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  skeletonTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  skeletonCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
  },
  skeletonLines: {
    flex: 1,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.borderLight,
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.xl,
    alignItems: "center",
    marginVertical: spacing.md,
    ...shadows.card,
  },
  errorIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.dangerBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  errorMsg: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.md,
  },
  retryBtn: {
    minWidth: 120,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    padding: spacing.xl,
    position: "relative",
    overflow: "hidden",
    ...shadows.floating,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.22), 0 2px 6px rgba(0, 0, 0, 0.12)",
        }
      : {}),
  },
  modalTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.cardTopHighlight,
  },
  modalTitle: {
    ...typography.h3,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  modalMessage: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modalActionBtn: {
    flex: 1,
  },
});

