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
  popularDestinationImages,
  popularDestinationTaglines,
  type CountryName,
  type PopularDestination,
} from "@/components/home/country-data";
import { FlagImage } from "@/components/ui/flag-image";
import { GradientFill } from "@/components/ui/gradient-fill";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Elevation, HeroGradient, Palette, Type } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

type DestinationCarouselProps = {
  destinations: readonly PopularDestination[];
  onPress: (country: CountryName) => void;
};

const CARD_GAP = 14;
const SIDE_PADDING = 20;
const CARD_HEIGHT = 360;
const IMAGE_PARALLAX = 46;

/** Snap carousel: neighbours shrink and dim, imagery drifts against the swipe. */
export function DestinationCarousel({ destinations, onPress }: DestinationCarouselProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - SIDE_PADDING * 2 - 36, 360);
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
            total={destinations.length}
            width={cardWidth}
            interval={interval}
            scrollX={scrollX}
            onPress={onPress}
          />
        ))}
      </Animated.ScrollView>

      <View style={styles.dots}>
        {destinations.map((country, index) => (
          <PageDot key={country} index={index} interval={interval} scrollX={scrollX} />
        ))}
      </View>
    </View>
  );
}

type DestinationCardProps = {
  country: PopularDestination;
  index: number;
  total: number;
  width: number;
  interval: number;
  scrollX: SharedValue<number>;
  onPress: (country: CountryName) => void;
};

function DestinationCard({
  country,
  index,
  total,
  width,
  interval,
  scrollX,
  onPress,
}: DestinationCardProps) {
  const inputRange = [(index - 1) * interval, index * interval, (index + 1) * interval];

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0.7, 1, 0.7], Extrapolation.CLAMP),
    transform: [
      { scale: interpolate(scrollX.value, inputRange, [0.92, 1, 0.92], Extrapolation.CLAMP) },
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
      { scale: 1.2 },
    ],
  }));

  const details = countryDetails[country];

  return (
    <Animated.View style={[{ width }, styles.cardShadow, Elevation.floating, cardStyle]}>
      <PressableScale
        onPress={() => onPress(country)}
        haptic="light"
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
            transition={500}
            cachePolicy="memory-disk"
            accessibilityLabel={`${country} landmark`}
          />
        </Animated.View>
        <GradientFill
          colors={["#040A1F", "#040A1F", "#040A1F"]}
          opacities={[0.28, 0.05, 0.92]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.topRow}>
          <View style={styles.glassChip}>
            <FlagImage country={country} width={22} radius={4} />
            <Text style={styles.chipText}>{details.demand}</Text>
          </View>
          <Text style={styles.counter}>
            {String(index + 1).padStart(2, "0")}
            <Text style={styles.counterTotal}> / {String(total).padStart(2, "0")}</Text>
          </Text>
        </View>

        <View style={styles.bottom}>
          <View style={styles.bottomText}>
            <View style={styles.popular}>
              <Ionicons name="trending-up" size={12} color={Palette.navy} />
              <Text style={styles.popularText}>Popular</Text>
            </View>
            <Text style={styles.country} numberOfLines={1} adjustsFontSizeToFit>
              {country}
            </Text>
            <Text style={styles.tagline} numberOfLines={2}>
              {popularDestinationTaglines[country]}
            </Text>
          </View>
          <View style={styles.arrow}>
            <Ionicons name="arrow-forward" size={20} color={Palette.navy} />
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
      width: interpolate(scrollX.value, range, [6, 24, 6], Extrapolation.CLAMP),
      opacity: interpolate(scrollX.value, range, [0.22, 1, 0.22], Extrapolation.CLAMP),
    };
  });

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

const styles = StyleSheet.create({
  track: {
    paddingHorizontal: SIDE_PADDING,
    gap: CARD_GAP,
    paddingVertical: 8,
  },
  cardShadow: {
    borderRadius: 32,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 32,
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
    paddingLeft: 7,
    paddingRight: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(4, 10, 31, 0.42)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  chipText: {
    fontFamily: FontFamily.displaySemiBold,
    fontSize: 12,
    color: Palette.white,
  },
  counter: {
    fontFamily: FontFamily.displayBold,
    fontSize: 13,
    color: Palette.white,
  },
  counterTotal: {
    color: "rgba(255,255,255,0.55)",
  },
  bottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  bottomText: {
    flex: 1,
  },
  popular: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: Palette.gold,
  },
  popularText: {
    fontFamily: FontFamily.displayBold,
    fontSize: 11,
    color: Palette.navy,
  },
  country: {
    ...Type.display,
    fontSize: 36,
    lineHeight: 42,
    color: Palette.white,
  },
  tagline: {
    marginTop: 4,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255, 255, 255, 0.8)",
  },
  arrow: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.white,
  },
  dots: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.primary,
  },
});
