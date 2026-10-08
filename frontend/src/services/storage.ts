/**
 * Sensitive and local storage using Expo SecureStore.
 */

import * as SecureStore from "expo-secure-store";
import { User } from "../types/models";

const TOKEN_KEY = "team_expense_auth_token";
const USER_KEY = "team_expense_user_data";

export async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.warn("Failed to save auth token to SecureStore:", error);
  }
}

export async function clearStoredToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.warn("Failed to delete auth token from SecureStore:", error);
  }
}

export async function getStoredUser(): Promise<User | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: User): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.warn("Failed to save user data to SecureStore:", error);
  }
}

export async function clearStoredUser(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch (error) {
    console.warn("Failed to delete user data from SecureStore:", error);
  }
}

export async function clearAllStorage(): Promise<void> {
  await clearStoredToken();
  await clearStoredUser();
}
