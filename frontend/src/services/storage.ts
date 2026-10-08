/**
 * Sensitive and local storage using Expo SecureStore on native and AsyncStorage on web.
 */

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types/models";

const TOKEN_KEY = "team_expense_auth_token";
const USER_KEY = "team_expense_user_data";

const isWeb = Platform.OS === "web";

export async function getStoredToken(): Promise<string | null> {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.warn("Failed to save auth token to storage:", error);
  }
}

export async function clearStoredToken(): Promise<void> {
  try {
    if (isWeb) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.warn("Failed to delete auth token from storage:", error);
  }
}

export async function getStoredUser(): Promise<User | null> {
  try {
    const raw = isWeb
      ? await AsyncStorage.getItem(USER_KEY)
      : await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: User): Promise<void> {
  try {
    const str = JSON.stringify(user);
    if (isWeb) {
      await AsyncStorage.setItem(USER_KEY, str);
    } else {
      await SecureStore.setItemAsync(USER_KEY, str);
    }
  } catch (error) {
    console.warn("Failed to save user data to storage:", error);
  }
}

export async function clearStoredUser(): Promise<void> {
  try {
    if (isWeb) {
      await AsyncStorage.removeItem(USER_KEY);
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  } catch (error) {
    console.warn("Failed to delete user data from storage:", error);
  }
}

export async function clearAllStorage(): Promise<void> {
  await clearStoredToken();
  await clearStoredUser();
}

