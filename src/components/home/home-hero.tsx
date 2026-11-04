import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { GradientFill } from "@/components/ui/gradient-fill";
import { SearchButton } from "@/components/ui/search-pill";
import { StarRing } from "@/components/ui/star-ring";
import { HeroGradient, Palette, Type } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

type HomeHeroProps = {
  scrollY: SharedValue<number>;
  countryCount: number;
  onSearchPress: () => void;
};

const HERO_PARALLAX_RANGE = 260;
const SEARCH_OVERLAP = 31;

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

/** Midnight editorial hero with the EU star ring drifting behind the headline. */
export function HomeHero({ scrollY, countryCount, onSearchPress }: HomeHeroProps) {
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HERO_PARALLAX_RANGE * 0.7], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-120, 0, HERO_PARALLAX_RANGE],
          [-24, 0, HERO_PARALLAX_RANGE * 0.42],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const decorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, HERO_PARALLAX_RANGE],
          [0, HERO_PARALLAX_RANGE * 0.3],
          Extrapolation.CLAMP,
        ),
      },
      { scale: interpolate(scrollY.value, [-160, 0], [1.2, 1], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View style={styles.wrapper}>
      <View style={styles.hero}>
        <GradientFill colors={HeroGradient} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} />
        <Animated.View style={[styles.decor, decorStyle]} pointerEvents="none">
          <View style={styles.glow} />
          <StarRing size={250} starSize={15} opacity={0.5} period={120} />
        </Animated.View>
        <View style={styles.glowLeft} pointerEvents="none" />

        <Animated.View style={contentStyle}>
          <View style={styles.brandChip}>
            <View style={styles.brandMark}>
              <Ionicons name="star" size={10} color={Palette.navy} />
            </View>
            <Text style={styles.brandText}>EU Work Support</Text>
          </View>

          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.title} accessibilityRole="header">
            Your path to{"\n"}
            <Text style={styles.titleAccent}>working</Text> in Europe.
          </Text>

          <View style={styles.statsRow}>
            <HeroStat icon="flag" label={`${countryCount} countries`} />
            <HeroStat icon="shield-checkmark" label="Verified guides" />
          </View>
        </Animated.View>
      </View>

      <View style={styles.searchDock}>
        <SearchButton onPress={onSearchPress} />
      </View>
    </View>
  );
}

function HeroStat({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={12} color={Palette.gold} />
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 6,
  },
  hero: {
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 36 + SEARCH_OVERLAP,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    backgroundColor: HeroGradient[1],
  },
  decor: {
    position: "absolute",
    right: -78,
    top: -46,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(80, 130, 255, 0.28)",
  },
  glowLeft: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    left: -110,
    bottom: -90,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  brandChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 5,
    paddingRight: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  brandMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.gold,
  },
  brandText: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 12,
    letterSpacing: 0.2,
    color: Palette.white,
  },
  greeting: {
    marginTop: 28,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.66)",
  },
  title: {
    ...Type.hero,
    marginTop: 6,
    color: Palette.white,
  },
  titleAccent: {
    ...Type.serifAccent,
    fontSize: 44,
    color: "#FFE3A3",
  },
  statsRow: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(4, 10, 32, 0.32)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
  },
  searchDock: {
    marginTop: -SEARCH_OVERLAP,
    paddingHorizontal: 20,
  },
});
