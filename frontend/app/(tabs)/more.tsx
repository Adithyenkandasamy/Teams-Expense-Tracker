import React from "react";
import { ScrollView, StyleSheet, Text, View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "../../src/components/common/Header";
import { Avatar } from "../../src/components/common/Avatar";
import { colors, spacing, typography, shadows } from "../../src/theme/colors";
import { useAuthStore } from "../../src/store/authStore";
import { useNotificationStore } from "../../src/store/notificationStore";
import { AnimatedPressable, FadeInView } from "../../src/components/animated";
import { RaisedIconContainer } from "../../src/components/skeuomorphic";

const links = [
  {
    title: "Groups & Teams",
    subtitle: "Member lists, balances, and settlements",
    icon: "people-outline" as const,
    route: "/(tabs)/groups",
  },
  {
    title: "Personal Expenses",
    subtitle: "Searchable history and personal budget",
    icon: "wallet-outline" as const,
    route: "/(tabs)/personal",
  },
  {
    title: "All Group Expenses",
    subtitle: "Shared bills, receipts, and split status",
    icon: "receipt-outline" as const,
    route: "/(tabs)/expenses",
  },
  {
    title: "Notifications",
    subtitle: "Payment reminders and group alerts",
    icon: "notifications-outline" as const,
    route: "/(tabs)/notifications",
    hasBadge: true,
  },
  {
    title: "Profile & Settings",
    subtitle: "Account details, theme mode, and UPI",
    icon: "person-outline" as const,
    route: "/(tabs)/profile",
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const unread = useNotificationStore(
    (state) => state.notifications.filter((item) => !item.read).length
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="More" subtitle="Hub for teams, archives, and settings" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Account Card */}
        <FadeInView delay={0}>
          <AnimatedPressable
            style={styles.profileCard}
            onPress={() => router.push("/(tabs)/profile")}
            scaleTo={0.98}
          >
            <View style={styles.cardTopBevel} pointerEvents="none" />

            <Avatar
              name={user?.name || "User"}
              imageUrl={user?.profile_image}
              size={52}
            />

            <View style={styles.profileText}>
              <Text style={styles.name} numberOfLines={1}>
                {user?.name || "Your Account"}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {user?.email || "Manage profile & settings"}
              </Text>
            </View>

            <View style={styles.chevronWrap}>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </AnimatedPressable>
        </FadeInView>

        {/* Section Title */}
        <Text style={styles.menuSectionHeader}>APPLICATION SECTIONS</Text>

        {/* Tactile Menu Rows */}
        <View style={styles.menu}>
          <View style={styles.cardTopBevel} pointerEvents="none" />

          {links.map((link, index) => {
            const isLast = index === links.length - 1;

            return (
              <FadeInView key={link.title} delay={40 + index * 40}>
                <AnimatedPressable
                  style={[styles.row, isLast && styles.lastRow]}
                  onPress={() => router.push(link.route as any)}
                  scaleTo={0.99}
                >
                  <RaisedIconContainer size={40} variant="raised">
                    <Ionicons name={link.icon} size={20} color={colors.primary} />
                  </RaisedIconContainer>

                  <View style={styles.rowText}>
                    <View style={styles.rowTitleRow}>
                      <Text style={styles.rowTitle}>{link.title}</Text>
                      {link.hasBadge && unread > 0 && (
                        <View style={styles.badgePill}>
                          <Text style={styles.badgePillText}>{unread} new</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.rowSubtitle} numberOfLines={1}>
                      {link.subtitle}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </AnimatedPressable>
              </FadeInView>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    marginBottom: spacing.xl,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 4px 14px rgba(32, 41, 35, 0.06)",
        }
      : {}),
  },
  cardTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.cardTopHighlight,
  },
  profileText: {
    flex: 1,
  },
  name: {
    ...typography.h3,
    fontSize: 17,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  email: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  chevronWrap: {
    padding: 4,
  },
  menuSectionHeader: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    paddingHorizontal: spacing.md,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
  },
  row: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: spacing.sm,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowText: {
    flex: 1,
  },
  rowTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  rowSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  badgePill: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  badgePillText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary,
  },
});
