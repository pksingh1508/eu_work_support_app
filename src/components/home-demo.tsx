import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  GestureResponderEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type ViewToken,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  easiestVisaCountries,
  europeanCountryNames,
  popularDestinations,
  topRated,
} from "@/constants/country";
import { BottomTabInset } from "@/constants/theme";
import { useAuthAccess } from "@/features/auth/access";
import {
  useSavedCountrySlugs,
  useSavedStore,
} from "@/features/saved/saved-store";
import { FontFamily } from "@/lib/fonts";
import {
  fetchCountryIdBySlug,
} from "@/lib/saved-items";
import { showErrorToast, showSavedToast, showUnsavedToast } from "@/lib/toast";

type FilterKey = "all" | "top-rated" | "easiest-visa";

type CountryName = (typeof europeanCountryNames)[number];

type HomeListItem =
  | { type: "welcome" }
  | { type: "search" }
  | { type: "popular" }
  | { type: "filters" }
  | { type: "country"; country: CountryName; countryIndex: number };

type CountryDetails = {
  code: string;
  summary: string;
  demand: string;
};

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All Regions" },
  { key: "top-rated", label: "Top Rated" },
  { key: "easiest-visa", label: "Easiest Visa" },
];

const countryEntryDistance = 34;
const countryEntryDuration = 380;
const initiallyAnimatedCountryCount = 6;

type HeaderGradientSection = "status" | "top" | "bottom";

const headerGradientBands: Record<HeaderGradientSection, string[]> = {
  status: createGradientBands([214, 232, 255], [226, 239, 255]),
  top: createGradientBands([226, 239, 255], [234, 243, 255]),
  bottom: createGradientBands([234, 243, 255], [248, 251, 255]),
};

const destinationScrimOpacities = [
  0.02, 0.06, 0.12, 0.2, 0.32, 0.48, 0.64, 0.78,
];

const cornerGradientBands = [
  ...createGradientBands([7, 67, 42], [121, 177, 139], 24),
  ...createGradientBands([121, 177, 139], [8, 75, 46], 24),
];

const popularDestinationTaglines: Record<
  (typeof popularDestinations)[number],
  string
> = {
  France: "Tech visa program active.",
  Germany: "Leading tech hub with visa routes.",
  Greece: "Fresh work and study routes.",
};

