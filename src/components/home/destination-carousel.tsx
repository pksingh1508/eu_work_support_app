import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import {
  countryDetails,
  getFlagUrl,
  popularDestinationImages,
  popularDestinationTaglines,
  type CountryName,
  type PopularDestination,
} from "@/components/home/country-data";
import { GradientFill } from "@/components/ui/gradient-fill";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Elevation, HeroGradient } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

type DestinationCarouselProps = {
  destinations: readonly PopularDestination[];
  onPress: (country: CountryName) => void;
};

const CARD_GAP = 14;
const SIDE_PADDING = 20;
const CARD_HEIGHT = 340;
const IMAGE_PARALLAX = 46;

/** Snap carousel: neighbours shrink and dim, imagery drifts against the swipe. */
export function DestinationCarousel({
  destinations,
  onPress,
}: DestinationCarouselProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - SIDE_PADDING * 2 - 34, 360);
  const interval = cardWidth + CARD_GAP;
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  return (
    <View>
      <Animated.ScrollView
        horizontal
        decelerationRate="fast"
        snapToInterval={interval}
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {destinations.map((country, index) => (
          <DestinationCard
            key={country}
            country={country}
            index={index}
            width={cardWidth}
            interval={interval}
            scrollX={scrollX}
            onPress={onPress}
          />
        ))}
      </Animated.ScrollView>

      <View style={styles.dots}>
        {destinations.map((country, index) => (
          <PageDot
            key={country}
            index={index}
            interval={interval}
            scrollX={scrollX}
          />
        ))}
      </View>
    </View>
  );
}

type DestinationCardProps = {
  country: PopularDestination;
  index: number;
  width: number;
  interval: number;
  scrollX: SharedValue<number>;
  onPress: (country: CountryName) => void;
};

function DestinationCard({
  country,
  index,
  width,
  interval,
  scrollX,
  onPress,
}: DestinationCardProps) {
  const inputRange = [
    (index - 1) * interval,
    index * interval,
    (index + 1) * interval,
  ];

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0.75, 1, 0.75], Extrapolation.CLAMP),
    transform: [
      {
        scale: interpolate(scrollX.value, inputRange, [0.92, 1, 0.92], Extrapolation.CLAMP),
      },
    ],
  }));

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          scrollX.value,
          inputRange,
          [-IMAGE_PARALLAX, 0, IMAGE_PARALLAX],
          Extrapolation.CLAMP,
        ),
      },
      { scale: 1.18 },
    ],
  }));

  const details = countryDetails[country];

  return (
    <Animated.View style={[{ width }, styles.cardShadow, Elevation.floating, cardStyle]}>
      <PressableScale
        onPress={() => onPress(country)}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`Explore ${country}`}
      >
        <GradientFill colors={HeroGradient} />
        <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
          <Image
            source={{ uri: popularDestinationImages[country] }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={400}
            accessibilityLabel={`${country} skyline`}
          />
        </Animated.View>
        <GradientFill
          colors={["#050C1C", "#050C1C", "#050C1C"]}
          opacities={[0.05, 0.25, 0.88]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.topRow}>
          <View style={styles.glassChip}>
            <Image
              source={{ uri: getFlagUrl(country) }}
              style={styles.flag}
              contentFit="cover"
              accessibilityLabel={`${country} flag`}
            />
            <Text style={styles.chipText}>{details.demand}</Text>
          </View>
          <View style={styles.trendBadge}>
            <Ionicons name="trending-up" size={13} color="#0B1F4B" />
            <Text style={styles.trendText}>Popular</Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.bottomText}>
            <Text style={styles.country} numberOfLines={1} adjustsFontSizeToFit>
              {country}
            </Text>
            <Text style={styles.tagline} numberOfLines={2}>
              {popularDestinationTaglines[country]}
            </Text>
          </View>
          <View style={styles.arrow}>
            <Ionicons name="arrow-forward" size={20} color="#0B1F4B" />
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

function PageDot({
  index,
  interval,
  scrollX,
}: {
  index: number;
  interval: number;
  scrollX: SharedValue<number>;
}) {
  const dotStyle = useAnimatedStyle(() => {
    const range = [(index - 1) * interval, index * interval, (index + 1) * interval];

    return {
      width: interpolate(scrollX.value, range, [7, 22, 7], Extrapolation.CLAMP),
      opacity: interpolate(scrollX.value, range, [0.25, 1, 0.25], Extrapolation.CLAMP),
    };
  });

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

const styles = StyleSheet.create({
  track: {
    paddingHorizontal: SIDE_PADDING,
    gap: CARD_GAP,
    paddingVertical: 6,
  },
  cardShadow: {
    borderRadius: 30,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 30,
    overflow: "hidden",
    justifyContent: "space-between",
    padding: 18,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  glassChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(10, 18, 36, 0.42)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  flag: {
    width: 24,
    height: 16,
    borderRadius: 4,
  },
  chipText: {
    color: "#FFFFFF",
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
  },
  trendText: {
    color: "#0B1F4B",
    fontFamily: FontFamily.bodyBold,
    fontSize: 12,
  },
  bottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  bottomText: {
    flex: 1,
  },
  country: {
    color: "#FFFFFF",
    fontFamily: FontFamily.headingBold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  tagline: {
    marginTop: 4,
    color: "rgba(255, 255, 255, 0.82)",
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  arrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  dots: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    height: 7,
    borderRadius: 4,
    backgroundColor: HeroGradient[1],
  },
});
