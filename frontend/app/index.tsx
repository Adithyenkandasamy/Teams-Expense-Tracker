import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../src/store/authStore";
import { colors, spacing, typography, shadows } from "../src/theme/colors";
import { FadeInView, PulseView } from "../src/components/animated";

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
      <FadeInView delay={0} style={styles.logoContainer}>
        <PulseView minScale={0.94} maxScale={1.06} duration={2000}>
          <View style={styles.iconCircle}>
            <Ionicons name="wallet-outline" size={44} color={colors.primary} />
          </View>
        </PulseView>
        <Text style={styles.title}>Expense Tracker</Text>
        <Text style={styles.subtitle}>
          Split expenses. Track payments. Stay settled.
        </Text>
      </FadeInView>
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
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
    ...shadows.card,
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
