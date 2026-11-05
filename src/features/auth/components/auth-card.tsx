import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { forwardRef, PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { FadeInView } from "@/components/ui/fade-in-view";
import { FocusStatusBar } from "@/components/ui/focus-status-bar";
import { GradientFill } from "@/components/ui/gradient-fill";
import { IconButton } from "@/components/ui/icon-button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { StarRing } from "@/components/ui/star-ring";
import { TextField } from "@/components/ui/text-field";
import { Elevation, HeroGradient, Palette, Radii, Type } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

type AuthCardProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  headerTitle?: string;
  error?: string | null;
}>;

/** Auth layout: midnight hero with the star ring, form card rising over it. */
export function AuthCard({ title, subtitle, headerTitle, error, children }: AuthCardProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      // Android is edge-to-edge, so adjustResize no longer shrinks the window;
      // without this the keyboard covers the primary button.
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <FocusStatusBar style="light" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
          <GradientFill colors={HeroGradient} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} />
          <View style={styles.ring} pointerEvents="none">
            <StarRing size={230} starSize={14} opacity={0.45} period={110} />
          </View>

          <View style={styles.heroTop}>
            <IconButton
              icon="chevron-back"
              variant="glass"
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
              accessibilityLabel="Go back"
            />
            <View style={styles.brandChip}>
              <View style={styles.brandMark}>
                <Ionicons name="star" size={9} color={Palette.navy} />
              </View>
              <Text style={styles.brandText}>{headerTitle ?? "EU Work Support"}</Text>
            </View>
            <View style={styles.heroSpacer} />
          </View>

          <FadeInView style={styles.heroText}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </FadeInView>
        </View>

        <FadeInView index={1} style={[styles.card, Elevation.raised]}>
          {error ? <InlineNotice tone="error" message={error} /> : null}
          {children}
        </FadeInView>

        <Text style={styles.terms}>
          By continuing, you agree to the{" "}
          <Text
            onPress={() => router.push("/profile/legal/terms-and-conditions")}
            accessibilityRole="link"
            style={styles.termsLink}
          >
            Terms
          </Text>{" "}
          and{" "}
          <Text
            onPress={() => router.push("/profile/legal/privacy-policy")}
            accessibilityRole="link"
            style={styles.termsLink}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type AuthTextFieldProps = TextInputProps & {
  label: string;
  icon?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

function getFieldIcon(icon?: string) {
  switch (icon) {
    case "lock":
      return "lock-closed-outline" as const;
    case "code":
      return "keypad-outline" as const;
    case "mail":
      return "mail-outline" as const;
    default:
      return undefined;
  }
}

export const AuthTextField = forwardRef<TextInput, AuthTextFieldProps>(function AuthTextField(
  { label, icon, actionLabel, onActionPress, ...props },
  ref,
) {
  return (
    <TextField
      ref={ref}
      label={label}
      icon={getFieldIcon(icon)}
      {...props}
      trailing={
        actionLabel ? (
          <Pressable
            onPress={onActionPress}
            hitSlop={12}
            style={styles.fieldAction}
            accessibilityRole="button"
            accessibilityLabel={actionLabel === "Hide" ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={actionLabel === "Hide" ? "eye-outline" : "eye-off-outline"}
              size={20}
              color={Palette.subtle}
            />
          </Pressable>
        ) : undefined
      }
    />
  );
});

type AuthPrimaryButtonProps = {
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function AuthPrimaryButton({ label, isLoading, disabled, onPress }: AuthPrimaryButtonProps) {
  return <Button label={label} isLoading={isLoading} disabled={disabled} onPress={onPress} />;
}

export function AuthInlineLink({
  text,
  action,
  onPress,
}: {
  text: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.inlineLink} hitSlop={10} accessibilityRole="link">
      <Text style={styles.inlineText}>
        {text ? `${text} ` : ""}
        <Text style={styles.inlineAction}>{action}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  hero: {
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingBottom: 72,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    backgroundColor: HeroGradient[1],
  },
  ring: {
    position: "absolute",
    right: -70,
    top: 30,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroSpacer: {
    width: 44,
  },
  brandChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingLeft: 5,
    paddingRight: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
  },
  brandMark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.gold,
  },
  brandText: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 12,
    color: Palette.white,
  },
  heroText: {
    marginTop: 36,
    paddingHorizontal: 4,
  },
  title: {
    ...Type.display,
    color: Palette.white,
  },
  subtitle: {
    ...Type.body,
    marginTop: 8,
    color: "rgba(255,255,255,0.72)",
  },
  card: {
    marginTop: -44,
    marginHorizontal: 16,
    gap: 18,
    padding: 20,
    borderRadius: Radii.xxl,
    backgroundColor: Palette.card,
  },
  terms: {
    ...Type.footnote,
    marginTop: 22,
    paddingHorizontal: 32,
    textAlign: "center",
    color: Palette.muted,
  },
  termsLink: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.primary,
  },
  fieldAction: {
    marginLeft: 12,
  },
  inlineLink: {
    alignItems: "center",
    paddingVertical: 4,
  },
  inlineText: {
    ...Type.callout,
    textAlign: "center",
    color: Palette.muted,
  },
  inlineAction: {
    fontFamily: FontFamily.displayBold,
    color: Palette.primary,
  },
});
