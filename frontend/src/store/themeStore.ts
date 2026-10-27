import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist } from "zustand/middleware";
import { Appearance, ColorSchemeName } from "react-native";

export type ThemeMode = "system" | "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  systemScheme: ColorSchemeName;
  setMode: (mode: ThemeMode) => void;
  setSystemScheme: (scheme: ColorSchemeName) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      systemScheme: Appearance.getColorScheme() || "light",
      setMode: (mode) => set({ mode }),
      setSystemScheme: (systemScheme) => set({ systemScheme }),
    }),
    {
      name: "expense-tracker-theme-mode",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);

// Listen to system theme updates
Appearance.addChangeListener(({ colorScheme }) => {
  useThemeStore.getState().setSystemScheme(colorScheme);
});

