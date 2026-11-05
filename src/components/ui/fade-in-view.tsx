import { type PropsWithChildren } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown } from "react-native-reanimated";

import { Motion } from "@/constants/theme";

type FadeInViewProps = PropsWithChildren<{
  /** Position in a list; drives the stagger delay. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Fading a view on Android normally applies alpha to each child separately, so
 * an elevated card's shadow shows through its half-transparent fill as a grey
 * slab. Compositing offscreen fades the card and its shadow as one image.
 */
export const fadeSafeProps = { needsOffscreenAlphaCompositing: true } as const;

const ENTER_EASING = Easing.out(Easing.cubic);

/**
 * Short, staggered rise-and-fade entrance. Timed rather than sprung so items
 * are fully visible within ~0.4s; respects the system reduce-motion setting.
 */
export function FadeInView({ children, index = 0, style }: FadeInViewProps) {
  const delay = Math.min(index * Motion.stagger, Motion.maxStaggerDelay);

  return (
    <Animated.View
      entering={FadeInDown.duration(Motion.enter)
        .delay(delay)
        .easing(ENTER_EASING)
        .withInitialValues({ transform: [{ translateY: 10 }] })}
      style={style}
      {...fadeSafeProps}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Reveals freshly loaded content as one unit, replacing a skeleton in place.
 * A single quick fade avoids the half-built page you get when every card below
 * the hero animates in separately.
 */
export function ContentReveal({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return (
    <Animated.View
      entering={FadeIn.duration(Motion.reveal).easing(ENTER_EASING)}
      style={style}
      {...fadeSafeProps}
    >
      {children}
    </Animated.View>
  );
}
