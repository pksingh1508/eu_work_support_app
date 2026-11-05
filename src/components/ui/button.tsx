import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { GradientFill } from "@/components/ui/gradient-fill";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Spinner } from "@/components/ui/spinner";
import { Elevation, Palette, PrimaryGradient, Radii, Type } from "@/constants/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "dangerSoft" | "light";
type ButtonSize = "md" | "lg";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  trailingIcon?: keyof typeof Ionicons.glyphMap;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const variantTokens: Record<
  ButtonVariant,
  { background: string; text: string; border?: string; spinnerTrack: string }
> = {
  primary: { background: Palette.primary, text: Palette.white, spinnerTrack: "rgba(255,255,255,0.28)" },
  secondary: { background: Palette.tint, text: Palette.primary, spinnerTrack: "rgba(29,78,216,0.18)" },
  outline: {
    background: Palette.card,
    text: Palette.ink,
    border: Palette.hairline,
    spinnerTrack: "rgba(10,16,36,0.12)",
  },
  ghost: { background: "transparent", text: Palette.primary, spinnerTrack: "rgba(29,78,216,0.18)" },
  danger: { background: Palette.danger, text: Palette.white, spinnerTrack: "rgba(255,255,255,0.28)" },
  dangerSoft: { background: Palette.dangerTint, text: Palette.danger, spinnerTrack: "rgba(217,45,58,0.18)" },
  light: { background: Palette.white, text: Palette.ink, spinnerTrack: "rgba(10,16,36,0.12)" },
};

/** The app's single button primitive: tactile, haptic and loading-aware. */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  icon,
  trailingIcon,
  isLoading = false,
  disabled = false,
  fullWidth = true,
  style,
  accessibilityHint,
}: ButtonProps) {
  const isInactive = disabled || isLoading;
  // A disabled primary is a quiet solid well with readable text, not a
  // half-transparent gradient (white on pale blue was ~1.8:1).
  const isDisabledPrimary = variant === "primary" && disabled && !isLoading;
  const tokens = isDisabledPrimary
    ? { background: Palette.well, text: Palette.muted, spinnerTrack: "rgba(10,16,36,0.12)" }
    : variantTokens[variant];
  const height = size === "lg" ? 56 : 46;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isInactive}
      haptic="light"
      scaleTo={0.975}
      disabledOpacity={isDisabledPrimary ? 1 : undefined}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isInactive, busy: isLoading }}
      style={[
        styles.base,
        {
          height,
          borderRadius: size === "lg" ? Radii.lg : Radii.md,
          backgroundColor: tokens.background,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          paddingHorizontal: size === "lg" ? 24 : 18,
        },
        tokens.border ? { borderWidth: 1, borderColor: tokens.border } : null,
        variant === "primary" && !isInactive ? Elevation.glow : null,
        variant === "light" ? Elevation.raised : null,
        style,
      ]}
    >
      {variant === "primary" && !isDisabledPrimary ? (
        <>
          <GradientFill colors={PrimaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View pointerEvents="none" style={styles.sheen} />
        </>
      ) : null}

      {isLoading ? (
        <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(100)}>
          <Spinner color={tokens.text} trackColor={tokens.spinnerTrack} size={22} />
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeIn.duration(140)}
          style={styles.content}
        >
          {icon ? <Ionicons name={icon} size={19} color={tokens.text} /> : null}
          <Text
            numberOfLines={1}
            style={[size === "lg" ? Type.button : styles.labelMd, { color: tokens.text }]}
          >
            {label}
          </Text>
          {trailingIcon ? <Ionicons name={trailingIcon} size={18} color={tokens.text} /> : null}
        </Animated.View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  sheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  labelMd: {
    ...Type.label,
  },
});
