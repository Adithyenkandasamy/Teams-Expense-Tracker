import React, { useEffect } from "react";
import { View, StyleSheet, Platform, useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { colors } from "../src/theme/colors";

import { onAuthStateChanged } from "../src/services/firebase";
import { auth } from "../src/services/firebase";
import { useAuthStore } from "../src/store/authStore";
import { getMe } from "../src/api/auth";
import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
} from "../src/services/notifications";
import { NotificationToast } from "../src/components/common/NotificationToast";

// Keep cached data fresh without polling every query every few seconds.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
      refetchOnWindowFocus: true, // Auto-update immediately when user switches tabs or focuses app
      refetchOnReconnect: true,
    },
  },
});

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const setUser = useAuthStore((state) => state.setUser);
  const setFirebaseUser = useAuthStore((state) => state.setFirebaseUser);
  const setToken = useAuthStore((state) => state.setToken);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);

  useEffect(() => {
    // Listen for Firebase auth changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          setFirebaseUser(fbUser);
          setToken(idToken);

          // Sync with FastAPI backend to get or create PostgreSQL user
          try {
            const backendUser = await getMe();
            setUser(backendUser);

            // Register FCM device token
            registerForPushNotificationsAsync();
          } catch (apiError) {
            console.warn("Backend sync failed during auth state change:", apiError);
            // Fallback user from Firebase claims
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
        } catch (error) {
          console.error("Auth initialization error:", error);
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
        setToken(null);
      }
      setIsLoading(false);
    });

    // Setup push notification listener
    const notificationCleanup = setupNotificationListeners((route) => router.push(route as any));

    return () => {
      unsubscribe();
      notificationCleanup();
    };
  }, [router]);

  const isWeb = Platform.OS === "web";

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <View style={isWeb ? styles.webWrapper : styles.nativeWrapper}>
          <View style={isWeb ? styles.webContainer : styles.nativeWrapper}>
            <Stack
              screenOptions={{
                headerStyle: {
                  backgroundColor: colors.background,
                },
                headerTintColor: colors.textPrimary,
                headerTitleStyle: {
                  fontWeight: "600",
                },
                contentStyle: {
                  backgroundColor: colors.background,
                },
                headerShown: false,
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="groups/create"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="groups/join"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen name="groups/[groupId]/index" options={{ headerShown: false }} />
              <Stack.Screen
                name="groups/[groupId]/members"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="groups/[groupId]/expenses"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="expenses/create"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen
                name="personal-expenses/create"
                options={{ presentation: "modal", headerShown: false }}
              />
              <Stack.Screen name="expenses/[expenseId]/index" options={{ headerShown: false }} />
              <Stack.Screen
                name="expenses/[expenseId]/payment"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="expenses/[expenseId]/review"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="balances/[groupId]" options={{ headerShown: false }} />
            </Stack>
            <NotificationToast />
          </View>
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  nativeWrapper: {
    flex: 1,
  },
  webWrapper: {
    flex: 1,
    backgroundColor: "#ECEAE3",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  webContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 440,
    maxHeight: 900,
    backgroundColor: colors.background,
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: "#202923",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
  },
});

