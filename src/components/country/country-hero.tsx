import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import {
  countryDetails,
  popularDestinationImages,
  type CountryName,
  type PopularDestination,
} from "@/components/home/country-data";
import { GradientFill } from "@/components/ui/gradient-fill";
import { HeroGradient } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

export const COUNTRY_HERO_HEIGHT = 400;

type CountryHeroProps = {
  name: string;
  subtitle: string;
  flagEmoji: string | null;
  documentCount: number;
  topInset: number;
  scrollY: SharedValue<number>;
};

function getFlagCode(name: string) {
  return countryDetails[name as CountryName]?.code ?? null;
}

function getHeroImage(name: string) {
  return popularDestinationImages[name as PopularDestination] ?? null;
}

/** Stretchy, parallax country hero: grows on overscroll, drifts and fades on scroll. */
export function CountryHero({
  name,
  subtitle,
  flagEmoji,
  documentCount,
  topInset,
  scrollY,
}: CountryHeroProps) {
  const flagCode = getFlagCode(name);
  const heroImage = getHeroImage(name);

  const backdropStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-COUNTRY_HERO_HEIGHT, 0, COUNTRY_HERO_HEIGHT],
          [-COUNTRY_HERO_HEIGHT / 2, 0, COUNTRY_HERO_HEIGHT * 0.4],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          scrollY.value,
          [-COUNTRY_HERO_HEIGHT, 0],
          [2, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, COUNTRY_HERO_HEIGHT * 0.55],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, COUNTRY_HERO_HEIGHT],
          [0, 60],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={styles.hero}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <GradientFill colors={HeroGradient} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} />
        {heroImage ? (
          <Image
            source={{ uri: heroImage }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={400}
            accessibilityLabel={`${name} landscape`}
          />
        ) : flagCode ? (
          <Image
            source={{ uri: `https://flagcdn.com/w640/${flagCode}.png` }}
            style={[StyleSheet.absoluteFill, styles.flagWash]}
            contentFit="cover"
            blurRadius={24}
            accessibilityLabel={`${name} flag colours`}
          />
        ) : null}
        <GradientFill
          colors={["#071330", "#071330", "#071330"]}
          opacities={[0.35, 0.35, 0.92]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.content, { paddingTop: topInset + 72 }, contentStyle]}>
        <View style={styles.flagBadge}>
          {flagCode ? (
            <Image
              source={{ uri: `https://flagcdn.com/w160/${flagCode}.png` }}
              style={styles.flag}
              contentFit="cover"
              accessibilityLabel={`${name} flag`}
            />
          ) : (
            <Text style={styles.flagEmoji}>{flagEmoji ?? "🏳️"}</Text>
          )}
        </View>

        <Text style={styles.name}>{name}</Text>
        <Text style={styles.subtitle} numberOfLines={3}>
          {subtitle}
        </Text>

        <View style={styles.stats}>
          <HeroStat icon="time-outline" value="4–12 wks" label="Typical process" />
          <HeroStat icon="documents-outline" value={`${documentCount}`} label="Guides" />
        </View>
      </Animated.View>
    </View>
  );
}

function HeroStat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={16} color="rgba(255,255,255,0.85)" />
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: COUNTRY_HERO_HEIGHT,
    overflow: "hidden",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    backgroundColor: HeroGradient[0],
  },
  flagWash: {
    opacity: 0.55,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  flagBadge: {
    alignSelf: "flex-start",
    padding: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  flag: {
    width: 42,
    height: 28,
    borderRadius: 5,
  },
  flagEmoji: {
    fontSize: 28,
  },
  name: {
    marginTop: 16,
    fontFamily: FontFamily.headingBold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1,
    color: "#FFFFFF",
  },
  subtitle: {
    marginTop: 6,
    fontFamily: FontFamily.body,
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255, 255, 255, 0.82)",
  },
  stats: {
    marginTop: 20,
    flexDirection: "row",
    gap: 10,
  },
  stat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  statValue: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  statLabel: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
});
