import { useEffect, useState, type PropsWithChildren } from "react";
import {
  StyleSheet,
  View,
  type DimensionValue,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  makeMutable,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { fadeSafeProps } from "@/components/ui/fade-in-view";
import { GradientFill } from "@/components/ui/gradient-fill";
import { Palette, Radii } from "@/constants/theme";

/**
 * One shared clock drives every skeleton on screen, so all shimmers sweep in
 * perfect sync (a small detail that separates premium loaders from busy ones).
 */
const shimmerProgress = makeMutable(0);
let activeSkeletons = 0;

function useSharedShimmer() {
  useEffect(() => {
    activeSkeletons += 1;

    if (activeSkeletons === 1) {
      shimmerProgress.value = 0;
      shimmerProgress.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        -1,
        false,
      );
    }

    return () => {
      activeSkeletons -= 1;

      if (activeSkeletons === 0) {
        cancelAnimation(shimmerProgress);
      }
    };
  }, []);
}

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  circle?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Use on dark surfaces (heroes). */
  tone?: "light" | "dark";
};

const SHIMMER_WIDTH = 160;

/** Shimmering placeholder block. */
export function Skeleton({
  width = "100%",
  height = 14,
  radius = Radii.xs,
  circle = false,
  style,
  tone = "light",
}: SkeletonProps) {
  useSharedShimmer();
  const [layoutWidth, setLayoutWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setLayoutWidth((current) => (current === nextWidth ? current : nextWidth));
  };

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          -SHIMMER_WIDTH + shimmerProgress.value * (layoutWidth + SHIMMER_WIDTH * 2),
      },
    ],
  }));

  const size = typeof height === "number" ? height : undefined;

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.base,
        {
          width: circle && size ? size : width,
          height,
          borderRadius: circle && size ? size / 2 : radius,
          backgroundColor: tone === "dark" ? "rgba(255,255,255,0.1)" : "#E7EBF2",
        },
        style,
      ]}
    >
      {layoutWidth > 0 ? (
        <Animated.View style={[styles.shimmer, shimmerStyle]}>
          <GradientFill
            colors={["#FFFFFF", "#FFFFFF", "#FFFFFF"]}
            opacities={tone === "dark" ? [0, 0.12, 0] : [0, 0.75, 0]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

/** Card shell used by skeleton layouts, matching real card geometry. */
export function SkeletonCard({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/**
 * Fades skeletons in. There is deliberately no exit animation: a fading-out
 * skeleton is drawn on top of the real content that replaces it, which showed
 * as ghost grey cards over the page. Content takes its place in one frame.
 */
export function SkeletonFade({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={style}
      {...fadeSafeProps}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading content"
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SHIMMER_WIDTH,
  },
  card: {
    padding: 16,
    borderRadius: Radii.xl,
    backgroundColor: Palette.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.hairline,
  },
});
