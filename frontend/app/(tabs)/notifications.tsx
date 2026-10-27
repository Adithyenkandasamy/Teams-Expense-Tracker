import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, shadows } from "../../src/theme/colors";
import { Header } from "../../src/components/common/Header";
import { NotificationItem } from "../../src/types/models";
import { useNotificationStore } from "../../src/store/notificationStore";
import { AnimatedPressable } from "../../src/components/animated";
import { RaisedIconContainer, EmptyState } from "../../src/components/skeuomorphic";

export default function NotificationsScreen() {
  const router = useRouter();
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllRead = useNotificationStore((state) => state.markAllAsRead);

  const getIconForType = (type: string) => {
    switch (type) {
      case "NEW_EXPENSE":
        return { name: "receipt-outline" as const, color: colors.primary };
      case "PAYMENT_REMINDER":
        return { name: "time-outline" as const, color: colors.warning };
      case "PAYMENT_SUBMITTED":
        return { name: "arrow-up-circle-outline" as const, color: colors.info };
      case "PAYMENT_ACCEPTED":
        return { name: "checkmark-circle-outline" as const, color: colors.positive };
      case "PAYMENT_REJECTED":
        return { name: "close-circle-outline" as const, color: colors.negative };
      case "DEADLINE_EXTENDED":
        return { name: "calendar-outline" as const, color: colors.secondary };
      case "EXPENSE_READY_TO_CLOSE":
        return { name: "flag-outline" as const, color: colors.primary };
      case "EXPENSE_CLOSED":
        return { name: "lock-closed-outline" as const, color: colors.textMuted };
      default:
        return { name: "notifications-outline" as const, color: colors.primary };
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
        showBack
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(tabs)/more" as any);
          }
        }}
        rightAction={
          notificationList.length > 0 ? (
            <TouchableOpacity onPress={markAllRead} activeOpacity={0.7} style={styles.markReadBtn}>
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {notificationList.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="All Caught Up"
          description="You have no unread reminders or payment notices right now."
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
                <View style={styles.cardTopBevel} pointerEvents="none" />

                <RaisedIconContainer size={42} variant={isRead ? "recessed" : "raised"}>
                  <Ionicons name={iconConfig.name} size={20} color={iconConfig.color} />
                </RaisedIconContainer>

                <View style={styles.content}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, !isRead && styles.unreadTitle]} numberOfLines={1}>
                      {item.title || "Notification"}
                    </Text>
                    {!isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.body}>{item.body || ""}</Text>
                  {item.timestamp && (
                    <Text style={styles.timeText}>
                      {new Date(item.timestamp).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  )}
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
  markReadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markReadText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  listContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 1.5,
    gap: spacing.md,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
  },
  cardTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cardTopHighlight,
  },
  unreadCard: {
    borderLeftWidth: 3.5,
    borderLeftColor: colors.primary,
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
    fontWeight: "600",
    color: colors.textSecondary,
    fontSize: 13,
  },
  unreadTitle: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
  },
  body: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
    fontSize: 12,
  },
  timeText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 6,
  },
});
