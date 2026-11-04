import Ionicons from "@expo/vector-icons/Ionicons";
import { forwardRef, useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Motion, Palette, Radii, Type } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

type TextFieldProps = Omit<TextInputProps, "style"> & {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string | null;
  helper?: string;
  /** Renders an eye toggle and manages visibility internally. */
  isPassword?: boolean;
  trailing?: React.ReactNode;
};

/** Premium input: soft well that lifts to white with a cobalt ring on focus. */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    icon,
    error,
    helper,
    isPassword = false,
    trailing,
    onFocus,
    onBlur,
    editable = true,
    ...props
  },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(isPassword);
  const hasError = Boolean(error);

  const focus = useSharedValue(0);

  useEffect(() => {
    focus.value = withTiming(isFocused ? 1 : 0, { duration: Motion.fast });
  }, [focus, isFocused]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(focus.value, [0, 1], [Palette.cardMuted, Palette.card]),
    borderColor: hasError
      ? Palette.danger
      : interpolateColor(focus.value, [0, 1], ["rgba(10,16,36,0.08)", Palette.primary]),
  }));

  const iconColor = hasError ? Palette.danger : isFocused ? Palette.primary : Palette.subtle;

  return (
    <View style={!editable ? styles.readOnly : null}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.field, containerStyle]}>
        {icon ? <Ionicons name={icon} size={19} color={iconColor} style={styles.icon} /> : null}
        <TextInput
          ref={ref}
          {...props}
          editable={editable}
          secureTextEntry={isPassword ? isSecure : props.secureTextEntry}
          placeholderTextColor={Palette.subtle}
          selectionColor={Palette.primary}
          cursorColor={Palette.primary}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          style={styles.input}
          accessibilityLabel={label}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setIsSecure((current) => !current)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={isSecure ? "Show password" : "Hide password"}
            style={styles.trailing}
          >
            <Ionicons
              name={isSecure ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={Palette.subtle}
            />
          </Pressable>
        ) : (
          trailing
        )}
      </Animated.View>
      {hasError ? (
        <Animated.View
          entering={FadeInDown.duration(Motion.fast)}
          exiting={FadeOut.duration(120)}
          style={styles.messageRow}
        >
          <Ionicons name="alert-circle" size={14} color={Palette.danger} />
          <Text style={[styles.message, styles.errorText]}>{error}</Text>
        </Animated.View>
      ) : helper ? (
        <Text style={[styles.message, styles.helper]}>{helper}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  readOnly: {
    opacity: 0.6,
  },
  label: {
    ...Type.label,
    marginBottom: 8,
    color: Palette.inkSoft,
  },
  field: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    borderWidth: 1.5,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    paddingVertical: 0,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Palette.ink,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  trailing: {
    marginLeft: 12,
  },
  messageRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  message: {
    ...Type.caption,
  },
  errorText: {
    flex: 1,
    color: Palette.danger,
  },
  helper: {
    marginTop: 8,
    color: Palette.muted,
  },
});
