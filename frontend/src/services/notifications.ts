/**
 * Push notifications service with Expo Notifications & FCM token registration.
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { registerDeviceToken } from "../api/notifications";

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests push notification permissions and registers device token with FastAPI backend.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permission not granted for push notifications");
      return null;
    }

    // Get FCM / Expo device push token
    const pushTokenData = await Notifications.getDevicePushTokenAsync();
    token = pushTokenData.data;

    if (token) {
      const deviceType = Platform.OS === "android" ? "android" : Platform.OS === "ios" ? "ios" : "web";
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
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
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
}
