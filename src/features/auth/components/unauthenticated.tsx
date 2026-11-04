import Ionicons from "@expo/vector-icons/Ionicons";
import { usePathname, useRouter, useSegments, type Href } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { FadeInView } from "@/components/ui/fade-in-view";
import { FocusStatusBar } from "@/components/ui/focus-status-bar";
import { GradientFill } from "@/components/ui/gradient-fill";
import { IconButton } from "@/components/ui/icon-button";
import { StarRing } from "@/components/ui/star-ring";
import { europeanCountryNames } from "@/constants/country";
import { BottomTabInset, Elevation, HeroGradient, Palette, Radii, Type } from "@/constants/theme";

type UnAuthenticatedProps = {
  title?: string;
  message?: string;
  returnTo?: string;
};

const features: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }[] = [
  {
    icon: "earth",
    title: `${europeanCountryNames.length} country guides`,
    subtitle: "Visas, permits and documents in one place",
  },
  {
    icon: "bookmark",
    title: "Your personal library",
    subtitle: "Save countries and guides for later",
  },
  {
    icon: "shield-checkmark",
    title: "Clearly sourced",
    subtitle: "Linked back to official authorities",
  },
];

/** Premium gate shown to signed-out visitors on protected screens. */
export function UnAuthenticated({
  title = "Members only",
  message = "Login if you already have access, or request access to unlock every guide.",
  returnTo,
}: UnAuthenticatedProps) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const nextReturnTo = returnTo ?? pathname;
  const isInTabs = segments[0] === "(tabs)";

  const openLogin = () => {
    router.push({ pathname: "/sign-in", params: { returnTo: nextReturnTo } });
  };

  const openVerify = () => {
    router.push(`/verify?returnTo=${encodeURIComponent(nextReturnTo)}` as Href);
  };

  return (
    <View style={styles.screen}>
      <FocusStatusBar style="light" />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: (isInTabs ? BottomTabInset : insets.bottom) + 24 }}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
          <GradientFill colors={HeroGradient} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} />
          {!isInTabs ? (
            <IconButton
              icon="chevron-back"
              variant="glass"
              onPress={() => router.back()}
              accessibilityLabel="Go back"
            />
          ) : (
            <View style={styles.backSpacer} />
          )}

          <View style={styles.medallionWrap}>
            <StarRing size={196} starSize={15} opacity={0.9} period={80} />
            <View style={styles.medallion}>
              <Ionicons name="lock-closed" size={30} color={Palette.gold} />
            </View>
          </View>

          <FadeInView>
            <Text style={styles.eyebrow}>{title}</Text>
            <Text style={styles.title} accessibilityRole="header">
              Unlock your{"\n"}
              <Text style={styles.titleAccent}>European</Text> journey.
            </Text>
            <Text style={styles.message}>{message}</Text>
          </FadeInView>
        </View>

        <FadeInView index={1} style={[styles.panel, Elevation.raised]}>
          {features.map((feature) => (
            <View key={feature.title} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon} size={18} color={Palette.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
              </View>
            </View>
          ))}

          <View style={styles.actions}>
            <Button label="Login" icon="log-in-outline" onPress={openLogin} />
            <Button label="Request access" variant="secondary" icon="mail-unread-outline" onPress={openVerify} />
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  hero: {
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingBottom: 64,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    backgroundColor: HeroGradient[1],
  },
  backSpacer: {
    height: 8,
  },
  medallionWrap: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  medallion: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.3)",
  },
  eyebrow: {
    ...Type.overline,
    color: Palette.gold,
  },
  title: {
    ...Type.hero,
    fontSize: 34,
    lineHeight: 40,
    marginTop: 8,
    color: Palette.white,
  },
  titleAccent: {
    ...Type.serifAccent,
    fontSize: 40,
    color: "#FFE3A3",
  },
  message: {
    ...Type.body,
    marginTop: 10,
    color: "rgba(255,255,255,0.72)",
  },
  panel: {
    marginTop: -40,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: Radii.xxl,
    backgroundColor: Palette.card,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 8,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.tint,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...Type.headline,
    color: Palette.ink,
  },
  featureSubtitle: {
    ...Type.footnote,
    marginTop: 1,
    color: Palette.muted,
  },
  actions: {
    marginTop: 18,
    gap: 10,
  },
});
