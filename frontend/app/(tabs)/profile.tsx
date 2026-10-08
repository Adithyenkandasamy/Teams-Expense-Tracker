import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/store/authStore";
import { updateUserProfile } from "../../src/api/users";
import { colors, spacing, typography } from "../../src/theme/colors";
import { Header } from "../../src/components/common/Header";
import { Avatar } from "../../src/components/common/Avatar";
import { Input } from "../../src/components/common/Input";
import { Button } from "../../src/components/common/Button";
import { ConfirmModal } from "../../src/components/common/ConfirmModal";

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser, logout } = useAuthStore();

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Profile"
        subtitle="Account & UPI settings"
        rightAction={
          !isEditing ? (
            <TouchableOpacity onPress={() => setIsEditing(true)} activeOpacity={0.7}>
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
        <View style={styles.avatarCard}>
          <Avatar name={user?.name || "User"} imageUrl={user?.profile_image} size={84} />
          <Text style={styles.displayName}>{user?.name}</Text>
          <Text style={styles.displayEmail}>{user?.email}</Text>
          {user?.upi_id ? (
            <View style={styles.upiPill}>
              <Ionicons name="qr-code-outline" size={14} color={colors.primary} />
              <Text style={styles.upiPillText}>{user.upi_id}</Text>
            </View>
          ) : (
            <View style={styles.upiWarningPill}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
              <Text style={styles.upiWarningText}>Add UPI ID to receive payments</Text>
            </View>
          )}
        </View>

        {/* UPI Info Note */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            When you create an expense as the Expense Leader, roommates can pay you
            directly to your registered UPI ID.
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Input
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Your Name"
            editable={isEditing}
          />

          <Input
            label="Email Address"
            value={user?.email || ""}
            editable={false}
            helperText="Email is managed by Google authentication"
          />

          <Input
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            editable={isEditing}
          />

          <Input
            label="UPI ID"
            value={upiId}
            onChangeText={setUpiId}
            placeholder="username@okhdfcbank / paytm / upi"
            editable={isEditing}
            helperText="Used when you are Expense Leader to receive settlements"
          />

          {isEditing && (
            <View style={styles.saveBtnWrapper}>
              <Button
                title="Save Changes"
                onPress={handleSave}
                loading={updateMutation.isPending}
                variant="primary"
              />
            </View>
          )}
        </View>

        {/* Logout Section */}
        <View style={styles.logoutSection}>
          <Button
            title="Log Out"
            variant="danger"
            icon={<Ionicons name="log-out-outline" size={18} color={colors.danger} />}
            onPress={() => setLogoutModalVisible(true)}
          />
        </View>
      </ScrollView>

      {/* Logout Confirmation */}
      <ConfirmModal
        visible={logoutModalVisible}
        title="Log Out"
        message="Are you sure you want to sign out of Team Expense Tracker?"
        confirmText="Log Out"
        confirmVariant="danger"
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
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
  },
  displayName: {
    ...typography.h2,
    color: colors.textPrimary,
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
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: spacing.md,
  },
  upiPillText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
  },
  upiWarningPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: spacing.md,
  },
  upiWarningText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.25)",
    padding: spacing.md,
    borderRadius: 14,
    marginBottom: spacing.lg,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  formSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.xl,
  },
  saveBtnWrapper: {
    marginTop: spacing.md,
  },
  logoutSection: {
    marginTop: spacing.sm,
  },
});