const countryDetails: Record<CountryName, CountryDetails> = {
  Austria: {
    code: "at",
    summary: "High quality of life with skilled worker routes.",
    demand: "Skilled route",
  },
  Belgium: {
    code: "be",
    summary: "Central EU base with multilingual job markets.",
    demand: "EU hub",
  },
  Bulgaria: {
    code: "bg",
    summary: "Lower living costs and growing tech opportunities.",
    demand: "Budget friendly",
  },
  Croatia: {
    code: "hr",
    summary: "Coastal lifestyle with work and residence options.",
    demand: "Coastal jobs",
  },
  "Czech Republic": {
    code: "cz",
    summary: "Strong manufacturing and IT job market.",
    demand: "Work permits",
  },
  Denmark: {
    code: "dk",
    summary: "Stable work culture and high salary potential.",
    demand: "High salary",
  },
  Estonia: {
    code: "ee",
    summary: "Digital-first country with startup visa options.",
    demand: "Startup friendly",
  },
  Finland: {
    code: "fi",
    summary: "Clean, calm, and strong for skilled professionals.",
    demand: "Talent routes",
  },
  France: {
    code: "fr",
    summary: "Tech visa program active.",
    demand: "Tech visa",
  },
  Germany: {
    code: "de",
    summary: "Leading tech hub with streamlined visa options.",
    demand: "High demand",
  },
  Greece: {
    code: "gr",
    summary: "Helpful routes for work, study, and long stays.",
    demand: "Fresh guide",
  },
  Hungary: {
    code: "hu",
    summary: "Central location with accessible residence options.",
    demand: "Central Europe",
  },
  Iceland: {
    code: "is",
    summary: "Small market with unique skilled work needs.",
    demand: "Niche roles",
  },
  Italy: {
    code: "it",
    summary: "Culture-rich destination with annual work quotas.",
    demand: "Quota route",
  },
  Latvia: {
    code: "lv",
    summary: "Baltic destination with practical residence pathways.",
    demand: "Baltic route",
  },
  Liechtenstein: {
    code: "li",
    summary: "Small, premium labor market with strict permits.",
    demand: "Limited permits",
  },
  Lithuania: {
    code: "lt",
    summary: "Growing tech sector and Baltic work opportunities.",
    demand: "Tech growth",
  },
  Luxembourg: {
    code: "lu",
    summary: "Finance-led market with strong salaries.",
    demand: "Finance hub",
  },
  Malta: {
    code: "mt",
    summary: "English-friendly island with service jobs.",
    demand: "English friendly",
  },
  Netherlands: {
    code: "nl",
    summary: "Excellent work-life balance.",
    demand: "Top rated",
  },
  Norway: {
    code: "no",
    summary: "High income destination with skilled job demand.",
    demand: "High income",
  },
  Poland: {
    code: "pl",
    summary: "Fast-growing market with clear work permit routes.",
    demand: "Fast growth",
  },
  Portugal: {
    code: "pt",
    summary: "Popular for remote work and residence planning.",
    demand: "Remote work",
  },
  Romania: {
    code: "ro",
    summary: "Growing EU market with accessible cost of living.",
    demand: "Growing market",
  },
  Slovakia: {
    code: "sk",
    summary: "Manufacturing and service jobs in central Europe.",
    demand: "Industry jobs",
  },
  Slovenia: {
    code: "si",
    summary: "Compact EU destination with quality living.",
    demand: "Quality life",
  },
  Spain: {
    code: "es",
    summary: "Popular for study, work, and digital nomad plans.",
    demand: "Popular choice",
  },
};

const popularDestinationImages: Record<
  (typeof popularDestinations)[number],
  string
> = {
  France:
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=80",
  Germany:
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=80",
  Greece:
    "https://images.unsplash.com/photo-1504512485720-7d83a16ee930?auto=format&fit=crop&w=900&q=80",
};

function getCountrySlug(country: string) {
  return country
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getFlagUrl(country: CountryName) {
  return `https://flagcdn.com/w80/${countryDetails[country].code}.png`;
}

function createGradientBands(
  startColor: [number, number, number],
  endColor: [number, number, number],
  count = 20,
) {
  return Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1);
    const channels = startColor.map((startChannel, channelIndex) =>
      Math.round(
        startChannel +
          (endColor[channelIndex] - startChannel) * progress,
      ),
    );

    return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
  });
}

