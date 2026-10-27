import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../src/theme/colors";
import { Button } from "../src/components/common/Button";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.icon}><Ionicons name="compass-outline" size={34} color={colors.primary} /></View>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>This page isn’t here</Text>
        <Text style={styles.body}>The link may be old, or the page may have moved.</Text>
        <Button title="Go to Home" onPress={() => router.replace("/(tabs)/home")} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl },
  icon: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center", marginBottom: spacing.xl },
  code: { fontSize: 54, lineHeight: 62, fontWeight: "800", color: colors.primary, letterSpacing: -2 },
  title: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.sm },
  body: { ...typography.body2, textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.xxl },
});
