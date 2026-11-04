import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Palette } from "@/constants/theme";

type StarRingProps = {
  size: number;
  starSize?: number;
  color?: string;
  opacity?: number;
  /** Seconds per full revolution; 0 disables rotation. */
  period?: number;
  style?: StyleProp<ViewStyle>;
};

const STAR_COUNT = 12;

/** The twelve-star EU circle, the app's signature decorative motif. */
export function StarRing({
  size,
  starSize = Math.max(8, size * 0.075),
  color = Palette.gold,
  opacity = 1,
  period = 90,
  style,
}: StarRingProps) {
  const reduceMotion = useReducedMotion();
  const rotation = useSharedValue(0);
  const radius = size / 2 - starSize / 2;

  useEffect(() => {
    if (reduceMotion || period <= 0) {
      return;
    }

    rotation.value = withRepeat(
      withTiming(360, { duration: period * 1000, easing: Easing.linear }),
      -1,
      false,
    );

    return () => cancelAnimation(rotation);
  }, [period, reduceMotion, rotation]);

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ width: size, height: size, opacity }, rotationStyle, style]}
    >
      {Array.from({ length: STAR_COUNT }).map((_, index) => {
        const angle = (index / STAR_COUNT) * Math.PI * 2 - Math.PI / 2;

        return (
          <View
            key={index}
            style={[
              styles.star,
              {
                left: Math.cos(angle) * radius + size / 2 - starSize / 2,
                top: Math.sin(angle) * radius + size / 2 - starSize / 2,
              },
            ]}
          >
            <Ionicons name="star" size={starSize} color={color} />
          </View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: "absolute",
  },
});