export function HomeDemo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthLoaded, userId, hasPremiumAccess } = useAuthAccess();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [countryIdsBySlug, setCountryIdsBySlug] = useState<
    Record<string, string>
  >({});
  const [resolvingCountrySlug, setResolvingCountrySlug] = useState<string | null>(
    null,
  );
  const savedCountrySlugs = useSavedCountrySlugs();
  const pendingMutations = useSavedStore((state) => state.pendingMutations);
  const hydrateSavedForUser = useSavedStore((state) => state.hydrateForUser);
  const resetSavedStore = useSavedStore((state) => state.reset);
  const saveCountryOptimistic = useSavedStore(
    (state) => state.saveCountryOptimistic,
  );
  const unsaveCountryOptimistic = useSavedStore(
    (state) => state.unsaveCountryOptimistic,
  );
  const activeFilterRef = useRef(activeFilter);
  const filterDockedRef = useRef(false);
  const popularSectionHeightRef = useRef(0);
  const welcomeSectionHeightRef = useRef(0);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 35 }).current;
  const [isFilterDocked, setIsFilterDocked] = useState(false);
  const [visibleCountryKeys, setVisibleCountryKeys] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    activeFilterRef.current = activeFilter;
    setVisibleCountryKeys(new Set());
  }, [activeFilter]);

  const filteredCountries = useMemo(() => {
    if (activeFilter === "top-rated") {
      return topRated;
    }

    if (activeFilter === "easiest-visa") {
      return easiestVisaCountries;
    }

    return europeanCountryNames;
  }, [activeFilter]);

  const homeListData = useMemo<HomeListItem[]>(
    () => [
      { type: "welcome" },
      { type: "search" },
      { type: "popular" },
      { type: "filters" },
      ...filteredCountries.map((country, countryIndex) => ({
        type: "country" as const,
        country,
        countryIndex,
      })),
    ],
    [filteredCountries],
  );

  const openCountry = (country: CountryName) => {
    router.push(`/country/${getCountrySlug(country)}`);
  };

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<HomeListItem>[] }) => {
      const filterKey = activeFilterRef.current;

      setVisibleCountryKeys((currentKeys) => {
        const nextKeys = new Set(currentKeys);

        viewableItems.forEach((item) => {
          if (
            item.isViewable &&
            item.item &&
            item.item.type === "country"
          ) {
            nextKeys.add(`${filterKey}-${item.item.country}`);
          }
        });

        return nextKeys;
      });
    },
  ).current;

  const setWelcomeSectionLayout = useCallback((height: number) => {
    welcomeSectionHeightRef.current = height;
  }, []);

  const setPopularSectionLayout = useCallback((height: number) => {
    popularSectionHeightRef.current = height;
  }, []);

  const handleHomeScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const threshold =
        welcomeSectionHeightRef.current + popularSectionHeightRef.current;
      const shouldDock =
        threshold > 0 &&
        event.nativeEvent.contentOffset.y >= threshold;

      if (shouldDock !== filterDockedRef.current) {
        filterDockedRef.current = shouldDock;
        setIsFilterDocked(shouldDock);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      if (!isAuthLoaded) {
        return;
      }

      if (!hasPremiumAccess || !userId) {
        resetSavedStore();
        return;
      }

      void hydrateSavedForUser(userId);
    }, [
      hasPremiumAccess,
      hydrateSavedForUser,
      isAuthLoaded,
      resetSavedStore,
      userId,
    ]),
  );

  const toggleSavedCountry = useCallback(
    async (country: CountryName) => {
      if (!hasPremiumAccess || !userId) {
        router.push("/saved");
        return;
      }

      const slug = getCountrySlug(country);
      const shouldSave = !savedCountrySlugs.has(slug);
      setResolvingCountrySlug(slug);

      try {
        let countryId = countryIdsBySlug[slug];

        if (!countryId) {
          countryId = await fetchCountryIdBySlug(slug);

          if (!countryId) {
            throw new Error("Country not found.");
          }

          setCountryIdsBySlug((currentIds) => ({
            ...currentIds,
            [slug]: countryId,
          }));
        }

        if (shouldSave) {
          void saveCountryOptimistic({
            clerkUserId: userId,
            countryId,
            country: {
              id: `country:${countryId}`,
              countryId,
              slug,
              name: country,
              flagEmoji: null,
              shortDescription: countryDetails[country].summary,
              createdAt: new Date().toISOString(),
            },
          }).catch((error) => {
            console.warn("Unable to update saved country", error);
            showErrorToast(
              "Could not save country",
              "Please try again in a moment.",
            );
          });
          showSavedToast(country, "country");
        } else {
          void unsaveCountryOptimistic({
            clerkUserId: userId,
            countryId,
          }).catch((error) => {
            console.warn("Unable to update saved country", error);
            showErrorToast(
              "Could not remove country",
              "Please try again in a moment.",
            );
          });
          showUnsavedToast(country, "country");
        }
      } catch (error) {
        console.warn("Unable to update saved country", error);
        showErrorToast(
          "Could not update saved country",
          "Please try again in a moment.",
        );
      } finally {
        setResolvingCountrySlug(null);
      }
    },
    [
      countryIdsBySlug,
      hasPremiumAccess,
      router,
      saveCountryOptimistic,
      savedCountrySlugs,
      unsaveCountryOptimistic,
      userId,
    ],
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" backgroundColor="#D6E8FF" />
      <View
        pointerEvents="none"
        style={{ height: insets.top }}
        className="overflow-hidden"
      >
        <PremiumHeaderBackdrop section="status" />
      </View>
      <FlatList
        data={homeListData}
        keyExtractor={(item) => {
          if (item.type === "country") {
            return `${activeFilter}-${item.country}`;
          }

          return item.type;
        }}
        renderItem={({ item }) => {
          if (item.type === "welcome") {
            return (
              <View
                onLayout={(event) =>
                  setWelcomeSectionLayout(event.nativeEvent.layout.height)
                }
                className="relative overflow-hidden bg-[#EEF4FF] px-5 pb-5 pt-6"
              >
                <PremiumHeaderBackdrop section="top" />

                <Text className="text-[36px] font-serif font-extrabold leading-[42px] tracking-[-0.6px] text-diplomatic-ink">
                  Welcome
                </Text>
                <Text className="mt-2 max-w-[330px] text-[17px] font-semibold leading-6 tracking-normal text-[#53627A]">
                  Your journey to working in Europe begins here.
                </Text>
              </View>
            );
          }

          if (item.type === "search") {
            return (
              <View className="relative overflow-hidden rounded-b-[28px] bg-[#EEF4FF] px-5 pb-6 pt-1">
                <PremiumHeaderBackdrop section="bottom" />

                <Pressable
                  onPress={() => router.push("/search")}
                  style={premiumHeaderStyles.searchShadow}
                  className="h-[68px] w-full flex-row items-center rounded-[24px] border border-white bg-white/95 px-4 active:opacity-90"
                  accessibilityRole="button"
                  accessibilityLabel="Search countries, visas, and topics"
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-[#EDF4FF]">
                    <Ionicons name="search" size={21} color="#0058BC" />
                  </View>
                  <Text
                    numberOfLines={1}
                    className="ml-3 min-w-0 flex-1 text-[15px] font-semibold tracking-normal text-[#7A8495]"
                  >
                    Search countries, visas &amp; more
                  </Text>
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-diplomatic-primary">
                    <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                  </View>
                </Pressable>

                {isFilterDocked ? (
                  <View className="mt-4">
                    <FilterTabs
                      activeFilter={activeFilter}
                      onChange={setActiveFilter}
                      onGradient
                    />
                  </View>
                ) : null}
              </View>
            );
          }

          if (item.type === "popular") {
            return (
            <View
              onLayout={(event) =>
                setPopularSectionLayout(event.nativeEvent.layout.height)
              }
              className="pt-4"
            >
              <View className="px-5">
                <Text className="text-[25px] font-serif font-extrabold tracking-normal text-diplomatic-ink">
                  Popular Destinations
                </Text>
              </View>

              <ScrollView
                horizontal
                className="mt-5"
                contentContainerClassName="gap-4 px-5"
                showsHorizontalScrollIndicator={false}
              >
                {popularDestinations.map((country) => (
                  <PopularDestinationCard
                    key={country}
                    country={country}
                    onPress={openCountry}
                  />
                ))}
              </ScrollView>

              <View className="mt-6" />
            </View>
            );
          }

          if (item.type === "filters") {
            return (
              <View className={isFilterDocked ? "opacity-0" : "opacity-100"}>
                <FilterTabs
                  activeFilter={activeFilter}
                  onChange={setActiveFilter}
                />
              </View>
            );
          }

          const country = item.country;
          const countryIndex = item.countryIndex;
          const slug = getCountrySlug(country);
          const countryId = countryIdsBySlug[slug];

          return (
            <View className={`${countryIndex === 0 ? "mt-4" : ""} mb-5 px-5`}>
              <AnimatedCountryListCard
                animationKey={`${activeFilter}-${country}`}
                country={country}
                index={countryIndex}
                isVisible={
                  countryIndex < initiallyAnimatedCountryCount ||
                  visibleCountryKeys.has(`${activeFilter}-${country}`)
                }
                onPress={openCountry}
                canSave={hasPremiumAccess}
                isSaved={savedCountrySlugs.has(slug)}
                isSaving={
                  resolvingCountrySlug === slug ||
                  Boolean(
                    countryId && pendingMutations[`country:${countryId}`],
                  )
                }
                onToggleSave={toggleSavedCountry}
              />
            </View>
          );
        }}
        className="flex-1 bg-white"
        contentContainerStyle={{ paddingBottom: BottomTabInset }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={9}
        maxToRenderPerBatch={5}
        onScroll={handleHomeScroll}
        onViewableItemsChanged={handleViewableItemsChanged}
        stickyHeaderIndices={[1]}
        scrollEventThrottle={16}
        viewabilityConfig={viewabilityConfig}
        windowSize={5}
      />
    </View>
  );
}

function FilterTabs({
  activeFilter,
  onChange,
  onGradient = false,
}: {
  activeFilter: FilterKey;
  onChange: (filter: FilterKey) => void;
  onGradient?: boolean;
}) {
  return (
    <View
      className={onGradient ? "bg-transparent" : "bg-white px-5"}
    >
      <ScrollView
        horizontal
        contentContainerClassName="gap-3"
        showsHorizontalScrollIndicator={false}
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter.key;

          return (
            <Pressable
              key={filter.key}
              onPress={() => onChange(filter.key)}
              className={`h-10 items-center justify-center rounded-full px-5 ${
                isActive ? "bg-diplomatic-surfaceHigh" : "bg-white"
              }`}
            >
              <Text
                className={`text-sm font-extrabold tracking-normal ${
                  isActive
                    ? "text-diplomatic-primary"
                    : "text-diplomatic-secondaryText"
                }`}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function PremiumHeaderBackdrop({
  section,
}: {
  section: HeaderGradientSection;
}) {
  const bands = headerGradientBands[section];

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      className="overflow-hidden"
    >
      {bands.map((backgroundColor, index) => (
        <View
          key={`${section}-${index}`}
          style={{ flex: 1, backgroundColor }}
        />
      ))}
    </View>
  );
}

const premiumHeaderStyles = StyleSheet.create({
  searchShadow: Platform.select({
    web: {
      boxShadow: "0 12px 24px rgba(18, 60, 115, 0.12)",
    },
    default: {
      shadowColor: "#123C73",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 6,
    },
  }),
  popularCardShadow: Platform.select({
    web: {
      boxShadow: "0 18px 34px rgba(15, 35, 66, 0.18)",
    },
    default: {
      shadowColor: "#0F2342",
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.18,
      shadowRadius: 22,
      elevation: 8,
    },
  }),
});

function AnimatedCountryListCard({
  animationKey,
  country,
  index,
  isVisible,
  onPress,
  canSave,
  isSaved,
  isSaving,
  onToggleSave,
}: {
  animationKey: string;
  country: CountryName;
  index: number;
  isVisible: boolean;
  onPress: (country: CountryName) => void;
  canSave: boolean;
  isSaved: boolean;
  isSaving: boolean;
  onToggleSave: (country: CountryName) => void;
}) {
  const entryProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isVisible) {
      entryProgress.setValue(0);
      return;
    }

    entryProgress.setValue(0);
    Animated.timing(entryProgress, {
      toValue: 1,
      duration: countryEntryDuration,
      delay: Math.min((index % 8) * 45, 260),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animationKey, entryProgress, index, isVisible]);

  const animatedStyle = {
    opacity: entryProgress,
    transform: [
      {
        translateX: entryProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [-countryEntryDistance, 0],
        }),
      },
      {
        scale: entryProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.985, 1],
        }),
      },
    ],
  };

  return (
    <Animated.View style={animatedStyle}>
      <CountryListCard
        country={country}
        onPress={onPress}
        canSave={canSave}
        isSaved={isSaved}
        isSaving={isSaving}
        onToggleSave={onToggleSave}
      />
    </Animated.View>
  );
}

