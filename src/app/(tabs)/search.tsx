import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type TextStyle } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCountrySlug } from "@/components/home/country-data";
import { SearchResultsSkeleton } from "@/components/skeletons";
import { ProBadge } from "@/components/ui/badge";
import { FadeInView } from "@/components/ui/fade-in-view";
import { FlagImage } from "@/components/ui/flag-image";
import { FocusStatusBar } from "@/components/ui/focus-status-bar";
import { PressableScale } from "@/components/ui/pressable-scale";
import { ScreenHeader, SectionHeader } from "@/components/ui/screen-header";
import { SearchField } from "@/components/ui/search-pill";
import { StateView } from "@/components/ui/state-view";
import { europeanCountryNames } from "@/constants/country";
import { BottomTabInset, Elevation, Palette, Radii, Type } from "@/constants/theme";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import {
  addRecentSearch,
  clearRecentSearches,
  getStoredRecentSearches,
  MIN_SEARCH_LENGTH,
  normalizeQuery,
  SEARCH_DEBOUNCE_MS,
  searchPublishedDocuments,
  trendingQueries,
  type SearchResult,
} from "@/features/search/search-api";
import { haptics } from "@/lib/haptics";

const browseCountries = [
  "Germany",
  "Netherlands",
  "Portugal",
  "Poland",
  "Spain",
  "France",
  "Austria",
  "Denmark",
] as const satisfies readonly (typeof europeanCountryNames)[number][];

export default function SearchScreen() {
  return (
    <PremiumGuard>
      <SearchContent />
    </PremiumGuard>
  );
}

