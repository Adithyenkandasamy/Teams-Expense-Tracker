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
import { colors, spacing, typography } from "../../src/theme/colors";
import { Header } from "../../src/components/common/Header";
import { EmptyState } from "../../src/components/common/EmptyState";
import { NotificationItem } from "../../src/types/models";

// Initial notification history items matching backend event types
const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Payment Reminder",
    body: "Reminder: ₹400 for Grocery Run is pending. Tap to settle.",
    type: "PAYMENT_REMINDER",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
  },
  {
    id: "2",
    title: "Payment Accepted",
    body: "Your payment of ₹350 for Pizza Night was accepted by Arun.",
    type: "PAYMENT_ACCEPTED",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: false,
  },
  {
    id: "3",
    title: "New Expense Added",
    body: "Rahul added 'Internet & WiFi' in Apartment 4B. Your share is ₹250.",
    type: "NEW_EXPENSE",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
  },
  {
    id: "4",
    title: "Deadline Extended",
    body: "Payment deadline for 'Water Filter Replacement' was auto-extended.",
    type: "DEADLINE_EXTENDED",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const getIconForType = (type: string) => {
    switch (type) {
      case "NEW_EXPENSE":
        return { name: "receipt-outline" as const, color: colors.primary, bg: colors.primaryMuted };
      case "PAYMENT_REMINDER":
        return { name: "time-outline" as const, color: colors.warning, bg: "rgba(245, 158, 11, 0.12)" };
      case "PAYMENT_SUBMITTED":
        return { name: "arrow-up-circle-outline" as const, color: colors.info, bg: "rgba(59, 130, 246, 0.12)" };
      case "PAYMENT_ACCEPTED":
        return { name: "checkmark-circle-outline" as const, color: colors.success, bg: colors.primaryMuted };
      case "PAYMENT_REJECTED":
        return { name: "close-circle-outline" as const, color: colors.danger, bg: colors.dangerBg };
      case "DEADLINE_EXTENDED":
        return { name: "calendar-outline" as const, color: colors.secondary, bg: colors.secondaryMuted };
      case "EXPENSE_READY_TO_CLOSE":
        return { name: "flag-outline" as const, color: colors.primary, bg: colors.primaryMuted };
      case "EXPENSE_CLOSED":
        return { name: "lock-closed-outline" as const, color: colors.textMuted, bg: colors.surfaceBorder };
      default:
        return { name: "notifications-outline" as const, color: colors.primary, bg: colors.primaryMuted };
    }
  };

  const handleNotificationPress = (item: NotificationItem) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );

    if (item.data?.expense_id) {
      router.push(`/expenses/${item.data.expense_id}` as any);
    } else if (item.data?.group_id) {
      router.push(`/groups/${item.data.group_id}` as any);
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Notifications"
        subtitle="Reminders & activity updates"
        rightAction={
          notifications.length > 0 ? (
            <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="No Notifications"
          description="You are all caught up! New expense reminders and payment updates will show here."
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const iconConfig = getIconForType(item.type);
            return (
              <TouchableOpacity
                style={[styles.card, !item.read && styles.unreadCard]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
                  <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
                </View>

                <View style={styles.content}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, !item.read && styles.unreadTitle]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {!item.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.body}>{item.body}</Text>
                </View>
              </TouchableOpacity>
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
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  unreadCard: {
    borderColor: colors.borderLight,
    backgroundColor: colors.surfaceElevated,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 6,
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
    backgroundColor: colors.textPrimary,
  },
  body: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
});
