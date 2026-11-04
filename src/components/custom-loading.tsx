import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { Elevation, Palette } from "@/constants/theme";

type CustomLoadingProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const STAR_COUNT = 12;

/**
 * Signature loader: the twelve EU stars light up in a travelling wave around a
 * soft white medallion.
 */
export function CustomLoading({
  size = 64,
  style,
  accessibilityLabel = "Loading",
}: CustomLoadingProps) {
  const progress = useSharedValue(0);
  const starSize = Math.max(7, Math.round(size * 0.14));
  const ring = size * 0.7;
  const radius = ring / 2 - starSize / 2;

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.linear }),
      -1,
      false,
    );

    return () => cancelAnimation(progress);
  }, [progress]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.medallion,
        Elevation.raised,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <View style={{ width: ring, height: ring }}>
        {Array.from({ length: STAR_COUNT }).map((_, index) => {
          const angle = (index / STAR_COUNT) * Math.PI * 2 - Math.PI / 2;

          return (
            <WaveStar
              key={index}
              index={index}
              progress={progress}
              size={starSize}
              left={Math.cos(angle) * radius + ring / 2 - starSize / 2}
              top={Math.sin(angle) * radius + ring / 2 - starSize / 2}
            />
          );
        })}
      </View>
    </View>
  );
}

function WaveStar({
  index,
  progress,
  size,
  left,
  top,
}: {
  index: number;
  progress: SharedValue<number>;
  size: number;
  left: number;
  top: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const phase = (progress.value - index / STAR_COUNT + 1) % 1;
    // Sharp attack, long tail — reads as a comet sweeping the ring.
    const intensity = Math.pow(1 - phase, 3);

    return {
      opacity: 0.22 + intensity * 0.78,
      transform: [{ scale: 0.8 + intensity * 0.35 }],
    };
  });

  return (
    <Animated.View style={[styles.star, { left, top }, animatedStyle]}>
      <Ionicons name="star" size={size} color={index % 3 === 0 ? Palette.gold : Palette.primary} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  medallion: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.card,
  },
  star: {
    position: "absolute",
  },
});
