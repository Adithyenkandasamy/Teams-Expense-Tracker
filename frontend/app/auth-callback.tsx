import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { auth, signInWithCustomToken } from "../src/services/firebase";
import { getMe } from "../src/api/auth";
import { useAuthStore } from "../src/store/authStore";
import { registerForPushNotificationsAsync } from "../src/services/notifications";
import { colors, spacing, typography } from "../src/theme/colors";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ custom_token?: string; token?: string }>();
  const setUser = useAuthStore((state) => state.setUser);
  const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);
  const setToken = useAuthStore((state) => state.setToken);

  useEffect(() => {
    const authenticate = async () => {
      let customToken = params.custom_token || params.token;
      if (!customToken) {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const parsed = Linking.parse(initialUrl);
          customToken = (parsed.queryParams?.custom_token as string) || (parsed.queryParams?.token as string);
        }
      }

      if (customToken) {
        try {
          const userCredential = await signInWithCustomToken(auth, customToken);
          const fbUser = userCredential.user;
          const freshToken = await fbUser.getIdToken(true);
          setFirebaseUser(fbUser);
          setToken(freshToken);

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

          await registerForPushNotificationsAsync();
          router.replace("/(tabs)/home");
          return;
        } catch (err) {
          console.warn("AuthCallback error:", err);
        }
      }

      // Fallback to login if token missing or invalid
      router.replace("/(auth)/login");
    };

    authenticate();
  }, [params.custom_token, params.token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Logging you in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  text: {
    ...typography.body1,
    color: colors.textSecondary,
  },
});
