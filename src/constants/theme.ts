import { Platform, type TextStyle } from "react-native";

import { FontFamily } from "@/lib/fonts";

/* -------------------------------------------------------------------------- */
/*                                   Palette                                  */
/* -------------------------------------------------------------------------- */

/**
 * "Midnight Atelier" — an EU-inspired palette: deep navy ink, a confident
 * cobalt primary and a restrained EU-gold accent reserved for premium moments.
 */
export const Palette = {
  ink: "#0A1024",
  inkSoft: "#1E2842",
  /** Long-form reading text: softer than ink, ~12:1 on white and canvas. */
  bodyText: "#2B3346",
  muted: "#5A6378",
  subtle: "#959EB1",
  /** Input placeholder: lighter than typed text but still ~4.5:1. */
  placeholder: "#6E778B",
  faint: "#C6CCD8",

  canvas: "#F3F5F9",
  card: "#FFFFFF",
  cardMuted: "#F7F8FB",
  well: "#ECEFF5",

  primary: "#1D4ED8",
  primaryDeep: "#0B2A8F",
  primaryBright: "#3B6CFF",
  tint: "#EDF2FF",
  tintStrong: "#D9E4FF",

  navy: "#060C24",
  navySoft: "#101A3D",

  gold: "#F2B33D",
  goldSoft: "#FFF5DE",
  goldInk: "#7A4F00",

  success: "#12805C",
  successTint: "#E2F5EC",
  warning: "#B4610C",
  warningTint: "#FFF4E3",
  danger: "#D92D3A",
  dangerTint: "#FFEEEF",

  white: "#FFFFFF",
  hairline: "rgba(10, 16, 36, 0.07)",
  divider: "rgba(10, 16, 36, 0.06)",
  scrim: "rgba(6, 12, 36, 0.55)",
} as const;

export const HeroGradient = ["#050A20", "#0B2A8F", "#2F62F5"] as const;
export const NavyGradient = ["#060C24", "#0E1C52", "#1A3A9E"] as const;
export const PrimaryGradient = ["#2A5BF0", "#1D4ED8", "#1740B8"] as const;
export const GoldGradient = ["#FFD77A", "#F2B33D", "#D9921A"] as const;

/** Light/dark sets consumed by the remaining template components. */
export const Colors = {
  light: {
    text: Palette.ink,
    background: Palette.canvas,
    backgroundElement: Palette.cardMuted,
    backgroundSelected: Palette.tint,
    textSecondary: Palette.muted,
    primary: Palette.primary,
    onPrimary: Palette.white,
  },
  dark: {
    text: "#F4F6FF",
    background: "#0B1020",
    backgroundElement: "#161D33",
    backgroundSelected: "#1F2A47",
    textSecondary: "#B8C0D4",
    primary: "#8FB0FF",
    onPrimary: "#06102A",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/* -------------------------------------------------------------------------- */
/*                                 Typography                                 */
/* -------------------------------------------------------------------------- */

export const Type = {
  hero: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1.2,
  },
  display: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
  },
  title1: {
    fontFamily: FontFamily.displayBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.7,
  },
  title2: {
    fontFamily: FontFamily.displayBold,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.45,
  },
  title3: {
    fontFamily: FontFamily.displayBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  headline: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.15,
  },
  body: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    lineHeight: 23,
  },
  bodyMedium: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
  },
  callout: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  footnote: {
    fontFamily: FontFamily.body,
    fontSize: 13,
    lineHeight: 19,
  },
  caption: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  label: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  button: {
    fontFamily: FontFamily.displayBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  overline: {
    fontFamily: FontFamily.displayBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  serifAccent: {
    fontFamily: FontFamily.serifItalic,
    letterSpacing: -0.4,
  },
} satisfies Record<string, TextStyle>;

/** Legacy alias used by template components. */
export const Fonts = {
  sans: FontFamily.body,
  serif: FontFamily.serif,
  rounded: FontFamily.displaySemiBold,
  mono: "monospace",
};

/* -------------------------------------------------------------------------- */
/*                               Layout & shape                               */
/* -------------------------------------------------------------------------- */

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  gutter: 20,
} as const;

export const Radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  sheet: 32,
  pill: 999,
  flag: 5,
} as const;

export const BottomTabInset = Platform.select({ ios: 124, android: 116 }) ?? 0;
export const MaxContentWidth = 800;

/* -------------------------------------------------------------------------- */
/*                                  Elevation                                 */
/* -------------------------------------------------------------------------- */

/** Soft, navy-tinted shadows — never grey "Material" smudges. */
export const Elevation = {
  hairline: {
    shadowColor: "#0A1024",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: "#16234A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  raised: {
    shadowColor: "#16234A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  floating: {
    shadowColor: "#0B1A3A",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 12,
  },
  glow: {
    shadowColor: "#1D4ED8",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 8,
  },
} as const;

/** @deprecated use Elevation.card */
export const Shadows = { ambient: Elevation.card } as const;

/* -------------------------------------------------------------------------- */
/*                                   Motion                                   */
/* -------------------------------------------------------------------------- */

export const Motion = {
  pressScale: 0.97,
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
  softSpring: { damping: 22, stiffness: 140, mass: 1 },
  snappy: { damping: 20, stiffness: 320, mass: 0.7 },
  stagger: 40,
  maxStaggerDelay: 160,
  fast: 160,
  base: 240,
  /** Entrance of a single item (FadeInView). */
  enter: 280,
  /** Loaded content replacing a skeleton (ContentReveal). */
  reveal: 200,
} as const;
