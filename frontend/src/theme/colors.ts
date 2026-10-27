import { Appearance, Platform } from "react-native";
import { useThemeStore } from "../store/themeStore";

/**
 * Premium Skeuomorphic Palette
 * Financial journal, luxury digital wallet, and modern banking aesthetics.
 */

export const lightColors = {
  // Brand
  primary: "#237A57",           // Forest banker's green
  primaryDark: "#1A5C41",
  primaryLight: "#2C9168",
  primaryMuted: "rgba(35, 122, 87, 0.12)",

  // Secondary
  secondary: "#A9C8B4",         // Sage green
  secondaryMuted: "rgba(169, 200, 180, 0.22)",

  // Surfaces & Backgrounds
  background: "#F4F3ED",        // Warm physical paper tone
  surface: "#FCFBF7",           // Crisp warm card surface
  surfaceElevated: "#F5F3EB",   // Slightly elevated card layer
  surfaceBorder: "#E3E1D8",     // Subtle warm gray-green border
  borderLight: "#ECEAE1",

  // Skeuomorphic depths & tactile treatments
  cardTopHighlight: "rgba(255, 255, 255, 0.95)",
  cardBottomBorder: "rgba(32, 41, 35, 0.08)",
  recessedBg: "#ECEAE2",        // Indented/carved surface background
  recessedTopBorder: "#D2CEC1", // Inset shadow line
  recessedBottomHighlight: "rgba(255, 255, 255, 0.8)",
  buttonBevelTop: "rgba(255, 255, 255, 0.35)",
  buttonBevelBottom: "rgba(0, 0, 0, 0.22)",
  goldAccent: "#B8860B",

  // Text
  textPrimary: "#202923",       // Deep charcoal forest
  textSecondary: "#727B73",     // Warm slate green
  textMuted: "#9CA59E",
  textInverse: "#FFFFFF",

  // Balances
  positive: "#248653",
  negative: "#C65C55",

  // Status & Semantic
  danger: "#C65C55",
  dangerBg: "rgba(198, 92, 85, 0.10)",
  success: "#248653",
  warning: "#C97A1C",
  info: "#2C7A7B",

  status: {
    paid: "#248653",
    paidBg: "rgba(36, 134, 83, 0.12)",
    pending: "#C97A1C",
    pendingBg: "rgba(201, 122, 28, 0.12)",
    submitted: "#2C7A7B",
    submittedBg: "rgba(44, 122, 123, 0.12)",
    rejected: "#C65C55",
    rejectedBg: "rgba(198, 92, 85, 0.12)",
    active: "#237A57",
    readyToClose: "#248653",
    readyToCloseBg: "rgba(36, 134, 83, 0.12)",
    closed: "#727B73",
    closedBg: "rgba(114, 123, 115, 0.12)",
  },

  shadow: "rgba(32, 41, 35, 0.10)",
} as const;

export const darkColors = {
  // Brand
  primary: "#73D6A3",           // Luminous mint green
  primaryDark: "#52B784",
  primaryLight: "#8CE3B6",
  primaryMuted: "rgba(115, 214, 163, 0.16)",

  // Secondary
  secondary: "#496957",         // Deep muted sage
  secondaryMuted: "rgba(73, 105, 87, 0.28)",

  // Surfaces & Backgrounds
  background: "#171B19",        // Deep carbon-emerald black
  surface: "#242A27",           // Warm slate-black surface
  surfaceElevated: "#2D3531",   // Elevated card layer
  surfaceBorder: "#2D3531",     // Dark slate border
  borderLight: "#202623",

  // Skeuomorphic depths & tactile treatments
  cardTopHighlight: "rgba(255, 255, 255, 0.08)",
  cardBottomBorder: "rgba(0, 0, 0, 0.45)",
  recessedBg: "#1B211E",
  recessedTopBorder: "#131715",
  recessedBottomHighlight: "rgba(255, 255, 255, 0.04)",
  buttonBevelTop: "rgba(255, 255, 255, 0.22)",
  buttonBevelBottom: "rgba(0, 0, 0, 0.45)",
  goldAccent: "#E6BE68",

  // Text
  textPrimary: "#F2F5F2",       // Soft off-white
  textSecondary: "#A6B0A8",     // Soft silvery sage
  textMuted: "#768278",
  textInverse: "#171B19",

  // Balances
  positive: "#78D7A0",
  negative: "#F08C83",

  // Status & Semantic
  danger: "#F08C83",
  dangerBg: "rgba(240, 140, 131, 0.14)",
  success: "#78D7A0",
  warning: "#E8A246",
  info: "#59B5B7",

  status: {
    paid: "#78D7A0",
    paidBg: "rgba(120, 215, 160, 0.16)",
    pending: "#E8A246",
    pendingBg: "rgba(232, 162, 70, 0.16)",
    submitted: "#59B5B7",
    submittedBg: "rgba(89, 181, 183, 0.16)",
    rejected: "#F08C83",
    rejectedBg: "rgba(240, 140, 131, 0.16)",
    active: "#73D6A3",
    readyToClose: "#78D7A0",
    readyToCloseBg: "rgba(120, 215, 160, 0.16)",
    closed: "#A6B0A8",
    closedBg: "rgba(166, 176, 168, 0.16)",
  },

  shadow: "rgba(0, 0, 0, 0.50)",
} as const;

export type ThemeColors = {
  [K in keyof typeof lightColors]: (typeof lightColors)[K] extends Record<string, any>
    ? { [SK in keyof (typeof lightColors)[K]]: string }
    : string;
};

function getCurrentScheme(): "light" | "dark" {
  try {
    const { mode, systemScheme } = useThemeStore.getState();
    if (mode === "dark") return "dark";
    if (mode === "light") return "light";
    return systemScheme === "dark" ? "dark" : "light";
  } catch {
    return Appearance.getColorScheme() === "dark" ? "dark" : "light";
  }
}

export const colors: ThemeColors = getCurrentScheme() === "dark" ? darkColors : lightColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const shadows = {
  raised: {
    shadowColor: "#202923",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  card: {
    shadowColor: "#202923",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  sm: {
    shadowColor: "#202923",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: "#202923",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },
  floating: {
    shadowColor: "#202923",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
} as const;

export const typography = {
  h1: { fontSize: 26, fontWeight: "700" as const, color: colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: "600" as const, color: colors.textPrimary, letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: "600" as const, color: colors.textPrimary, letterSpacing: -0.2 },
  body1: { fontSize: 15, fontWeight: "400" as const, color: colors.textPrimary },
  body2: { fontSize: 14, fontWeight: "400" as const, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: "500" as const, color: colors.textMuted },
  amount: { fontSize: 26, fontWeight: "700" as const, color: colors.textPrimary, letterSpacing: -0.5 },
} as const;

/**
 * Hook to access reactive theme colors, mode, and setters
 */
export function useAppTheme() {
  const mode = useThemeStore((state) => state.mode);
  const systemScheme = useThemeStore((state) => state.systemScheme);
  const setMode = useThemeStore((state) => state.setMode);

  const isDark = mode === "dark" || (mode === "system" && systemScheme === "dark");
  const theme = isDark ? darkColors : lightColors;

  return {
    theme,
    colors: theme,
    isDark,
    mode,
    setMode,
    spacing,
    shadows,
    typography,
  };
}
