import { useRouter } from "expo-router";
import { type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FocusStatusBar } from "@/components/ui/focus-status-bar";
import { IconButton } from "@/components/ui/icon-button";
import { Palette, Type } from "@/constants/theme";

type StackScreenProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  /** Rendered beside the large title (e.g. an icon tile). */
  titleAccessory?: ReactNode;
  rightAction?: ReactNode;
  children: ReactNode;
  /** Pinned below the scroll area (e.g. a primary action). */
  footer?: ReactNode;
  keyboardAware?: boolean;
  /** Hide the large title block (e.g. while content is loading). */
  hideLargeTitle?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onBack?: () => void;
};

const BAR_HEIGHT = 60;
const COLLAPSE_DISTANCE = 56;

/**
 * Scaffold for pushed screens: a large editorial title that hands off to a
 * compact, centered title in a frosted bar as you scroll (Material "large top
 * app bar" behaviour).
 */
export function StackScreen({
  title,
  eyebrow,
  subtitle,
  titleAccessory,
  rightAction,
  children,
  footer,
  keyboardAware = false,
  hideLargeTitle = false,
  contentContainerStyle,
  onBack,
}: StackScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const barStyle = useAnimatedStyle(() => {
    const progress = interpolate(scrollY.value, [8, COLLAPSE_DISTANCE], [0, 1], Extrapolation.CLAMP);

    return {
      backgroundColor: `rgba(243, 245, 249, ${progress * 0.97})`,
      borderBottomColor: `rgba(10, 16, 36, ${progress * 0.07})`,
    };
  });

  const compactTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [COLLAPSE_DISTANCE - 20, COLLAPSE_DISTANCE + 6],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [COLLAPSE_DISTANCE - 20, COLLAPSE_DISTANCE + 6],
          [6, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, COLLAPSE_DISTANCE], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(scrollY.value, [-120, 0], [1.08, 1], Extrapolation.CLAMP),
      },
      {
        translateY: interpolate(scrollY.value, [0, COLLAPSE_DISTANCE], [0, -6], Extrapolation.CLAMP),
      },
    ],
  }));

  const handleBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace("/")));

  const body = (
    <View style={styles.screen}>
      <FocusStatusBar style="dark" />

      <Animated.View style={[styles.bar, { paddingTop: insets.top }, barStyle]}>
        <View style={styles.barInner}>
          <IconButton icon="chevron-back" onPress={handleBack} accessibilityLabel="Go back" />
          <Animated.View style={[styles.compactTitleWrap, compactTitleStyle]} pointerEvents="none">
            <Text style={styles.compactTitle} numberOfLines={1}>
              {title}
            </Text>
          </Animated.View>
          <View style={styles.right}>{rightAction}</View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + BAR_HEIGHT + 4, paddingBottom: insets.bottom + 40 },
          contentContainerStyle,
        ]}
      >
        {hideLargeTitle ? null : (
        <Animated.View style={[styles.largeTitle, largeTitleStyle]}>
          <View style={styles.largeTitleRow}>
            <View style={styles.largeTitleText}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.title} accessibilityRole="header">
                {title}
              </Text>
            </View>
            {titleAccessory}
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </Animated.View>
        )}

        {children}
      </Animated.ScrollView>

      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>{footer}</View>
      ) : null}
    </View>
  );

  if (!keyboardAware) {
    return body;
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  barInner: {
    height: BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  compactTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: "center",
  },
  compactTitle: {
    ...Type.headline,
    color: Palette.ink,
  },
  right: {
    minWidth: 44,
    alignItems: "flex-end",
  },
  content: {
    paddingHorizontal: 20,
  },
  largeTitle: {
    paddingTop: 6,
    paddingBottom: 24,
    transformOrigin: "left center",
  },
  largeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  largeTitleText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    ...Type.overline,
    marginBottom: 6,
    color: Palette.primary,
  },
  title: {
    ...Type.display,
    color: Palette.ink,
  },
  subtitle: {
    ...Type.body,
    marginTop: 10,
    color: Palette.muted,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Palette.canvas,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.hairline,
  },
});
