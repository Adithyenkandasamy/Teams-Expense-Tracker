import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/store/authStore";
import { useThemeStore, ThemeMode } from "../../src/store/themeStore";
import { updateUserProfile } from "../../src/api/users";
import { colors, spacing, typography, shadows } from "../../src/theme/colors";
import { Header } from "../../src/components/common/Header";
import { Avatar } from "../../src/components/common/Avatar";
import { FadeInView } from "../../src/components/animated";
import {
  RecessedInput,
  PrimaryButton,
  SecondaryButton,
  ConfirmationDialog,
  RaisedIconContainer,
} from "../../src/components/skeuomorphic";

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser, logout } = useAuthStore();
  const { mode: currentThemeMode, setMode: setThemeMode } = useThemeStore();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [upiId, setUpiId] = useState(user?.upi_id || "");
  const [isEditing, setIsEditing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updated) => {
      setUser(updated);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onError: (err: any) => {
      Alert.alert("Update Failed", err?.response?.data?.message || err?.message || "Could not update profile");
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Name cannot be empty.");
      return;
    }
    updateMutation.mutate({
      name: name.trim(),
      phone: phone.trim() || undefined,
      upi_id: upiId.trim() || undefined,
    });
  };

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
    router.replace("/(auth)/login");
  };

  const THEME_OPTIONS: { id: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: "system", label: "System", icon: "phone-portrait-outline" },
    { id: "light", label: "Light", icon: "sunny-outline" },
    { id: "dark", label: "Dark", icon: "moon-outline" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Profile & Settings"
        subtitle="Manage personal details and app theme"
        showBack
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(tabs)/more" as any);
          }
        }}
        rightAction={
          !isEditing ? (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={styles.editBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setName(user?.name || "");
                setPhone(user?.phone || "");
                setUpiId(user?.upi_id || "");
                setIsEditing(false);
              }}
              style={styles.editBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* User Avatar Card */}
        <FadeInView delay={0}>
          <View style={styles.avatarCard}>
            <View style={styles.cardTopBevel} pointerEvents="none" />

            <Avatar name={user?.name || "User"} imageUrl={user?.profile_image} size={80} />
            <Text style={styles.displayName}>{user?.name || "Member"}</Text>
            <Text style={styles.displayEmail}>{user?.email}</Text>

            {user?.upi_id ? (
              <View style={styles.upiPill}>
                <Ionicons name="qr-code-outline" size={14} color={colors.primary} />
                <Text style={styles.upiPillText}>{user.upi_id}</Text>
              </View>
            ) : (
              <View style={styles.upiWarningPill}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
                <Text style={styles.upiWarningText}>Add UPI ID to receive direct splits</Text>
              </View>
            )}
          </View>
        </FadeInView>

        {/* Theme Preference Selector */}
        <FadeInView delay={60}>
          <View style={styles.sectionCard}>
            <View style={styles.cardTopBevel} pointerEvents="none" />

            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <RaisedIconContainer size={32} variant="raised">
                  <Ionicons name="color-palette-outline" size={16} color={colors.primary} />
                </RaisedIconContainer>
                <Text style={styles.sectionTitle}>App Theme</Text>
              </View>
              <Text style={styles.themeModeHint}>
                {currentThemeMode === "system" ? "Follows Device" : currentThemeMode === "light" ? "Light" : "Dark"}
              </Text>
            </View>

            <View style={styles.themeSegmentContainer}>
              {THEME_OPTIONS.map((opt) => {
                const isSelected = currentThemeMode === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setThemeMode(opt.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.themeSegmentBtn,
                      isSelected && styles.themeSegmentBtnSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.segmentTopShadow} pointerEvents="none" />}
                    <Ionicons
                      name={opt.icon}
                      size={16}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.themeSegmentText,
                        isSelected && styles.themeSegmentTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </FadeInView>

        {/* Edit Profile Form */}
        <FadeInView delay={120}>
          <View style={styles.sectionCard}>
            <View style={styles.cardTopBevel} pointerEvents="none" />

            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <RaisedIconContainer size={32} variant="raised">
                  <Ionicons name="person-outline" size={16} color={colors.primary} />
                </RaisedIconContainer>
                <Text style={styles.sectionTitle}>Account Details</Text>
              </View>
            </View>

            <RecessedInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              editable={isEditing}
              placeholder="Your Name"
              leadingIcon="person-outline"
            />

            <RecessedInput
              label="Email Address"
              value={user?.email || ""}
              editable={false}
              leadingIcon="mail-outline"
              hint="Email address cannot be changed."
            />

            <RecessedInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              editable={isEditing}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              leadingIcon="call-outline"
            />

            <RecessedInput
              label="UPI ID (VPA)"
              value={upiId}
              onChangeText={setUpiId}
              editable={isEditing}
              placeholder="yourname@okaxis"
              autoCapitalize="none"
              leadingIcon="wallet-outline"
              hint="Used by group members to settle up with you directly."
            />

            {isEditing && (
              <View style={styles.saveActionRow}>
                <PrimaryButton
                  title={updateMutation.isPending ? "Saving..." : "Save Changes"}
                  onPress={handleSave}
                  loading={updateMutation.isPending}
                />
              </View>
            )}
          </View>
        </FadeInView>

        {/* Log Out Section */}
        <FadeInView delay={180}>
          <SecondaryButton
            title="Log Out"
            onPress={() => setLogoutModalVisible(true)}
            icon={<Ionicons name="log-out-outline" size={18} color={colors.negative} />}
            textStyle={{ color: colors.negative }}
          />
        </FadeInView>
      </ScrollView>

      {/* Confirmation Dialog for Logout */}
      <ConfirmationDialog
        visible={logoutModalVisible}
        title="Log Out?"
        message="Are you sure you want to log out of your expense tracker account?"
        confirmText="Log Out"
        cancelText="Cancel"
        isDestructive
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  editBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: "700",
  },
  cancelText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  avatarCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
  },
  cardTopBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.cardTopHighlight,
  },
  displayName: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: "800",
    marginTop: spacing.md,
  },
  displayEmail: {
    ...typography.body2,
    color: colors.textSecondary,
    marginTop: 2,
  },
  upiPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.recessedBg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  upiPillText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  upiWarningPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(201, 122, 28, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(201, 122, 28, 0.25)",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  upiWarningText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: "600",
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    marginBottom: spacing.lg,
    position: "relative",
    overflow: "hidden",
    ...shadows.card,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  themeModeHint: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },
  themeSegmentContainer: {
    flexDirection: "row",
    backgroundColor: colors.recessedBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.recessedTopBorder,
    padding: 3,
    gap: 4,
  },
  themeSegmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
    position: "relative",
  },
  themeSegmentBtnSelected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    ...shadows.sm,
  },
  segmentTopShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.cardTopHighlight,
  },
  themeSegmentText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  themeSegmentTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  saveActionRow: {
    marginTop: spacing.md,
  },
});
