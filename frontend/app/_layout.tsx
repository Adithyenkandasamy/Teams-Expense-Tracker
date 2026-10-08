import React, { useEffect } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { colors } from "../src/theme/colors";

import { onAuthStateChanged } from "../src/services/firebase";
import { auth } from "../src/services/firebase";
import { useAuthStore } from "../src/store/authStore";
import { getMe } from "../src/api/auth";
import { getGroups } from "../src/api/groups";
import { getGroupExpenses } from "../src/api/expenses";
import {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
  broadcastNotification,
} from "../src/services/notifications";
import { NotificationToast } from "../src/components/common/NotificationToast";

// Initialize TanStack Query Client with 5s real-time multi-user synchronization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 3, // 3 seconds
      refetchInterval: 5000, // Background poll every 5s for real-time updates across users
      refetchOnWindowFocus: true, // Auto-update immediately when user switches tabs or focuses app
      refetchOnReconnect: true,
    },
  },
});

function RealtimeSyncListener() {
  const user = useAuthStore((state) => state.user);
  const prevExpenseIdsRef = React.useRef<Set<string>>(new Set());
  const initialLoadRef = React.useRef(false);

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: getGroups,
    enabled: !!user,
  });

  const { data: allExpenses = [] } = useQuery({
    queryKey: ["allExpenses", groups.map((g) => g.id)],
    queryFn: async () => {
      if (!groups || groups.length === 0) return [];
      const promises = groups.map((g) => getGroupExpenses(g.id).catch(() => []));
      const res = await Promise.all(promises);
      return res.flat();
    },
    enabled: !!user && groups.length > 0,
  });

  useEffect(() => {
    if (!user || allExpenses.length === 0) return;

    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      prevExpenseIdsRef.current = new Set(allExpenses.map((e: any) => e.id));
      return;
    }

    for (const exp of allExpenses as any[]) {
      if (!prevExpenseIdsRef.current.has(exp.id)) {
        prevExpenseIdsRef.current.add(exp.id);
        // Only notify if created by someone else
        if (exp.created_by !== user.id) {
          const creatorName = exp.creator?.name || "A roommate";
          broadcastNotification(
            "New Expense Added",
            `${creatorName} added '${exp.description}' — ₹${exp.amount}`,
            {
              type: "NEW_EXPENSE",
              route: `/expenses/${exp.id}`,
              data: { expenseId: exp.id },
            }
          );
        }
      }
    }
  }, [allExpenses, user]);

  return null;
}

export default function RootLayout() {
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
    const notificationCleanup = setupNotificationListeners();

    return () => {
      unsubscribe();
      notificationCleanup();
    };
  }, []);

  const isWeb = Platform.OS === "web";

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
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
            <RealtimeSyncListener />
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
    backgroundColor: "#000000",
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
  },
});

