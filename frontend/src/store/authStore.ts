/**
 * Small client-side authentication store using Zustand.
 */

import { create } from "zustand";
import { User } from "../types/models";
import { FirebaseUser, firebaseSignOut, auth } from "../services/firebase";
import { clearAllStorage, setStoredToken, setStoredUser } from "../services/storage";

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setFirebaseUser: (fbUser: FirebaseUser | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  firebaseUser: null,
  token: null,
  isLoading: true,

  setUser: (user) => {
    set({ user });
    if (user) {
      setStoredUser(user);
    }
  },

  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),

  setToken: (token) => {
    set({ token });
    if (token) {
      setStoredToken(token);
    }
  },

  setIsLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn("Error signing out from Firebase:", err);
    }
    await clearAllStorage();
    set({ user: null, firebaseUser: null, token: null, isLoading: false });
  },
}));
