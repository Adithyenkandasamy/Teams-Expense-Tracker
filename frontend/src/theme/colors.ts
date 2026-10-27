/**
 * Clean, modern light theme palette with high-precision typography and crisp contrast.
 * Slate & Zinc neutrals with vibrant, clear semantic accents.
 */

const lightColors = {
  // Brand / Primary (High-contrast slate black on light)
  primary: "#0F172A",          // Slate 900
  primaryDark: "#020617",      // Slate 950
  primaryLight: "#1E293B",     // Slate 800
  primaryMuted: "rgba(15, 23, 42, 0.06)",

  // Secondary
  secondary: "#F1F5F9",        // Slate 100
  secondaryMuted: "rgba(15, 23, 42, 0.04)",

  // Backgrounds & Surfaces (Light Palette)
  background: "#F8FAFC",       // Clean soft off-white Slate-50
  surface: "#FFFFFF",          // Crisp white card surface
  surfaceElevated: "#F1F5F9",  // Subtle elevated surface / pills / input background
  surfaceBorder: "#E2E8F0",    // Crisp 1px slate-200 border
  borderLight: "#F1F5F9",      // Very subtle divider

  // Text
  textPrimary: "#0F172A",      // Crisp high-contrast Slate-900
  textSecondary: "#475569",    // Highly readable Slate-600
  textMuted: "#94A3B8",        // Neutral Slate-400
  textInverse: "#FFFFFF",      // Pure white for primary buttons & dark chips

  // Status colors (Clean, modern semantic accents)
  status: {
    paid: "#059669",
    paidBg: "#ECFDF5",
    pending: "#D97706",
    pendingBg: "#FFFBEB",
    submitted: "#2563EB",
    submittedBg: "#EFF6FF",
    rejected: "#DC2626",
    rejectedBg: "#FEF2F2",
    active: "#0F172A",
    readyToClose: "#059669",
    readyToCloseBg: "#ECFDF5",
    closed: "#64748B",
    closedBg: "#F1F5F9",
  },

  // Action states
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  success: "#059669",
  warning: "#D97706",
  info: "#2563EB",

  // Shadows
  shadow: "rgba(15, 23, 42, 0.08)",
} as const;

const darkColors = {
  ...lightColors,
  primary: "#E2E8F0",
  primaryDark: "#CBD5E1",
  primaryLight: "#F1F5F9",
  primaryMuted: "rgba(226, 232, 240, 0.10)",
  secondary: "#1E293B",
  secondaryMuted: "rgba(226, 232, 240, 0.06)",
  background: "#0B1220",
  surface: "#111B2B",
  surfaceElevated: "#1B293B",
  surfaceBorder: "#26364A",
  borderLight: "#1B293B",
  textPrimary: "#F1F5F9",
  textSecondary: "#B7C4D3",
  textMuted: "#8292A6",
  textInverse: "#0B1220",
  status: {
    ...lightColors.status,
    paidBg: "#12372F",
    pendingBg: "#3A2B14",
    submittedBg: "#172E50",
    rejectedBg: "#3B2025",
    active: "#E2E8F0",
    readyToCloseBg: "#12372F",
    closedBg: "#1B293B",
  },
  dangerBg: "#3B2025",
  shadow: "rgba(0, 0, 0, 0.22)",
} as const;

// Screen styles read this palette when their modules load, matching the system theme at launch.
export const colors = Appearance.getColorScheme() === "dark" ? darkColors : lightColors;

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
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sm: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
} as const;

export const typography = {
  h1: { fontSize: 26, fontWeight: "700" as const, color: colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: "600" as const, color: colors.textPrimary, letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: "600" as const, color: colors.textPrimary, letterSpacing: -0.2 },
  body1: { fontSize: 15, fontWeight: "400" as const, color: colors.textPrimary },
  body2: { fontSize: 14, fontWeight: "400" as const, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: "500" as const, color: colors.textMuted },
  amount: { fontSize: 24, fontWeight: "700" as const, color: colors.textPrimary, letterSpacing: -0.5 },
} as const;
import { Appearance } from "react-native";

