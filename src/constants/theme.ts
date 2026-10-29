import { Platform } from "react-native";

import { FontFamily } from "@/lib/fonts";

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
    sans: FontFamily.body,
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: FontFamily.headingExtraBold,
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: FontFamily.bodySemiBold,
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: FontFamily.body,
    serif: FontFamily.headingExtraBold,
    rounded: FontFamily.bodySemiBold,
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

export const BottomTabInset = Platform.select({ ios: 124, android: 116 }) ?? 0;
export const MaxContentWidth = 800;

export const Palette = {
  ink: "#131B2E",
  inkSoft: "#2A3550",
  muted: "#5F6678",
  subtle: "#8C93A6",
  canvas: "#F6F7FB",
  card: "#FFFFFF",
  tint: "#EAF1FF",
  tintStrong: "#D6E4FF",
  primary: "#0058BC",
  primaryBright: "#2F7BF5",
  success: "#1F8A5B",
  successTint: "#E3F5EC",
  danger: "#D83B3B",
  dangerTint: "#FFF0F0",
  hairline: "rgba(19, 27, 46, 0.06)",
  scrim: "rgba(8, 14, 28, 0.85)",
} as const;

export const HeroGradient = ["#0B1F4B", "#0058BC", "#3A8DFF"] as const;

export const Elevation = {
  card: {
    shadowColor: "#16234A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 3,
  },
  floating: {
    shadowColor: "#0B1A3A",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 12,
  },
} as const;

export const Motion = {
  pressScale: 0.97,
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
  softSpring: { damping: 22, stiffness: 140, mass: 1 },
  stagger: 60,
  maxStaggerDelay: 360,
} as const;
