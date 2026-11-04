import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { Palette, Type } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

export type PremiumToastVariant = "success" | "info" | "error" | "warning" | "saved" | "removed";

const variants: Record<
  PremiumToastVariant,
  { icon: keyof typeof Ionicons.glyphMap; color: string; halo: string }
> = {
  success: { icon: "checkmark", color: "#34D399", halo: "rgba(52, 211, 153, 0.16)" },
  saved: { icon: "bookmark", color: Palette.gold, halo: "rgba(242, 179, 61, 0.18)" },
  removed: { icon: "bookmark-outline", color: "#A5B4FC", halo: "rgba(165, 180, 252, 0.16)" },
  info: { icon: "information", color: "#7CA5FF", halo: "rgba(124, 165, 255, 0.16)" },
  warning: { icon: "warning", color: "#FBBF24", halo: "rgba(251, 191, 36, 0.16)" },
  error: { icon: "close", color: "#F87171", halo: "rgba(248, 113, 113, 0.16)" },
};

type PremiumToastProps = {
  variant: PremiumToastVariant;
  title: string;
  description?: string;
};

/** Floating midnight capsule — high contrast over the light UI, like a native island. */
export function PremiumToast({ variant, title, description }: PremiumToastProps) {
  const config = variants[variant];

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.capsule} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <View style={[styles.iconHalo, { backgroundColor: config.halo }]}>
          <View style={[styles.iconCore, { backgroundColor: config.color }]}>
            <Ionicons name={config.icon} size={14} color={Palette.navy} />
          </View>
        </View>
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {description ? (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  capsule: {
    width: "100%",
    maxWidth: 440,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingLeft: 12,
    paddingRight: 18,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: "#0B1228",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 14,
  },
  iconHalo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: FontFamily.displayBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.1,
    color: Palette.white,
  },
  description: {
    ...Type.footnote,
    marginTop: 1,
    color: "rgba(255,255,255,0.62)",
  },
});
