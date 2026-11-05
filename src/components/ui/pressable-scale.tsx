import { type PropsWithChildren } from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Motion } from "@/constants/theme";
import { haptics } from "@/lib/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = PropsWithChildren<
  Omit<PressableProps, "style"> & {
    style?: StyleProp<ViewStyle>;
    /** Target scale while pressed. */
    scaleTo?: number;
    /** Dim slightly while pressed, for flat rows where scale alone is subtle. */
    dimOnPress?: boolean;
    /** Tactile feedback fired on press-in. */
    haptic?: "selection" | "light" | "medium" | false;
    /** Opacity while disabled; components with their own disabled look pass 1. */
    disabledOpacity?: number;
  }
>;

/** Pressable with a springy scale-down, the core tactile feedback of the app. */
export function PressableScale({
  children,
  style,
  scaleTo = Motion.pressScale,
  dimOnPress = false,
  haptic = false,
  onPressIn,
  onPressOut,
  disabled,
  disabledOpacity = 0.5,
  ...props
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const pressed = useSharedValue(0);
  const baseOpacity = disabled ? disabledOpacity : 1;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: baseOpacity * (dimOnPress ? 1 - pressed.value * 0.12 : 1),
    transform: [{ scale: 1 - pressed.value * (1 - scaleTo) }],
  }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={(event) => {
        if (!reduceMotion) {
          pressed.value = withSpring(1, Motion.snappy);
        }
        if (haptic) {
          haptics[haptic]();
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressed.value = reduceMotion
          ? withTiming(0, { duration: 0 })
          : withSpring(0, Motion.spring);
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
