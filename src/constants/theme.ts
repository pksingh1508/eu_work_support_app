import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#131B2E",
    background: "#FAF8FF",
    backgroundElement: "#F2F3FF",
    backgroundSelected: "#E2E7FF",
    textSecondary: "#5F6678",
    primary: "#0058BC",
    primaryContainer: "#0070EB",
    onPrimary: "#FFFFFF",
    surface: "#FAF8FF",
    surfaceLowest: "#FFFFFF",
    surfaceLow: "#F2F3FF",
    surfaceHigh: "#E2E7FF",
    outlineVariant: "#8C93A6",
    error: "#BA1A1A",
    errorContainer: "#FFEDEA",
    tertiary: "#C15300",
  },
  dark: {
    text: "#F6F7FF",
    background: "#101626",
    backgroundElement: "#1B2438",
    backgroundSelected: "#26324B",
    textSecondary: "#C5CAD8",
    primary: "#8FBEFF",
    primaryContainer: "#4A93F1",
    onPrimary: "#07111F",
    surface: "#101626",
    surfaceLowest: "#182035",
    surfaceLow: "#1B2438",
    surfaceHigh: "#26324B",
    outlineVariant: "#747D91",
    error: "#FFB4AB",
    errorContainer: "#3E1110",
    tertiary: "#FFB787",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Gradients = {
  primary: ["#0058BC", "#0070EB"] as const,
} as const;

export const Radii = {
  flag: 4,
  interactive: 8,
  md: 12,
  xl: 24,
} as const;

export const Shadows = {
  ambient: {
    shadowColor: "#131B2E",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 3,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 120, android: 96 }) ?? 0;
export const MaxContentWidth = 800;
