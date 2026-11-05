import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { Button } from "@/components/ui/button";
import { FadeInView } from "@/components/ui/fade-in-view";
import { Elevation, Palette, Radii, Type } from "@/constants/theme";

type StateViewProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  tone?: "primary" | "danger" | "gold";
  actionLabel?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  bare?: boolean;
  style?: StyleProp<ViewStyle>;
};

const toneMap = {
  primary: { halo: Palette.tint, ring: Palette.tintStrong, icon: Palette.primary },
  danger: { halo: Palette.dangerTint, ring: "#FFD9DC", icon: Palette.danger },
  gold: { halo: Palette.goldSoft, ring: "#FFE7B0", icon: Palette.goldInk },
};

/** Empty / error / informational state with a layered icon halo. */
export function StateView({
  icon,
  title,
  message,
  tone = "primary",
  actionLabel,
  actionIcon,
  onAction,
  secondaryLabel,
  onSecondary,
  bare = false,
  style,
}: StateViewProps) {
  const colors = toneMap[tone];

  return (
    <FadeInView style={[styles.container, !bare && [styles.card, Elevation.card], style]}>
      <View style={[styles.haloOuter, { backgroundColor: colors.halo }]}>
        <View style={[styles.haloInner, { backgroundColor: colors.ring }]}>
          <Ionicons name={icon} size={26} color={colors.icon} />
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          trailingIcon={actionIcon}
          onPress={onAction}
          size="md"
          fullWidth={false}
          variant={tone === "danger" ? "secondary" : "primary"}
          style={styles.action}
        />
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Button
          label={secondaryLabel}
          onPress={onSecondary}
          size="md"
          variant="ghost"
          fullWidth={false}
          style={styles.secondary}
        />
      ) : null}
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: Radii.xxl,
    backgroundColor: Palette.card,
  },
  haloOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  haloInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...Type.title3,
    marginTop: 18,
    textAlign: "center",
    color: Palette.ink,
  },
  message: {
    ...Type.callout,
    marginTop: 8,
    maxWidth: 300,
    textAlign: "center",
    color: Palette.muted,
  },
  action: {
    marginTop: 22,
    alignSelf: "center",
  },
  secondary: {
    marginTop: 6,
    alignSelf: "center",
  },
});
