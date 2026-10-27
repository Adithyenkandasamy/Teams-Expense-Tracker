import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Header } from "../../src/components/common/Header";
import { Avatar } from "../../src/components/common/Avatar";
import { colors, spacing, typography } from "../../src/theme/colors";
import { useAuthStore } from "../../src/store/authStore";
import { useNotificationStore } from "../../src/store/notificationStore";

const links = [
  { title: "Groups and teams", subtitle: "Groups, members, balances", icon: "people-outline" as const, route: "/(tabs)/groups" },
  { title: "Personal expenses", subtitle: "Your own spending", icon: "wallet-outline" as const, route: "/(tabs)/personal" },
  { title: "All group expenses", subtitle: "Bills and payments", icon: "receipt-outline" as const, route: "/(tabs)/expenses" },
  { title: "Notifications", subtitle: "Updates and reminders", icon: "notifications-outline" as const, route: "/(tabs)/notifications" },
  { title: "Profile and settings", subtitle: "Your details and account", icon: "person-outline" as const, route: "/(tabs)/profile" },
];

export default function MoreScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const unread = useNotificationStore((state) => state.notifications.filter((item) => !item.read).length);
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="More" subtitle="Teams, account and settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.profileCard} onPress={() => router.push("/(tabs)/profile")}>
          <Avatar name={user?.name || "User"} imageUrl={user?.profile_image} size={48} />
          <View style={styles.profileText}><Text style={styles.name}>{user?.name || "Your account"}</Text><Text style={styles.email}>{user?.email || "Edit your profile"}</Text></View>
          <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={styles.menu}>
          {links.map((link, index) => (
            <TouchableOpacity key={link.title} style={[styles.row, index === links.length - 1 && styles.lastRow]} onPress={() => router.push(link.route as any)}>
              <View style={styles.icon}><Ionicons name={link.icon} size={20} color={colors.primary} /></View>
              <View style={styles.rowText}><Text style={styles.rowTitle}>{link.title}{link.title === "Notifications" && unread > 0 ? `  ·  ${unread} new` : ""}</Text><Text style={styles.rowSubtitle}>{link.subtitle}</Text></View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg },
  profileCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: 15, borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: spacing.lg }, profileText: { flex: 1 }, name: { ...typography.h3, color: colors.textPrimary }, email: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
  menu: { backgroundColor: colors.surface, borderRadius: 15, borderWidth: 1, borderColor: colors.surfaceBorder, paddingHorizontal: spacing.lg }, row: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight }, lastRow: { borderBottomWidth: 0 }, icon: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" }, rowText: { flex: 1 }, rowTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "600" }, rowSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
});
