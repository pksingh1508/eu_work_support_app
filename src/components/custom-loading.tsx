import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type CustomLoadingProps = {
  size?: number;
  starCount?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const blue = "#0058BC";

export function CustomLoading({
  size = 56,
  starCount = 8,
  style,
  accessibilityLabel = "Loading",
}: CustomLoadingProps) {
  const rotation = useSharedValue(0);
  const starSize = Math.max(8, Math.round(size * 0.18));
  const ringSize = size * 0.72;
  const radius = ringSize / 2 - starSize / 2;

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1900,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [rotation]);

  const rotatingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            width: ringSize,
            height: ringSize,
          },
          rotatingStyle,
        ]}
      >
        {Array.from({ length: starCount }).map((_, index) => {
          const angle = (index / starCount) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * radius + ringSize / 2 - starSize / 2;
          const y = Math.sin(angle) * radius + ringSize / 2 - starSize / 2;

          return (
            <Ionicons
              key={`custom-loading-star-${index}`}
              name="star"
              size={starSize}
              color={blue}
              style={{
                position: "absolute",
                left: x,
                top: y,
              }}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#D8E7FF",
    borderWidth: 1,
    justifyContent: "center",
    shadowColor: "#0058BC",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
  },
});
