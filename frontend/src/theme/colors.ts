/**
 * Modern fintech theme color palette.
 */

export const colors = {
  // Brand
  primary: "#10B981", // Emerald primary
  primaryDark: "#059669",
  primaryLight: "#34D399",
  primaryMuted: "rgba(16, 185, 129, 0.12)",

  secondary: "#6366F1", // Indigo accent
  secondaryMuted: "rgba(99, 102, 241, 0.12)",

  // Backgrounds & Surfaces (sleek dark aesthetic)
  background: "#090D16",
  surface: "#111827",
  surfaceElevated: "#1A2234",
  surfaceBorder: "#243048",
  borderLight: "#334155",

  // Text
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  textInverse: "#090D16",

  // Status colors
  status: {
    paid: "#10B981",
    paidBg: "rgba(16, 185, 129, 0.14)",
    pending: "#F59E0B",
    pendingBg: "rgba(245, 158, 11, 0.14)",
    submitted: "#3B82F6",
    submittedBg: "rgba(59, 130, 246, 0.14)",
    rejected: "#EF4444",
    rejectedBg: "rgba(239, 68, 68, 0.14)",
    active: "#3B82F6",
    readyToClose: "#8B5CF6",
    readyToCloseBg: "rgba(139, 92, 246, 0.14)",
    closed: "#64748B",
    closedBg: "rgba(100, 116, 139, 0.14)",
  },

  // Action states
  danger: "#EF4444",
  dangerBg: "rgba(239, 68, 68, 0.12)",
  success: "#10B981",
  warning: "#F59E0B",
  info: "#3B82F6",

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
  h1: { fontSize: 28, fontWeight: "700" as const, color: colors.textPrimary },
  h2: { fontSize: 22, fontWeight: "700" as const, color: colors.textPrimary },
  h3: { fontSize: 18, fontWeight: "600" as const, color: colors.textPrimary },
  body1: { fontSize: 16, fontWeight: "400" as const, color: colors.textPrimary },
  body2: { fontSize: 14, fontWeight: "400" as const, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: "500" as const, color: colors.textMuted },
  amount: { fontSize: 24, fontWeight: "700" as const, color: colors.textPrimary },
} as const;
