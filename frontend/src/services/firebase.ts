/**
 * Firebase Client SDK setup.
 * Uses client-side credentials from environment variables.
 * NO Admin SDK credentials or secret service keys are used here.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyFakeKeyForBuild",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "team-expense-tracker-95ba4.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "team-expense-tracker-95ba4",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "team-expense-tracker-95ba4.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:000000000000:android:000000000000",
};

// Initialize Firebase client app once
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

export {
  GoogleAuthProvider,
  signInWithCredential,
  firebaseSignOut,
  onAuthStateChanged,
};
export type { FirebaseUser };

/**
 * Retrieves the current Firebase user's ID token.
 */
export async function getIdToken(forceRefresh: boolean = false): Promise<string | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return await currentUser.getIdToken(forceRefresh);
}
