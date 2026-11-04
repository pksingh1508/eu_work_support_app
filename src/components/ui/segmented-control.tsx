import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Elevation, Motion, Palette } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";
import { haptics } from "@/lib/haptics";

export type SegmentOption<T extends string> = {
  key: T;
  label: string;
  count?: number;
};

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

type Segment = { x: number; width: number };

const TRACK_PADDING = 4;

/** Native-feeling segmented control; the selection thumb springs between options. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const [segments, setSegments] = useState<Record<string, Segment>>({});
  const thumbX = useSharedValue(0);
  const thumbWidth = useSharedValue(0);
  const active = segments[value];

  useEffect(() => {
    if (!active) {
      return;
    }

    if (thumbWidth.value === 0) {
      thumbX.value = active.x;
      thumbWidth.value = active.width;
      return;
    }

    thumbX.value = withSpring(active.x, Motion.spring);
    thumbWidth.value = withSpring(active.width, Motion.spring);
  }, [active, thumbWidth, thumbX]);

  const thumbStyle = useAnimatedStyle(() => ({
    width: thumbWidth.value,
    opacity: thumbWidth.value === 0 ? 0 : 1,
    transform: [{ translateX: thumbX.value }],
  }));

  const onSegmentLayout = (key: T) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setSegments((current) =>
      current[key]?.x === x && current[key]?.width === width
        ? current
        : { ...current, [key]: { x, width } },
    );
  };

  return (
    <View style={styles.track} accessibilityRole="tablist">
      <Animated.View style={[styles.thumb, Elevation.hairline, thumbStyle]} />
      {options.map((option) => {
        const isActive = option.key === value;

        return (
          <Pressable
            key={option.key}
            onLayout={onSegmentLayout(option.key)}
            onPress={() => {
              if (!isActive) {
                haptics.selection();
                onChange(option.key);
              }
            }}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={option.label}
          >
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
              {option.label}
            </Text>
            {typeof option.count === "number" ? (
              <View style={[styles.count, isActive && styles.countActive]}>
                <Text style={[styles.countText, isActive && styles.countTextActive]}>
                  {option.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: TRACK_PADDING,
    borderRadius: 16,
    backgroundColor: Palette.well,
  },
  thumb: {
    position: "absolute",
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: 0,
    borderRadius: 12,
    backgroundColor: Palette.card,
  },
  segment: {
    flex: 1,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 6,
  },
  label: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 14,
    letterSpacing: -0.1,
    color: Palette.muted,
  },
  labelActive: {
    fontFamily: FontFamily.displayBold,
    color: Palette.ink,
  },
  count: {
    minWidth: 20,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,16,36,0.06)",
  },
  countActive: {
    backgroundColor: Palette.tint,
  },
  countText: {
    fontFamily: FontFamily.displayBold,
    fontSize: 11,
    color: Palette.muted,
  },
  countTextActive: {
    color: Palette.primary,
  },
});
