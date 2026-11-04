import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";

import { Palette, Radii, Type } from "@/constants/theme";

type NoticeTone = "info" | "error" | "success" | "warning";

const tones: Record<NoticeTone, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  info: { bg: Palette.tint, fg: Palette.primary, icon: "information-circle" },
  error: { bg: Palette.dangerTint, fg: Palette.danger, icon: "alert-circle" },
  success: { bg: Palette.successTint, fg: Palette.success, icon: "checkmark-circle" },
  warning: { bg: Palette.warningTint, fg: Palette.warning, icon: "warning" },
};

type InlineNoticeProps = {
  message: string;
  title?: string;
  tone?: NoticeTone;
  style?: StyleProp<ViewStyle>;
};

/** Compact inline banner for form feedback. */
export function InlineNotice({ message, title, tone = "info", style }: InlineNoticeProps) {
  const colors = tones[tone];

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOut.duration(140)}
      style={[styles.notice, { backgroundColor: colors.bg }, style]}
      accessibilityRole={tone === "error" ? "alert" : "text"}
    >
      <Ionicons name={colors.icon} size={18} color={colors.fg} style={styles.icon} />
      <View style={styles.text}>
        {title ? <Text style={[styles.title, { color: colors.fg }]}>{title}</Text> : null}
        <Text style={[styles.message, { color: tone === "info" ? Palette.inkSoft : colors.fg }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  icon: {
    marginTop: 1,
  },
  text: {
    flex: 1,
  },
  title: {
    ...Type.label,
    marginBottom: 2,
  },
  message: {
    ...Type.callout,
  },
});
