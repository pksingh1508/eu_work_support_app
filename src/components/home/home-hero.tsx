import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { GradientFill } from "@/components/ui/gradient-fill";
import { SearchPill } from "@/components/ui/search-pill";
import { HeroGradient } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

type HomeHeroProps = {
  scrollY: SharedValue<number>;
  countryCount: number;
  onSearchPress: () => void;
};

const HERO_PARALLAX_RANGE = 260;

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

/** Deep-blue editorial hero. Content drifts and fades at half scroll speed. */
export function HomeHero({ scrollY, countryCount, onSearchPress }: HomeHeroProps) {
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, HERO_PARALLAX_RANGE * 0.7],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-120, 0, HERO_PARALLAX_RANGE],
          [-30, 0, HERO_PARALLAX_RANGE * 0.45],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, HERO_PARALLAX_RANGE],
          [0, HERO_PARALLAX_RANGE * 0.25],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          scrollY.value,
          [-160, 0],
          [1.25, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <View style={styles.wrapper}>
      <View style={styles.hero}>
        <GradientFill colors={HeroGradient} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} />
        <Animated.View style={[styles.orbLarge, orbStyle]} />
        <Animated.View style={[styles.orbSmall, orbStyle]} />

        <Animated.View style={contentStyle}>
          <View style={styles.brandRow}>
            <View style={styles.brandChip}>
              <Ionicons name="globe-outline" size={14} color="#FFFFFF" />
              <Text style={styles.brandText}>EU Work Support</Text>
            </View>
          </View>

          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.title}>
            Your path to{"\n"}working in Europe.
          </Text>

          <View style={styles.statsRow}>
            <HeroStat icon="flag-outline" label={`${countryCount} countries`} />
            <HeroStat icon="shield-checkmark-outline" label="Verified guides" />
          </View>
        </Animated.View>
      </View>

      <View style={styles.searchDock}>
        <SearchPill onPress={onSearchPress} />
      </View>
    </View>
  );
}

function HeroStat({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={14} color="rgba(255,255,255,0.9)" />
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
}

const SEARCH_OVERLAP = 34;

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 8,
  },
  hero: {
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 34 + SEARCH_OVERLAP,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    backgroundColor: HeroGradient[1],
  },
  orbLarge: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    right: -90,
    top: -70,
    backgroundColor: "rgba(120, 180, 255, 0.22)",
  },
  orbSmall: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    left: -50,
    bottom: -40,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  brandRow: {
    flexDirection: "row",
  },
  brandChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  brandText: {
    color: "#FFFFFF",
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  greeting: {
    marginTop: 26,
    color: "rgba(255, 255, 255, 0.72)",
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
  },
  title: {
    marginTop: 6,
    color: "#FFFFFF",
    fontFamily: FontFamily.headingBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  statsRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(9, 24, 60, 0.28)",
  },
  statText: {
    color: "rgba(255, 255, 255, 0.92)",
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
  },
  searchDock: {
    marginTop: -SEARCH_OVERLAP,
    paddingHorizontal: 20,
  },
});
