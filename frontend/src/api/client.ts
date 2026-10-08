/**
 * Axios HTTP client configured with baseURL and Firebase Bearer authentication interceptor.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { getIdToken } from "../services/firebase";
import { getStoredToken } from "../services/storage";

// Default to emulator/localhost/LAN IP
const getDefaultApiUrl = () => {
  // If explicitly configured to a remote/non-localhost domain, use it
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }

  // On Web, localhost:8000 works directly
  if (Platform.OS === "web") {
    return envUrl || "http://localhost:8000";
  }

  // On physical mobile devices running Expo Go, extract the laptop host IP from hostUri
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    if (host) {
      return `http://${host}:8000`;
    }
  }

  // Android emulator fallback
  return Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";
};

export const API_BASE_URL = getDefaultApiUrl();


export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 35000,
});

// Request interceptor: Attach Firebase ID Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // 1. Try to get live token from Firebase Auth
      let token = await getIdToken();
      // 2. Fall back to securely stored token
      if (!token) {
        token = await getStoredToken();
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("Failed to attach auth token to request:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract user-friendly error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string | Array<{ msg: string }> }>) => {
    let friendlyMessage = "Something went wrong. Please try again.";

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (typeof data?.detail === "string") {
        friendlyMessage = data.detail;
      } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
        // Pydantic validation error format
        friendlyMessage = data.detail.map((d) => d.msg).join(", ");
      } else {
        switch (status) {
          case 401:
            friendlyMessage = "Authentication session expired. Please sign in again.";
            break;
          case 403:
            friendlyMessage = "You do not have permission to perform this action.";
            break;
          case 404:
            friendlyMessage = "The requested item was not found.";
            break;
          case 409:
            friendlyMessage = "A conflict occurred with this request.";
            break;
          case 422:
            friendlyMessage = "Invalid data provided. Please check your inputs.";
            break;
          case 500:
            friendlyMessage = "Server error. Please try again later.";
            break;
        }
      }
    } else if (error.request) {
      friendlyMessage = "Network error: unable to reach the server. Please check your connection.";
    }

    return Promise.reject(new Error(friendlyMessage));
  }
);
