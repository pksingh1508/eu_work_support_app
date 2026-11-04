import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { Palette, Type } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

type BadgeTone = "primary" | "gold" | "neutral" | "success" | "danger" | "glass" | "ink";

const tones: Record<BadgeTone, { bg: string; fg: string; border?: string }> = {
  primary: { bg: Palette.tint, fg: Palette.primary },
  gold: { bg: Palette.goldSoft, fg: Palette.goldInk },
  neutral: { bg: Palette.well, fg: Palette.inkSoft },
  success: { bg: Palette.successTint, fg: Palette.success },
  danger: { bg: Palette.dangerTint, fg: Palette.danger },
  glass: { bg: "rgba(255,255,255,0.14)", fg: Palette.white, border: "rgba(255,255,255,0.24)" },
  ink: { bg: Palette.ink, fg: Palette.white },
};

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  dot?: boolean;
  size?: "sm" | "md";
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, tone = "primary", icon, dot, size = "sm", style }: BadgeProps) {
  const colors = tones[tone];
  const isMd = size === "md";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: isMd ? 12 : 9,
          paddingVertical: isMd ? 7 : 4,
        },
        colors.border ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border } : null,
        style,
      ]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: colors.fg }]} /> : null}
      {icon ? <Ionicons name={icon} size={isMd ? 14 : 12} color={colors.fg} /> : null}
      <Text style={[isMd ? styles.labelMd : styles.label, { color: colors.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Small gold "PRO" marker for premium documents. */
export function ProBadge() {
  return <Badge label="PRO" tone="gold" icon="sparkles" />;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  label: {
    fontFamily: FontFamily.displayBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.1,
  },
  labelMd: {
    ...Type.caption,
    fontFamily: FontFamily.displayBold,
  },
});
