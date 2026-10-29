import { type PropsWithChildren } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Motion } from "@/constants/theme";

type FadeInViewProps = PropsWithChildren<{
  /** Position in a list; drives the stagger delay. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}>;

/** Staggered spring entrance. Respects the system reduce-motion setting. */
export function FadeInView({
  children,
  index = 0,
  style,
}: FadeInViewProps) {
  const delay = Math.min(index * Motion.stagger, Motion.maxStaggerDelay);

  return (
    <Animated.View
      entering={FadeInDown
        .delay(delay)
        .springify()
        .damping(Motion.softSpring.damping)
        .stiffness(Motion.softSpring.stiffness)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
