/**
 * Push & System notifications service.
 * Supports:
 * - HTML5 Desktop Web Notifications (Browser when tab is in background or minimized)
 * - Expo / FCM Push Notifications on Mobile devices
 * - In-app notification toast trigger helper
 */

import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { registerDeviceToken } from "../api/notifications";
import { useNotificationStore } from "../store/notificationStore";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: any = null;
if (!isExpoGo && Platform.OS !== "web") {
  try {
    Notifications = require("expo-notifications");
    if (Notifications?.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (err) {
    console.warn("Could not load expo-notifications:", err);
  }
}

/**
 * Request Web browser notification permission (Firefox, Chrome, Safari, Edge).
 */
export async function requestWebNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== "web" || typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  try {
    if (Notification.permission === "granted") {
      return true;
    }
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
  } catch (e) {
    console.warn("Could not request web notification permission:", e);
  }
  return false;
}

/**
 * Display native OS/browser system notification (outside the app / in background).
 */
export function showSystemNotification(title: string, body: string, data?: any) {
  if (Platform.OS === "web" && typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      try {
        const notif = new Notification(title, {
          body,
          icon: "/favicon.ico",
          data,
        });
        notif.onclick = () => {
          window.focus();
        };
      } catch (e) {
        console.warn("Web desktop notification error:", e);
      }
    }
  } else if (!isExpoGo && Notifications?.scheduleNotificationAsync) {
    try {
      Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
        },
        trigger: null, // show immediately
      });
    } catch (e) {
      console.warn("Mobile local notification error:", e);
    }
  }
}

/**
 * Broadcast notification both INSIDE the app (floating toast) and OUTSIDE the app (OS/browser).
 */
export function broadcastNotification(
  title: string,
  body: string,
  options?: { type?: string; route?: string; data?: any }
) {
  // 1. In-app Toast banner & Notification History
  useNotificationStore.getState().showToast({
    title,
    body,
    type: options?.type || "INFO",
    route: options?.route,
  });

  useNotificationStore.getState().addNotification({
    title,
    body,
    type: options?.type || "INFO",
    route: options?.route,
  });

  // 2. Out-of-app OS / Browser Notification
  showSystemNotification(title, body, options?.data);
}

/**
 * Requests push notification permissions and registers device token with FastAPI backend.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web") {
    // Request browser notification permission for Web
    await requestWebNotificationPermission();
    return null;
  }

  if (isExpoGo || !Notifications) {
    return null;
  }

  let token: string | null = null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const pushTokenData = await Notifications.getDevicePushTokenAsync();
    token = pushTokenData.data;

    if (token) {
      const deviceType = Platform.OS === "android" ? "android" : "ios";
      await registerDeviceToken({
        token,
        device_type: deviceType,
      });
    }
  } catch (error) {
    console.warn("Failed to register push token with backend:", error);
  }

  return token;
}

export const registerForPushNotifications = registerForPushNotificationsAsync;

/**
 * Sets up foreground and background notification response listeners.
 */
export function setupNotificationListeners(
  onNavigate?: (route: string, params?: Record<string, any>) => void
): () => void {
  if (isExpoGo || !Notifications?.addNotificationResponseReceivedListener) {
    return () => {};
  }

  try {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response?.notification?.request?.content?.data;
      if (onNavigate) {
        if (data?.expenseId) {
          onNavigate(`/expenses/${data.expenseId}`);
        } else if (data?.groupId) {
          onNavigate(`/groups/${data.groupId}`);
        } else if (data?.type === "PAYMENT_SUBMITTED" && data?.expenseId) {
          onNavigate(`/expenses/${data.expenseId}/review`);
        }
      }
    });

    return () => {
      responseSubscription.remove();
    };
  } catch {
    return () => {};
  }
}
