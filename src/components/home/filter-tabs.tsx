import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Elevation, Motion, Palette } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

export type FilterKey = "all" | "top-rated" | "easiest-visa";

export const homeFilters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "top-rated", label: "Top Rated" },
  { key: "easiest-visa", label: "Easiest Visa" },
];

type FilterTabsProps = {
  activeFilter: FilterKey;
  onChange: (filter: FilterKey) => void;
};

type Segment = { x: number; width: number };

/** Segmented control whose highlight springs between options. */
export function FilterTabs({ activeFilter, onChange }: FilterTabsProps) {
  const [segments, setSegments] = useState<Record<string, Segment>>({});
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const active = segments[activeFilter];

  useEffect(() => {
    if (!active) {
      return;
    }

    if (indicatorWidth.value === 0) {
      indicatorX.value = active.x;
      indicatorWidth.value = active.width;
      return;
    }

    indicatorX.value = withSpring(active.x, Motion.spring);
    indicatorWidth.value = withSpring(active.width, Motion.spring);
  }, [active, indicatorWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: indicatorWidth.value,
    transform: [{ translateX: indicatorX.value }],
  }));

  const onSegmentLayout = (key: FilterKey) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setSegments((current) => ({ ...current, [key]: { x, width } }));
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        <Animated.View style={[styles.indicator, Elevation.card, indicatorStyle]} />
        {homeFilters.map((filter) => {
          const isActive = filter.key === activeFilter;

          return (
            <Pressable
              key={filter.key}
              onLayout={onSegmentLayout(filter.key)}
              onPress={() => onChange(filter.key)}
              style={styles.segment}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={filter.label}
            >
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const TRACK_PADDING = 4;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Palette.canvas,
  },
  track: {
    flexDirection: "row",
    padding: TRACK_PADDING,
    borderRadius: 16,
    backgroundColor: "#E9ECF4",
  },
  indicator: {
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
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Palette.muted,
  },
  labelActive: {
    fontFamily: FontFamily.bodyBold,
    color: Palette.ink,
  },
});
