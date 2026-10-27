import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, shadows } from "../../src/theme/colors";
import { Header } from "../../src/components/common/Header";
import { EmptyState } from "../../src/components/common/EmptyState";
import { NotificationItem } from "../../src/types/models";
import { useNotificationStore } from "../../src/store/notificationStore";
import { FadeInView, AnimatedPressable } from "../../src/components/animated";

export default function NotificationsScreen() {
  const router = useRouter();
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllRead = useNotificationStore((state) => state.markAllAsRead);

  const getIconForType = (type: string) => {
    switch (type) {
      case "NEW_EXPENSE":
        return { name: "receipt-outline" as const, color: colors.textPrimary, bg: colors.surfaceElevated };
      case "PAYMENT_REMINDER":
        return { name: "time-outline" as const, color: colors.warning, bg: "rgba(245, 158, 11, 0.12)" };
      case "PAYMENT_SUBMITTED":
        return { name: "arrow-up-circle-outline" as const, color: colors.textSecondary, bg: colors.surfaceElevated };
      case "PAYMENT_ACCEPTED":
        return { name: "checkmark-circle-outline" as const, color: colors.textPrimary, bg: colors.surfaceElevated };
      case "PAYMENT_REJECTED":
        return { name: "close-circle-outline" as const, color: colors.danger, bg: colors.dangerBg };
      case "DEADLINE_EXTENDED":
        return { name: "calendar-outline" as const, color: colors.textSecondary, bg: colors.surfaceElevated };
      case "EXPENSE_READY_TO_CLOSE":
        return { name: "flag-outline" as const, color: colors.textPrimary, bg: colors.surfaceElevated };
      case "EXPENSE_CLOSED":
        return { name: "lock-closed-outline" as const, color: colors.textMuted, bg: colors.surfaceBorder };
      default:
        return { name: "notifications-outline" as const, color: colors.textPrimary, bg: colors.surfaceElevated };
    }
  };

  const handleNotificationPress = (item: NotificationItem) => {
    markAsRead(item.id);

    if (item.route) {
      router.push(item.route as any);
      return;
    }

    const expenseId = item.data?.expense_id || item.data?.expenseId;
    const groupId = item.data?.group_id || item.data?.groupId;
    if (expenseId) {
      router.push(`/expenses/${expenseId}` as any);
    } else if (groupId) {
      router.push(`/groups/${groupId}` as any);
    }
  };

  const notificationList = notifications || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Notifications"
        subtitle="Reminders & activity updates"
        rightAction={
          notificationList.length > 0 ? (
            <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {notificationList.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="No Notifications"
          description="You are all caught up! New expense reminders and payment updates will show here."
        />
      ) : (
        <FlatList
          data={notificationList}
          keyExtractor={(item, index) => item?.id || index.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            if (!item) return null;
            const iconConfig = getIconForType(item.type || "");
            const isRead = !!item.read;
            return (
              <AnimatedPressable
                style={[styles.card, !isRead && styles.unreadCard]}
                onPress={() => handleNotificationPress(item)}
                scaleTo={0.98}
              >
                <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
                  <Ionicons name={iconConfig.name} size={20} color={iconConfig.color} />
                </View>

                <View style={styles.content}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, !isRead && styles.unreadTitle]} numberOfLines={1}>
                      {item.title || "Notification"}
                    </Text>
                    {!isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.body}>{item.body || ""}</Text>
                </View>
              </AnimatedPressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  markReadText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    ...shadows.card,
  },
  unreadCard: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...typography.body2,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  unreadTitle: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  body: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
});
