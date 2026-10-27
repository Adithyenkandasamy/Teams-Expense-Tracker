import React from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, shadows } from "../src/theme/colors";
import { PrimaryButton, RaisedIconContainer } from "../src/components/skeuomorphic";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.plaque}>
          <View style={styles.topBevel} pointerEvents="none" />

          <RaisedIconContainer size={68} variant="raised" style={styles.iconContainer}>
            <Ionicons name="compass-outline" size={34} color={colors.primary} />
          </RaisedIconContainer>

          <Text style={styles.code}>404</Text>
          <Text style={styles.title}>Ledger Page Not Found</Text>
          <Text style={styles.body}>
            The screen you're looking for doesn't exist or has moved to a new route in your financial journal.
          </Text>

          <View style={styles.buttonWrapper}>
            <PrimaryButton
              title="Return to Home Ledger"
              onPress={() => router.replace("/(tabs)/home")}
              size="large"
              icon={<Ionicons name="home-outline" size={18} color={colors.textInverse} />}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  plaque: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderTopColor: colors.cardTopHighlight,
    borderBottomColor: colors.cardBottomBorder,
    borderBottomWidth: 2,
    padding: spacing.xxl,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    ...shadows.floating,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 12px 32px rgba(32, 41, 35, 0.10)",
        }
      : {}),
  },
  topBevel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: colors.cardTopHighlight,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  code: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -1,
  },
  title: {
    ...typography.h2,
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    marginTop: 2,
    textAlign: "center",
  },
  body: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    lineHeight: 20,
    maxWidth: 280,
  },
  buttonWrapper: {
    width: "100%",
  },
});
