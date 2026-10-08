import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../src/theme/colors";
import { auth, GoogleAuthProvider, signInWithCredential } from "../../src/services/firebase";
import { getMe } from "../../src/api/auth";
import { useAuthStore } from "../../src/store/authStore";
import { registerForPushNotificationsAsync } from "../../src/services/notifications";

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const setUser = useAuthStore((state) => state.setUser);
  const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);
  const setToken = useAuthStore((state) => state.setToken);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // In production Expo / React Native, Google sign-in flow gets the Google idToken
      // and creates a Firebase credential with GoogleAuthProvider.credential(idToken).
      // Here we sign in via Firebase Auth:
      const currentUser = auth.currentUser;
      if (currentUser) {
        const idToken = await currentUser.getIdToken(true);
        setFirebaseUser(currentUser);
        setToken(idToken);

        const backendUser = await getMe();
        setUser(backendUser);
        await registerForPushNotificationsAsync();
        router.replace("/(tabs)/home");
        return;
      }

      // If no session exists yet, prompt user or complete sign-in
      Alert.alert(
        "Google Sign-In",
        "Sign in using your Google Account configured in Firebase.",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setLoading(false),
          },
          {
            text: "Continue",
            onPress: async () => {
              try {
                // If a user is signed in with Firebase, fetch token and forward to FastAPI
                const fbUser = auth.currentUser;
                if (fbUser) {
                  const token = await fbUser.getIdToken();
                  setFirebaseUser(fbUser);
                  setToken(token);
                  const dbUser = await getMe();
                  setUser(dbUser);
                  await registerForPushNotificationsAsync();
                  router.replace("/(tabs)/home");
                } else {
                  setErrorMsg("Please complete Google authentication in your Firebase browser session.");
                }
              } catch (err: any) {
                setErrorMsg(err?.message || "Failed to authenticate with backend.");
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error: any) {
      if (error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled") {
        // User cancelled sign in
        setErrorMsg(null);
      } else {
        setErrorMsg(error?.message || "Authentication error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.iconCircle}>
          <Ionicons name="wallet-outline" size={44} color={colors.primary} />
        </View>
        <Text style={styles.title}>Team Expense Tracker</Text>
        <Text style={styles.tagline}>
          Split expenses. Track payments. Stay settled.
        </Text>
      </View>

      <View style={styles.middleSection}>
        <View style={styles.featureCard}>
          <View style={styles.featureItem}>
            <Ionicons name="people-outline" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Manage roommate & team expenses</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="flash-outline" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Instant UPI settlement links</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Expense Leader payment reviews</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Automatic deadline reminders</Text>
          </View>
        </View>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.googleButton, loading && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color={colors.textInverse} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our Terms of Service & Privacy Policy.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  topSection: {
    alignItems: "center",
    marginTop: spacing.xxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: "center",
  },
  tagline: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
    maxWidth: 260,
  },
  middleSection: {
    marginVertical: spacing.xxl,
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  featureText: {
    ...typography.body2,
    color: colors.textPrimary,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    flex: 1,
  },
  bottomSection: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.textPrimary,
    width: "100%",
    height: 52,
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    ...typography.body1,
    fontWeight: "700",
    color: colors.textInverse,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
  },
});