function PopularDestinationCard({
  country,
  onPress,
}: {
  country: (typeof popularDestinations)[number];
  onPress: (country: CountryName) => void;
}) {
  return (
    <View
      style={premiumHeaderStyles.popularCardShadow}
      className="h-[260px] w-[310px] rounded-[26px]"
    >
      <Pressable
        onPress={() => onPress(country)}
        className="h-full w-full overflow-hidden rounded-[26px] bg-diplomatic-ink active:opacity-95"
        accessibilityRole="button"
        accessibilityLabel={`Explore ${country}`}
      >
        <Image
          source={{ uri: popularDestinationImages[country] }}
          style={{ height: 260, width: "100%" }}
          contentFit="cover"
          transition={250}
        />

        <View
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(10, 21, 16, 0.16)" }}
        />
        <View className="absolute inset-x-0 bottom-0 h-[155px]">
          {destinationScrimOpacities.map((opacity, index) => (
            <View
              key={`${country}-scrim-${index}`}
              style={{
                flex: 1,
                backgroundColor: `rgba(5, 12, 25, ${opacity})`,
              }}
            />
          ))}
        </View>

        <View className="absolute inset-x-5 bottom-5 pr-[62px]">
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.76}
            style={{
              fontFamily: FontFamily.headingBlack,
              fontSize: 36,
              lineHeight: 41,
              letterSpacing: -1.1,
            }}
            className="uppercase text-white"
          >
            {country.toUpperCase()}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            style={{
              fontFamily: Platform.select({
                ios: "Georgia",
                android: "serif",
                default: "Georgia, serif",
              }),
            }}
            className="mt-1 text-[16px] leading-5 tracking-[-0.2px] text-white/90"
          >
            {popularDestinationTaglines[country]}
          </Text>
        </View>

        <View className="absolute -bottom-[59px] -right-[59px] h-[140px] w-[140px] rotate-45 overflow-hidden">
          <View className="absolute inset-0 flex-row">
            {cornerGradientBands.map((backgroundColor, index) => (
              <View
                key={`${country}-corner-${index}`}
                style={{ flex: 1, backgroundColor }}
              />
            ))}
          </View>
        </View>
        <View className="absolute bottom-[17px] right-[16px] h-11 w-11 items-center justify-center">
          <Ionicons
            name="arrow-forward"
            size={31}
            color="rgba(3, 45, 28, 0.38)"
            style={{ position: "absolute", left: 8, top: 9 }}
          />
          <Ionicons name="arrow-forward" size={31} color="#DCE8D9" />
        </View>
      </Pressable>
    </View>
  );
}

