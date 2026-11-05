import Ionicons from "@expo/vector-icons/Ionicons";
import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { PressableScale } from "@/components/ui/pressable-scale";
import { Palette } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

type CollapsingTopBarProps = {
  title: string;
  topInset: number;
  scrollY: SharedValue<number>;
  /** Scroll offset at which the bar becomes fully solid. */
  collapseAt: number;
  onBack: () => void;
  rightAction?: ReactNode;
};

/** Floating glass buttons over a hero that morph into a solid titled bar on scroll. */
export function CollapsingTopBar({
  title,
  topInset,
  scrollY,
  collapseAt,
  onBack,
  rightAction,
}: CollapsingTopBarProps) {
  const fadeStart = collapseAt - 90;

  // Solid layer faded by opacity; an animated rgba() background let content
  // show through the bar on Android.
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [fadeStart, collapseAt], [0, 1], Extrapolation.CLAMP),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [collapseAt - 30, collapseAt], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollY.value, [collapseAt - 30, collapseAt], [8, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      scrollY.value,
      [fadeStart, collapseAt],
      ["rgba(6, 12, 36, 0.36)", Palette.card],
    ),
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [fadeStart, collapseAt], [1, 0], Extrapolation.CLAMP),
  }));

  const darkIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [fadeStart, collapseAt], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={[styles.bar, { paddingTop: topInset + 8 }]}>
      <Animated.View pointerEvents="none" style={[styles.barBackground, barStyle]} />
      <PressableScale
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
      >
        <Animated.View style={[styles.button, buttonStyle]}>
          <Animated.View style={[styles.iconLayer, iconStyle]}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Animated.View>
          <Animated.View style={[styles.iconLayer, darkIconStyle]}>
            <Ionicons name="chevron-back" size={22} color={Palette.ink} />
          </Animated.View>
        </Animated.View>
      </PressableScale>

      <Animated.View style={[styles.titleWrap, titleStyle]}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </Animated.View>

      <View style={styles.right}>{rightAction}</View>
    </View>
  );
}

const BUTTON = 44;

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    elevation: 20,
  },
  barBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Palette.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(10, 16, 36, 0.08)",
  },
  button: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
  },
  iconLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: "center",
  },
  title: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 17,
    color: Palette.ink,
  },
  right: {
    width: BUTTON,
    height: BUTTON,
  },
});
