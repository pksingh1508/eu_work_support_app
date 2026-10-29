import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View, type ListRenderItem } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { CountryCard } from "@/components/home/country-card";
import {
  countryDetails,
  getCountrySlug,
  type CountryName,
} from "@/components/home/country-data";
import { DestinationCarousel } from "@/components/home/destination-carousel";
import { FilterTabs, type FilterKey } from "@/components/home/filter-tabs";
import { HomeHero } from "@/components/home/home-hero";
import { FadeInView } from "@/components/ui/fade-in-view";
import { FocusStatusBar } from "@/components/ui/focus-status-bar";
import {
  easiestVisaCountries,
  europeanCountryNames,
  popularDestinations,
  topRated,
} from "@/constants/country";
import { BottomTabInset, HeroGradient, Palette } from "@/constants/theme";
import { useAuthAccess } from "@/features/auth/access";
import {
  useSavedCountrySlugs,
  useSavedStore,
} from "@/features/saved/saved-store";
import { FontFamily } from "@/lib/fonts";
import { fetchCountryIdBySlug } from "@/lib/saved-items";
import { showErrorToast, showSavedToast, showUnsavedToast } from "@/lib/toast";

type HomeListItem =
  | { type: "hero" }
  | { type: "popular" }
  | { type: "filters" }
  | { type: "count"; total: number }
  | { type: "country"; country: CountryName; countryIndex: number };

const FILTERS_INDEX = 2;
/** Scroll offset after which the status bar area turns light. */
const HERO_COLLAPSE_OFFSET = 300;

export function HomeDemo() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthLoaded, userId, hasPremiumAccess } = useAuthAccess();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [isHeroCollapsed, setIsHeroCollapsed] = useState(false);
  const [countryIdsBySlug, setCountryIdsBySlug] = useState<
    Record<string, string>
  >({});
  const [resolvingCountrySlug, setResolvingCountrySlug] = useState<
    string | null
  >(null);
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
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  useAnimatedReaction(
    () => scrollY.value > HERO_COLLAPSE_OFFSET,
    (collapsed, previous) => {
      if (collapsed !== previous) {
        scheduleOnRN(setIsHeroCollapsed, collapsed);
      }
    },
  );

  const statusBackdropStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      scrollY.value,
      [HERO_COLLAPSE_OFFSET - 80, HERO_COLLAPSE_OFFSET],
      [HeroGradient[0], Palette.canvas],
    ),
  }));

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
      { type: "hero" },
      { type: "popular" },
      { type: "filters" },
      { type: "count", total: filteredCountries.length },
      ...filteredCountries.map((country, countryIndex) => ({
        type: "country" as const,
        country,
        countryIndex,
      })),
    ],
    [filteredCountries],
  );

  const openCountry = useCallback(
    (country: CountryName) => {
      router.push(`/country/${getCountrySlug(country)}`);
    },
    [router],
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

  const renderItem: ListRenderItem<HomeListItem> = ({ item }) => {
    if (item.type === "hero") {
      return (
        <HomeHero
          scrollY={scrollY}
          countryCount={europeanCountryNames.length}
          onSearchPress={() => router.push("/search")}
        />
      );
    }

    if (item.type === "popular") {
      return (
        <View style={styles.section}>
          <SectionHeading
            eyebrow="Trending now"
            title="Popular destinations"
          />
          <DestinationCarousel
            destinations={popularDestinations}
            onPress={openCountry}
          />
        </View>
      );
    }

    if (item.type === "filters") {
      return <FilterTabs activeFilter={activeFilter} onChange={setActiveFilter} />;
    }

    if (item.type === "count") {
      return (
        <View style={styles.countRow}>
          <Text style={styles.countTitle}>Explore countries</Text>
          <Text style={styles.countValue}>{item.total} results</Text>
        </View>
      );
    }

    const slug = getCountrySlug(item.country);
    const countryId = countryIdsBySlug[slug];

    return (
      <FadeInView index={item.countryIndex % 8} style={styles.countryItem}>
        <CountryCard
          country={item.country}
          canSave={hasPremiumAccess}
          isSaved={savedCountrySlugs.has(slug)}
          isSaving={
            resolvingCountrySlug === slug ||
            Boolean(countryId && pendingMutations[`country:${countryId}`])
          }
          onPress={openCountry}
          onToggleSave={toggleSavedCountry}
        />
      </FadeInView>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FocusStatusBar style={isHeroCollapsed ? "dark" : "light"} />
      <Animated.View
        pointerEvents="none"
        style={[styles.statusBackdrop, { height: insets.top }, statusBackdropStyle]}
      />
      <Animated.FlatList
        data={homeListData}
        keyExtractor={(item) =>
          item.type === "country" ? `${activeFilter}-${item.country}` : item.type
        }
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 8 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={7}
        onScroll={onScroll}
        scrollEventThrottle={16}
        stickyHeaderIndices={[FILTERS_INDEX]}
      />
    </View>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
      <Text style={styles.headingTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  statusBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  list: {
    flex: 1,
  },
  section: {
    paddingTop: 22,
    paddingBottom: 18,
  },
  heading: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  eyebrow: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Palette.primary,
  },
  headingTitle: {
    marginTop: 4,
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: Palette.ink,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  countTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 18,
    color: Palette.ink,
  },
  countValue: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Palette.muted,
  },
  countryItem: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
});
