import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { PressableScale } from "@/components/ui/pressable-scale";
import { Elevation, Palette } from "@/constants/theme";

type IconButtonVariant = "solid" | "tonal" | "glass" | "primary" | "plain";

type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  size?: number;
  iconSize?: number;
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const variantStyles: Record<IconButtonVariant, { bg: string; fg: string }> = {
  solid: { bg: Palette.card, fg: Palette.ink },
  tonal: { bg: Palette.well, fg: Palette.ink },
  glass: { bg: "rgba(6, 12, 36, 0.36)", fg: Palette.white },
  primary: { bg: Palette.primary, fg: Palette.white },
  plain: { bg: "transparent", fg: Palette.ink },
};

/** Circular icon-only control with a 44dp+ touch target. */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = "solid",
  size = 44,
  iconSize = 21,
  color,
  disabled,
  style,
}: IconButtonProps) {
  const tokens = variantStyles[variant];

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic="selection"
      scaleTo={0.9}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: tokens.bg },
        variant === "solid" ? [Elevation.hairline, styles.solidBorder] : null,
        variant === "glass" ? styles.glassBorder : null,
        style,
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={color ?? tokens.fg} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  solidBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.hairline,
  },
  glassBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.28)",
  },
});
