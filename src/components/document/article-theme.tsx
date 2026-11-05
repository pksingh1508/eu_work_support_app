import { createContext, useContext, useMemo, type PropsWithChildren } from "react";
import { StyleSheet } from "react-native";

import { Palette } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

/**
 * Reading typography for guides. Body copy follows Android's Body Large
 * (16sp / 1.6 line height) with generous paragraph spacing; every size scales
 * with the reader's text-size preference on top of the system font scale.
 */
function createArticleStyles(scale: number) {
  const size = (value: number) => Math.round(value * scale);

  return StyleSheet.create({
    headline: {
      fontFamily: FontFamily.displayBold,
      fontSize: size(21),
      lineHeight: size(28),
      letterSpacing: -0.4,
      color: Palette.ink,
    },
    lead: {
      fontFamily: FontFamily.body,
      fontSize: size(18),
      lineHeight: size(29),
      color: Palette.inkSoft,
    },
    h2: {
      fontFamily: FontFamily.displayBold,
      fontSize: size(21),
      lineHeight: size(28),
      letterSpacing: -0.4,
      color: Palette.ink,
    },
    h3: {
      fontFamily: FontFamily.displayBold,
      fontSize: size(17),
      lineHeight: size(24),
      letterSpacing: -0.2,
      color: Palette.ink,
    },
    body: {
      fontFamily: FontFamily.body,
      fontSize: size(16),
      lineHeight: size(26),
      color: Palette.bodyText,
    },
    bodyStrong: {
      fontFamily: FontFamily.bodySemiBold,
      color: Palette.ink,
    },
    link: {
      fontFamily: FontFamily.bodyMedium,
      color: Palette.primary,
      textDecorationLine: "underline",
    },
    small: {
      fontFamily: FontFamily.body,
      fontSize: size(14),
      lineHeight: size(21),
      color: Palette.muted,
    },
    label: {
      fontFamily: FontFamily.displaySemiBold,
      fontSize: size(13),
      lineHeight: size(18),
      color: Palette.muted,
    },
    cellTitle: {
      fontFamily: FontFamily.displayBold,
      fontSize: size(16),
      lineHeight: size(22),
      color: Palette.ink,
    },
    question: {
      fontFamily: FontFamily.displaySemiBold,
      fontSize: size(16),
      lineHeight: size(23),
      color: Palette.ink,
    },
  });
}

export type ArticleStyles = ReturnType<typeof createArticleStyles>;

export const READER_SCALES = [0.9, 1, 1.12, 1.25] as const;
export type ReaderScale = (typeof READER_SCALES)[number];

const ArticleStyleContext = createContext<ArticleStyles>(createArticleStyles(1));

export function ArticleStyleProvider({ scale, children }: PropsWithChildren<{ scale: number }>) {
  const styles = useMemo(() => createArticleStyles(scale), [scale]);
  return <ArticleStyleContext.Provider value={styles}>{children}</ArticleStyleContext.Provider>;
}

export function useArticleStyles() {
  return useContext(ArticleStyleContext);
}
