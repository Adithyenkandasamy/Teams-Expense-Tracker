/**
 * Push notifications service with Expo Notifications & FCM token registration.
 * Gracefully degrades in Expo Go (since SDK 53 removed remote push from Expo Go client).
 */

import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { registerDeviceToken } from "../api/notifications";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: any = null;
if (!isExpoGo || Platform.OS === "web") {
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
 * Requests push notification permissions and registers device token with FastAPI backend.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === "web" || isExpoGo || !Notifications) {
    // Push notifications are not configured on Web or Expo Go
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
