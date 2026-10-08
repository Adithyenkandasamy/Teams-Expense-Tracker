/**
 * Clean, premium Shadcn-inspired monochrome dark theme palette.
 * Pure deep zinc/black backgrounds, crisp 1px borders, and high-contrast white accents.
 */

export const colors = {
  // Brand / Primary (High-contrast monochrome: pure crisp white on dark)
  primary: "#FAFAFA",
  primaryDark: "#E4E4E7",
  primaryLight: "#FFFFFF",
  primaryMuted: "rgba(255, 255, 255, 0.08)",

  // Secondary
  secondary: "#27272A",
  secondaryMuted: "rgba(255, 255, 255, 0.04)",

  // Backgrounds & Surfaces (Shadcn Dark Neutral / Zinc)
  background: "#09090B",       // Pure deep neutral black
  surface: "#121215",          // Card surface
  surfaceElevated: "#18181B",  // Elevated surfaces / modals / inputs
  surfaceBorder: "#27272A",    // Sharp 1px zinc border
  borderLight: "#3F3F46",      // Subtle hover / highlight border

  // Text
  textPrimary: "#FAFAFA",      // Clean bright white
  textSecondary: "#A1A1AA",    // Neutral zinc-400
  textMuted: "#71717A",        // Zinc-500
  textInverse: "#09090B",      // Pure black for high-contrast white buttons

  // Status colors (Clean, modern accents)
  status: {
    paid: "#FAFAFA",
    paidBg: "rgba(255, 255, 255, 0.08)",
    pending: "#F59E0B",
    pendingBg: "rgba(245, 158, 11, 0.12)",
    submitted: "#A1A1AA",
    submittedBg: "rgba(161, 161, 170, 0.12)",
    rejected: "#EF4444",
    rejectedBg: "rgba(239, 68, 68, 0.12)",
    active: "#FAFAFA",
    readyToClose: "#E4E4E7",
    readyToCloseBg: "rgba(228, 228, 231, 0.12)",
    closed: "#71717A",
    closedBg: "rgba(113, 113, 122, 0.12)",
  },

  // Action states
  danger: "#EF4444",
  dangerBg: "rgba(239, 68, 68, 0.12)",
  success: "#FAFAFA",
  warning: "#F59E0B",
  info: "#A1A1AA",

  // Shadows
  shadow: "#000000",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
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
