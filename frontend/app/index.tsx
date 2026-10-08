import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../src/store/authStore";
import { colors, spacing, typography } from "../src/theme/colors";

export default function SplashScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="wallet" size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>Team Expense Tracker</Text>
        <Text style={styles.subtitle}>
          Split expenses. Track payments. Stay settled.
        </Text>
      </View>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xxxl * 2,
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
  loadingContainer: {
    paddingBottom: spacing.xxl,
  },
});
