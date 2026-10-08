import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { colors, spacing, typography } from "../../src/theme/colors";
import {
  auth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithCustomToken,
  signInWithPopup,
} from "../../src/services/firebase";
import { getMe } from "../../src/api/auth";
import { apiClient } from "../../src/api/client";
import { useAuthStore } from "../../src/store/authStore";
import { registerForPushNotificationsAsync } from "../../src/services/notifications";


WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const setUser = useAuthStore((state) => state.setUser);
  const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);
  const setToken = useAuthStore((state) => state.setToken);

  // Setup expo-auth-session Google provider for mobile
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "888308901041-nlu0g4t5shm11cie6ttsgug3bvrvujdo.apps.googleusercontent.com",
    androidClientId: "888308901041-nlu0g4t5shm11cie6ttsgug3bvrvujdo.apps.googleusercontent.com",
    webClientId: "888308901041-nlu0g4t5shm11cie6ttsgug3bvrvujdo.apps.googleusercontent.com",
  });

  // Handle mobile Google redirect response
  useEffect(() => {
    if (response?.type === "success") {
      const { id_token, access_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token || null, access_token || null);

      setLoading(true);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const fbUser = userCredential.user;
          const idToken = await fbUser.getIdToken(true);
          setFirebaseUser(fbUser);
          setToken(idToken);

          try {
            const backendUser = await getMe();
            setUser(backendUser);
          } catch {
            // Fallback user from Firebase token
            setUser({
              id: fbUser.uid,
              firebase_uid: fbUser.uid,
              name: fbUser.displayName || "User",
              email: fbUser.email || "",
              profile_image: fbUser.photoURL,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }

          await registerForPushNotificationsAsync();
          router.replace("/(tabs)/home");
        })
        .catch((err) => {
          console.warn("Mobile auth error:", err);
          setErrorMsg(err?.message || "Failed to sign in with Google credential.");
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (response?.type === "error") {
      setErrorMsg(response.error?.message || "Google sign-in was cancelled or failed.");
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      if (Platform.OS === "web") {
        // Web browser: use direct Firebase popup
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });

        const userCredential = await signInWithPopup(auth, provider);
        const fbUser = userCredential.user;

        if (fbUser) {
          const idToken = await fbUser.getIdToken(true);
          setFirebaseUser(fbUser);
          setToken(idToken);

          try {
            const backendUser = await getMe();
            setUser(backendUser);
          } catch {
            setUser({
              id: fbUser.uid,
              firebase_uid: fbUser.uid,
              name: fbUser.displayName || "User",
              email: fbUser.email || "",
              profile_image: fbUser.photoURL,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }

          router.replace("/(tabs)/home");
        }
      } else {
        // Native mobile (Android / iOS): use Expo Google prompt
        await promptAsync();
      }
    } catch (error: any) {
      console.warn("Sign-in error:", error);
      if (
        error?.code === "auth/popup-closed-by-user" ||
        error?.code === "auth/cancelled"
      ) {
        setErrorMsg(null);
      } else {
        setErrorMsg(
          error?.message || "Authentication error occurred. Please try again."
        );
      }
    } finally {
      if (Platform.OS === "web") {
        setLoading(false);
      }
    }
  };

  const handleDevSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiClient.post("/auth/dev-token");
      const customToken = res.data.custom_token;

      const userCredential = await signInWithCustomToken(auth, customToken);
      const fbUser = userCredential.user;
      const idToken = await fbUser.getIdToken(true);

      setFirebaseUser(fbUser);
      setToken(idToken);

      try {
        const backendUser = await getMe();
        setUser(backendUser);
      } catch {
        setUser({
          id: fbUser.uid,
          firebase_uid: fbUser.uid,
          name: fbUser.displayName || "Adithyen",
          email: fbUser.email || "aadithyen1@gmail.com",
          profile_image: fbUser.photoURL,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      await registerForPushNotificationsAsync();
      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.warn("Dev login error:", err);
      setErrorMsg(err?.message || "Failed to sign in with test account.");
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
          disabled={loading || (!request && Platform.OS !== "web")}
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

        <TouchableOpacity
          style={[styles.devButton, loading && styles.buttonDisabled]}
          onPress={handleDevSignIn}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Ionicons name="flash-outline" size={18} color={colors.primary} />
          <Text style={styles.devButtonText}>Instant Test Sign-In (Adithyen)</Text>
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
  devButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    width: "100%",
    height: 48,
    borderRadius: 14,
  },
  devButtonText: {
    ...typography.body2,
    fontWeight: "600",
    color: colors.primary,
  },
  disclaimer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: "center",
  },
});

