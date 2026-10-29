import Ionicons from "@expo/vector-icons/Ionicons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Elevation, Motion, Palette } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

type IconName = keyof typeof Ionicons.glyphMap;

const tabIcons: Record<string, { active: IconName; inactive: IconName; label: string }> = {
  index: { active: "home", inactive: "home-outline", label: "Home" },
  search: { active: "search", inactive: "search-outline", label: "Search" },
  saved: { active: "bookmark", inactive: "bookmark-outline", label: "Saved" },
  profile: { active: "person", inactive: "person-outline", label: "Profile" },
};

const BAR_HEIGHT = 66;
const BAR_PADDING = 6;

/** Floating, frosted tab bar with a spring-driven sliding indicator. */
export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [barWidth, setBarWidth] = useState(0);
  const tabWidth = barWidth > 0 ? (barWidth - BAR_PADDING * 2) / state.routes.length : 0;
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth, Motion.spring);
  }, [indicatorX, state.index, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const onLayout = (event: LayoutChangeEvent) => {
    setBarWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View onLayout={onLayout} style={[styles.bar, Elevation.floating]}>
        {tabWidth > 0 ? (
          <Animated.View
            style={[styles.indicator, { width: tabWidth }, indicatorStyle]}
          />
        ) : null}

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const config = tabIcons[route.name] ?? {
            active: "ellipse",
            inactive: "ellipse-outline",
            label: route.name,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TabButton
              key={route.key}
              icon={isFocused ? config.active : config.inactive}
              label={config.label}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

type TabButtonProps = {
  icon: IconName;
  label: string;
  isFocused: boolean;
  onPress: () => void;
};

function TabButton({ icon, label, isFocused, onPress }: TabButtonProps) {
  const lift = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    lift.value = withSpring(isFocused ? 1 : 0, Motion.spring);
  }, [isFocused, lift]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -2 * lift.value },
      { scale: 1 + 0.08 * lift.value },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + 0.45 * lift.value,
  }));

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View style={iconStyle}>
        <Ionicons
          name={icon}
          size={22}
          color={isFocused ? Palette.primary : Palette.subtle}
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.label,
          { color: isFocused ? Palette.primary : Palette.muted },
          labelStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
  },
  bar: {
    height: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    padding: BAR_PADDING,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.hairline,
  },
  indicator: {
    position: "absolute",
    top: BAR_PADDING,
    left: BAR_PADDING,
    bottom: BAR_PADDING,
    borderRadius: (BAR_HEIGHT - BAR_PADDING * 2) / 2,
    backgroundColor: Palette.tint,
  },
  tab: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.1,
  },
});
