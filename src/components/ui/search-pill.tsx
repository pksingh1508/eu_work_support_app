import Ionicons from "@expo/vector-icons/Ionicons";
import { forwardRef, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";

import { PressableScale } from "@/components/ui/pressable-scale";
import { Spinner } from "@/components/ui/spinner";
import { Elevation, Motion, Palette, Radii } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

const defaultPlaceholder = "Search countries, visas & more";

type SearchButtonProps = {
  onPress: () => void;
  placeholder?: string;
};

/** Tappable search entry point (home hero). */
export function SearchButton({ onPress, placeholder = defaultPlaceholder }: SearchButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      haptic="light"
      scaleTo={0.98}
      style={[styles.pill, Elevation.raised]}
      accessibilityRole="search"
      accessibilityLabel="Search countries, visas, and topics"
    >
      <View style={styles.leading}>
        <Ionicons name="search" size={19} color={Palette.primary} />
      </View>
      <Text numberOfLines={1} style={styles.placeholder}>
        {placeholder}
      </Text>
      <View style={styles.go}>
        <Ionicons name="arrow-forward" size={17} color={Palette.white} />
      </View>
    </PressableScale>
  );
}

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  isBusy?: boolean;
  placeholder?: string;
};

/** Live search input with an animated focus ring, clear button and busy state. */
export const SearchField = forwardRef<TextInput, SearchFieldProps>(function SearchField(
  { value, onChangeText, onSubmit, isBusy = false, placeholder = defaultPlaceholder },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);
  const focus = useSharedValue(0);

  useEffect(() => {
    focus.value = withTiming(isFocused ? 1 : 0, { duration: Motion.fast });
  }, [focus, isFocused]);

  const ringStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focus.value, [0, 1], ["rgba(10,16,36,0.04)", Palette.primary]),
  }));

  return (
    <Animated.View style={[styles.pill, styles.field, Elevation.card, ringStyle]}>
      <View style={styles.leading}>
        {isBusy ? (
          <Spinner size={18} color={Palette.primary} trackColor={Palette.tintStrong} />
        ) : (
          <Ionicons name="search" size={19} color={Palette.primary} />
        )}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholder}
        placeholderTextColor={Palette.placeholder}
        selectionColor={Palette.primary}
        cursorColor={Palette.primary}
        style={styles.input}
        accessibilityLabel="Search countries, visas, and topics"
      />
      {value.length > 0 ? (
        <Animated.View entering={ZoomIn.duration(160)} exiting={ZoomOut.duration(120)}>
          <Pressable
            onPress={() => onChangeText("")}
            hitSlop={10}
            style={styles.clear}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close" size={15} color={Palette.white} />
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(100)}>
          <Ionicons name="sparkles-outline" size={18} color={Palette.faint} />
        </Animated.View>
      )}
    </Animated.View>
  );
});

/** @deprecated use SearchButton / SearchField. */
export const SearchPill = SearchButton;

const styles = StyleSheet.create({
  pill: {
    height: 62,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
    paddingRight: 12,
    borderRadius: Radii.xl,
    backgroundColor: Palette.card,
  },
  field: {
    borderWidth: 1.5,
  },
  leading: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.tint,
  },
  placeholder: {
    flex: 1,
    marginLeft: 12,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Palette.muted,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    marginLeft: 12,
    paddingVertical: 0,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Palette.ink,
    includeFontPadding: false,
  },
  go: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.primary,
  },
  clear: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.faint,
  },
});