function CountryListCard({
  country,
  onPress,
  canSave,
  isSaved,
  isSaving,
  onToggleSave,
}: {
  country: CountryName;
  onPress: (country: CountryName) => void;
  canSave: boolean;
  isSaved: boolean;
  isSaving: boolean;
  onToggleSave: (country: CountryName) => void;
}) {
  const details = countryDetails[country];
  const bookmarkIcon = isSaved ? "bookmark" : "bookmark-outline";

  return (
    <Pressable
      onPress={() => onPress(country)}
      className="min-h-[120px] rounded-atelier bg-white px-5 py-5"
      accessibilityRole="button"
    >
      <View className="flex-row items-start justify-between">
        <Image
          source={{ uri: getFlagUrl(country) }}
          style={{ width: 30, height: 20, borderRadius: 3 }}
          contentFit="cover"
        />
        {canSave ? (
          <Pressable
            onPress={(event: GestureResponderEvent) => {
              event.stopPropagation();
              onToggleSave(country);
            }}
            disabled={isSaving}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={
              isSaved ? `Unsave ${country}` : `Save ${country}`
            }
            className={`h-8 w-8 items-center justify-center rounded-full active:opacity-70 disabled:opacity-60 ${
              isSaved ? "bg-[#DFF3E6]" : "bg-transparent"
            }`}
          >
            <Ionicons
              name={bookmarkIcon}
              size={21}
              color={isSaved ? "#183B2B" : "#2F3A4A"}
            />
          </Pressable>
        ) : null}
      </View>
      <Text className="mt-7 text-[20px] font-serif font-extrabold tracking-normal text-diplomatic-ink">
        {country}
      </Text>
      <Text className="mt-1 text-sm font-semibold tracking-normal text-diplomatic-secondaryText">
        {details.summary}
      </Text>
    </Pressable>
  );
}
