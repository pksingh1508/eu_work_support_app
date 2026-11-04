import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { popularDestinationImages, type PopularDestination } from "@/components/home/country-data";
import { FlagImage, getFlagUrlByName } from "@/components/ui/flag-image";
import { GradientFill } from "@/components/ui/gradient-fill";
import { StarRing } from "@/components/ui/star-ring";
import { HeroGradient, Palette, Type } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

export const COUNTRY_HERO_HEIGHT = 420;

type CountryHeroProps = {
  name: string;
  subtitle: string;
  flagEmoji: string | null;
  documentCount: number;
  categoryCount: number;
  reviewedLabel: string | null;
  topInset: number;
  scrollY: SharedValue<number>;
};

/** Stretchy, parallax country hero: grows on overscroll, drifts and fades on scroll. */
export function CountryHero({
  name,
  subtitle,
  flagEmoji,
  documentCount,
  categoryCount,
  reviewedLabel,
  topInset,
  scrollY,
}: CountryHeroProps) {
  const heroImage = popularDestinationImages[name as PopularDestination] ?? null;
  const flagWash = getFlagUrlByName(name, 640);

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
      { scale: interpolate(scrollY.value, [-COUNTRY_HERO_HEIGHT, 0], [2, 1], Extrapolation.CLAMP) },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, COUNTRY_HERO_HEIGHT * 0.5], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, COUNTRY_HERO_HEIGHT], [0, 70], Extrapolation.CLAMP),
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
            transition={500}
            cachePolicy="memory-disk"
            accessibilityLabel={`${name} landscape`}
          />
        ) : flagWash ? (
          <Image
            source={{ uri: flagWash }}
            style={[StyleSheet.absoluteFill, styles.flagWash]}
            contentFit="cover"
            blurRadius={30}
            accessibilityLabel={`${name} flag colours`}
          />
        ) : null}
        <GradientFill
          colors={["#050A20", "#050A20", "#050A20"]}
          opacities={heroImage ? [0.4, 0.25, 0.94] : [0.55, 0.45, 0.95]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        {!heroImage ? (
          <View style={styles.ring} pointerEvents="none">
            <StarRing size={230} starSize={14} opacity={0.35} period={140} />
          </View>
        ) : null}
      </Animated.View>

      <Animated.View style={[styles.content, { paddingTop: topInset + 80 }, contentStyle]}>
        <View style={styles.flagBadge}>
          <FlagImage country={name} emoji={flagEmoji} width={44} radius={6} />
        </View>

        <Text style={styles.name} accessibilityRole="header">
          {name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>

        <View style={styles.stats}>
          <HeroStat icon="reader-outline" value={`${documentCount}`} label="Guides" />
          <HeroStat icon="layers-outline" value={`${categoryCount}`} label="Topics" />
          {reviewedLabel ? (
            <HeroStat icon="shield-checkmark-outline" value={reviewedLabel} label="Reviewed" wide />
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

function HeroStat({
  icon,
  value,
  label,
  wide = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.stat, wide && styles.statWide]}>
      <Ionicons name={icon} size={15} color={Palette.gold} />
      <View style={styles.statText}>
        <Text style={styles.statValue} numberOfLines={1}>
          {value}
        </Text>
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
    opacity: 0.5,
  },
  ring: {
    position: "absolute",
    right: -60,
    top: 40,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  flagBadge: {
    alignSelf: "flex-start",
    padding: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  name: {
    ...Type.hero,
    fontSize: 40,
    lineHeight: 46,
    marginTop: 16,
    color: Palette.white,
  },
  subtitle: {
    ...Type.body,
    marginTop: 6,
    color: "rgba(255, 255, 255, 0.78)",
  },
  stats: {
    marginTop: 20,
    flexDirection: "row",
    gap: 8,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statWide: {
    flex: 1,
    minWidth: 0,
  },
  statText: {
    flexShrink: 1,
  },
  statValue: {
    fontFamily: FontFamily.displayBold,
    fontSize: 14,
    color: Palette.white,
  },
  statLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.62)",
  },
});