function SearchContent() {
  const router = useRouter();
  const requestIdRef = useRef(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(getStoredRecentSearches);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const shouldSearch = debouncedQuery.length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(normalizeQuery(query));
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (!shouldSearch) {
      requestIdRef.current += 1;
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsSearching(true);
    setError(null);

    searchPublishedDocuments(debouncedQuery)
      .then((nextResults) => {
        if (requestIdRef.current === requestId) {
          setResults(nextResults);
        }
      })
      .catch((searchError) => {
        if (requestIdRef.current !== requestId) {
          return;
        }

        console.warn("Unable to search country documents", searchError);
        setResults([]);
        setError("Search is unavailable right now. Please try again.");
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setIsSearching(false);
        }
      });
  }, [debouncedQuery, shouldSearch, retryToken]);

  const submitSearch = (nextQuery = query) => {
    const nextSearch = normalizeQuery(nextQuery);

    if (!nextSearch) {
      return;
    }

    setQuery(nextSearch);
    setDebouncedQuery(nextSearch);
    setRecentSearches((current) => addRecentSearch(current, nextSearch));
  };

  const openResult = (result: SearchResult) => {
    submitSearch(query || result.title);
    router.push(`/visa/${result.id}`);
  };

  const hasQuery = query.trim().length > 0;
  const isTyping = normalizeQuery(query).length >= MIN_SEARCH_LENGTH && !shouldSearch;
  const showSkeleton = (isSearching || isTyping) && results.length === 0;

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <FocusStatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* The large header steps aside while typing so results get the space above the keyboard. */}
        {hasQuery ? (
          <View style={styles.compactHeader} />
        ) : (
          <Animated.View exiting={FadeOut.duration(140)}>
            <ScreenHeader
              eyebrow="Discover"
              title="Search"
              subtitle={`Visas, permits and documents across ${europeanCountryNames.length} European countries.`}
            />
          </Animated.View>
        )}

        <FadeInView index={1}>
          <SearchField
            value={query}
            onChangeText={setQuery}
            onSubmit={() => submitSearch()}
            isBusy={isSearching}
          />
        </FadeInView>

        {!shouldSearch && !isTyping ? (
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)}>
            {recentSearches.length > 0 ? (
              <FadeInView index={2} style={styles.block}>
                <SectionHeader
                  title="Recent"
                  action={
                    <Pressable
                      onPress={() => {
                        haptics.selection();
                        setRecentSearches(clearRecentSearches());
                      }}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel="Clear recent searches"
                    >
                      <Text style={styles.clearText}>Clear</Text>
                    </Pressable>
                  }
                />
                <View style={[styles.listCard, Elevation.card]}>
                  {recentSearches.map((recentSearch, index) => (
                    <QueryShortcut
                      key={recentSearch}
                      label={recentSearch}
                      isLast={index === recentSearches.length - 1}
                      onPress={() => submitSearch(recentSearch)}
                    />
                  ))}
                </View>
              </FadeInView>
            ) : null}

            <FadeInView index={3} style={styles.block}>
              <SectionHeader title="Trending now" />
              <View style={styles.chips}>
                {trendingQueries.map((trendingQuery) => (
                  <PressableScale
                    key={trendingQuery}
                    onPress={() => submitSearch(trendingQuery)}
                    haptic="selection"
                    style={styles.chip}
                    accessibilityRole="button"
                    accessibilityLabel={`Search ${trendingQuery}`}
                  >
                    <Ionicons name="trending-up" size={15} color={Palette.primary} />
                    <Text style={styles.chipText}>{trendingQuery}</Text>
                  </PressableScale>
                ))}
              </View>
            </FadeInView>

            <FadeInView index={4} style={styles.block}>
              <SectionHeader title="Browse by country" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.countryRow}
                style={styles.countryScroller}
              >
                {browseCountries.map((country) => (
                  <PressableScale
                    key={country}
                    onPress={() => router.push(`/country/${getCountrySlug(country)}`)}
                    haptic="selection"
                    style={[styles.countryChip, Elevation.card]}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${country}`}
                  >
                    <FlagImage country={country} width={34} radius={5} />
                    <Text style={styles.countryChipText}>{country}</Text>
                  </PressableScale>
                ))}
              </ScrollView>
            </FadeInView>
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeIn.duration(200)}
            layout={LinearTransition.duration(220)}
            style={styles.block}
          >
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {showSkeleton ? "Searching" : "Results"}
              </Text>
              {!showSkeleton && !error ? (
                <Text style={styles.resultsMeta}>
                  {results.length} {results.length === 1 ? "guide" : "guides"} for “{debouncedQuery}”
                </Text>
              ) : null}
            </View>

            {showSkeleton ? <SearchResultsSkeleton /> : null}

            {!showSkeleton && error ? (
              <StateView
                icon="cloud-offline-outline"
                tone="danger"
                title="Search unavailable"
                message={error}
                actionLabel="Try again"
                actionIcon="refresh"
                onAction={() => setRetryToken((current) => current + 1)}
              />
            ) : null}

            {!showSkeleton && !error && results.length === 0 ? (
              <StateView
                icon="search"
                title="No guides found"
                message="Try a country name, visa type, document, or permit topic."
              />
            ) : null}

            <View style={styles.results}>
              {results.map((result, index) => (
                <FadeInView key={result.id} index={index}>
                  <SearchResultCard
                    result={result}
                    query={debouncedQuery}
                    onPress={() => openResult(result)}
                  />
                </FadeInView>
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function QueryShortcut({
  label,
  isLast,
  onPress,
}: {
  label: string;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      dimOnPress
      haptic="selection"
      style={[styles.shortcut, !isLast && styles.shortcutDivider]}
      accessibilityRole="button"
      accessibilityLabel={`Search ${label}`}
    >
      <View style={styles.shortcutIcon}>
        <Ionicons name="time-outline" size={16} color={Palette.muted} />
      </View>
      <Text style={styles.shortcutText} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="arrow-up-outline" size={16} color={Palette.faint} style={styles.shortcutArrow} />
    </PressableScale>
  );
}

/** Highlights the words of the query inside a result title. */
function HighlightedText({ text, query, style }: { text: string; query: string; style: TextStyle }) {
  const terms = query
    .split(/\s+/)
    .filter((term) => term.length >= MIN_SEARCH_LENGTH)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (terms.length === 0) {
    return <Text style={style}>{text}</Text>;
  }

  const pattern = new RegExp(`(${terms.join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <Text style={style}>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <Text key={index} style={styles.highlight}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

function SearchResultCard({
  result,
  query,
  onPress,
}: {
  result: SearchResult;
  query: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.975}
      style={[styles.resultCard, Elevation.card]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${result.title}`}
    >
      <View style={styles.resultMeta}>
        <FlagImage country={result.countryName} emoji={result.flagEmoji} width={24} radius={4} />
        <Text style={styles.resultCountry} numberOfLines={1}>
          {result.countryName}
        </Text>
        <View style={styles.metaDot} />
        <Text style={styles.resultCategory} numberOfLines={1}>
          {result.categoryName}
        </Text>
        {result.isPremium ? (
          <View style={styles.pro}>
            <ProBadge />
          </View>
        ) : null}
      </View>

      <View style={styles.resultBody}>
        <View style={styles.resultTextCol}>
          <HighlightedText text={result.title} query={query} style={styles.resultTitle} />
          {result.shortDescription ? (
            <Text style={styles.resultDescription} numberOfLines={2}>
              {result.shortDescription}
            </Text>
          ) : null}
        </View>
        <View style={styles.resultArrow}>
          <Ionicons name="arrow-forward" size={16} color={Palette.primary} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  content: {
    paddingHorizontal: 20,
  },
  block: {
    marginTop: 30,
  },
  clearText: {
    ...Type.label,
    color: Palette.primary,
  },
  listCard: {
    paddingVertical: 4,
    borderRadius: Radii.xl,
    backgroundColor: Palette.card,
  },
  shortcut: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  shortcutDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(10,16,36,0.08)",
  },
  shortcutIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.cardMuted,
  },
  shortcutText: {
    ...Type.bodyMedium,
    flex: 1,
    marginLeft: 12,
    color: Palette.inkSoft,
  },
  shortcutArrow: {
    transform: [{ rotate: "-45deg" }],
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.tintStrong,
  },
  chipText: {
    ...Type.label,
    color: Palette.primary,
  },
  countryScroller: {
    marginHorizontal: -20,
  },
  countryRow: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    gap: 10,
  },
  countryChip: {
    width: 104,
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: Radii.lg,
    backgroundColor: Palette.card,
  },
  countryChipText: {
    ...Type.label,
    fontSize: 13,
    color: Palette.ink,
  },
  resultsHeader: {
    marginBottom: 14,
  },
  resultsTitle: {
    ...Type.title2,
    color: Palette.ink,
  },
  resultsMeta: {
    ...Type.footnote,
    marginTop: 2,
    color: Palette.muted,
  },
  results: {
    gap: 12,
  },
  resultCard: {
    padding: 18,
    borderRadius: Radii.xl,
    backgroundColor: Palette.card,
  },
  resultMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultCountry: {
    ...Type.overline,
    flexShrink: 0,
    color: Palette.primary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Palette.faint,
  },
  resultCategory: {
    ...Type.caption,
    flexShrink: 1,
    color: Palette.muted,
  },
  pro: {
    marginLeft: "auto",
  },
  resultBody: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  resultTextCol: {
    flex: 1,
  },
  resultTitle: {
    ...Type.title3,
    fontSize: 17,
    color: Palette.ink,
  },
  highlight: {
    color: Palette.primary,
    backgroundColor: Palette.tint,
  },
  compactHeader: {
    height: 12,
  },
  resultDescription: {
    ...Type.footnote,
    marginTop: 4,
    color: Palette.muted,
  },
  resultArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.tint,
  },
});
