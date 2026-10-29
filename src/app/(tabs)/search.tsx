import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomLoading } from "@/components/custom-loading";
import { FadeInView } from "@/components/ui/fade-in-view";
import { FocusStatusBar } from "@/components/ui/focus-status-bar";
import { PressableScale } from "@/components/ui/pressable-scale";
import { ScreenHeader, SectionLabel } from "@/components/ui/screen-header";
import { SearchPill } from "@/components/ui/search-pill";
import { BottomTabInset, Elevation, Palette } from "@/constants/theme";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { appStorage } from "@/lib/local-storage";
import { FontFamily } from "@/lib/fonts";
import { supabase } from "@/lib/supabase";

const RECENT_SEARCHES_KEY = "search.recentQueries";
const MAX_RECENT_SEARCHES = 5;
const SEARCH_LIMIT = 25;
const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 350;

const fallbackRecentSearches = [
  "Digital Nomad Visa Spain",
  "Berlin Tech Salaries",
  "Blue Card Requirements",
];

const trendingQueries = [
  "Germany Tech Visa",
  "Poland Work Permit",
  "Netherlands 30% Ruling",
  "Portugal D7",
];

const documentSelect = `
  id,
  title,
  slug,
  short_description,
  is_premium,
  language,
  sort_order,
  countries!inner (
    id,
    name,
    slug,
    flag_emoji,
    popularity_rank,
    is_active
  ),
  document_categories!inner (
    id,
    name,
    slug,
    sort_order
  )
`;

type RelatedCountry = {
  id: string;
  name: string;
  slug: string;
  flag_emoji: string | null;
  popularity_rank: number | null;
};

type RelatedCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number | null;
};

type RawSearchDocument = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  is_premium: boolean;
  language: string;
  sort_order: number | null;
  countries: RelatedCountry | RelatedCountry[];
  document_categories: RelatedCategory | RelatedCategory[];
};

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  isPremium: boolean;
  sortOrder: number;
  countryName: string;
  countrySlug: string;
  flagEmoji: string | null;
  popularityRank: number;
  categoryName: string;
  categorySlug: string;
  categorySortOrder: number;
};

type MatchLookup = {
  countryIds: string[];
  categoryIds: string[];
};

function normalizeQuery(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 80);
}

function toIlikePattern(value: string) {
  return `%${normalizeQuery(value).replace(/[%_]/g, "")}%`;
}

function firstRelation<T>(value: T | T[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getStoredRecentSearches() {
  const stored = appStorage.getString(RECENT_SEARCHES_KEY);

  if (!stored) {
    return fallbackRecentSearches;
  }

  try {
    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return fallbackRecentSearches;
    }

    const searches = parsed.filter(
      (item): item is string => typeof item === "string",
    );
    return searches.length > 0
      ? searches.slice(0, MAX_RECENT_SEARCHES)
      : fallbackRecentSearches;
  } catch {
    return fallbackRecentSearches;
  }
}

function saveRecentSearches(searches: string[]) {
  appStorage.set(
    RECENT_SEARCHES_KEY,
    JSON.stringify(searches.slice(0, MAX_RECENT_SEARCHES)),
  );
}

function addRecentSearch(searches: string[], query: string) {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return searches;
  }

  const nextSearches = [
    normalized,
    ...searches.filter(
      (item) => item.toLowerCase() !== normalized.toLowerCase(),
    ),
  ].slice(0, MAX_RECENT_SEARCHES);

  saveRecentSearches(nextSearches);
  return nextSearches;
}

function mapSearchResult(row: RawSearchDocument): SearchResult | null {
  const country = firstRelation(row.countries);
  const category = firstRelation(row.document_categories);

  if (!country || !category) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    shortDescription: row.short_description,
    isPremium: row.is_premium,
    sortOrder: row.sort_order ?? 100,
    countryName: country.name,
    countrySlug: country.slug,
    flagEmoji: country.flag_emoji,
    popularityRank: country.popularity_rank ?? 999,
    categoryName: category.name,
    categorySlug: category.slug,
    categorySortOrder: category.sort_order ?? 100,
  };
}

function mergeSearchRows(rows: RawSearchDocument[]) {
  const uniqueRows = new Map<string, RawSearchDocument>();

  rows.forEach((row) => {
    uniqueRows.set(row.id, row);
  });

  return Array.from(uniqueRows.values())
    .map(mapSearchResult)
    .filter((result): result is SearchResult => Boolean(result))
    .sort((left, right) => {
      const popularity = left.popularityRank - right.popularityRank;

      if (popularity !== 0) {
        return popularity;
      }

      const categorySort = left.categorySortOrder - right.categorySortOrder;

      if (categorySort !== 0) {
        return categorySort;
      }

      const documentSort = left.sortOrder - right.sortOrder;

      if (documentSort !== 0) {
        return documentSort;
      }

      return left.title.localeCompare(right.title);
    })
    .slice(0, SEARCH_LIMIT);
}

async function getMatchedCountryAndCategoryIds(
  pattern: string,
): Promise<MatchLookup> {
  const [countriesResponse, categoriesResponse] = await Promise.all([
    supabase
      .from("countries")
      .select("id")
      .eq("is_active", true)
      .ilike("name", pattern)
      .limit(10),
    supabase
      .from("document_categories")
      .select("id")
      .ilike("name", pattern)
      .limit(10),
  ]);

  if (countriesResponse.error) {
    throw countriesResponse.error;
  }

  if (categoriesResponse.error) {
    throw categoriesResponse.error;
  }

  return {
    countryIds: countriesResponse.data?.map((country) => country.id) ?? [],
    categoryIds: categoriesResponse.data?.map((category) => category.id) ?? [],
  };
}

function publishedDocumentsQuery() {
  return supabase
    .from("country_documents")
    .select(documentSelect)
    .eq("status", "published")
    .eq("language", "en")
    .eq("countries.is_active", true);
}

async function searchPublishedDocuments(query: string) {
  const pattern = toIlikePattern(query);
  const [documentResponse, matches] = await Promise.all([
    publishedDocumentsQuery().ilike("search_text", pattern).limit(SEARCH_LIMIT),
    getMatchedCountryAndCategoryIds(pattern),
  ]);

  if (documentResponse.error) {
    throw documentResponse.error;
  }

  const extraQueries = [];

  if (matches.countryIds.length > 0) {
    extraQueries.push(
      publishedDocumentsQuery()
        .in("country_id", matches.countryIds)
        .limit(SEARCH_LIMIT),
    );
  }

  if (matches.categoryIds.length > 0) {
    extraQueries.push(
      publishedDocumentsQuery()
        .in("category_id", matches.categoryIds)
        .limit(SEARCH_LIMIT),
    );
  }

  const extraResponses = await Promise.all(extraQueries);
  const extraRows: RawSearchDocument[] = [];

  extraResponses.forEach((response) => {
    if (response.error) {
      throw response.error;
    }

    extraRows.push(...((response.data as RawSearchDocument[] | null) ?? []));
  });

  return mergeSearchRows([
    ...(documentResponse.data ?? []),
    ...extraRows,
  ] as RawSearchDocument[]);
}

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
        if (requestIdRef.current !== requestId) {
          return;
        }

        setResults(nextResults);
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
  }, [debouncedQuery, shouldSearch]);

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

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <FocusStatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: BottomTabInset + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="Discover"
          title="Search"
          subtitle="Visas, permits and documents across 27 European countries."
        />

        <FadeInView index={1}>
          <SearchPill
            value={query}
            onChangeText={setQuery}
            onSubmit={() => submitSearch()}
          />
        </FadeInView>

        {!shouldSearch ? (
          <>
            <FadeInView index={2} style={styles.block}>
              <SectionLabel title="Recent searches" />
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

            <FadeInView index={3} style={styles.block}>
              <SectionLabel title="Trending now" />
              <View style={styles.chips}>
                {trendingQueries.map((trendingQuery) => (
                  <PressableScale
                    key={trendingQuery}
                    onPress={() => submitSearch(trendingQuery)}
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
          </>
        ) : (
          <View style={styles.block}>
            <SectionLabel
              title={isSearching ? "Searching…" : `${results.length} results`}
              action={isSearching ? <CustomLoading size={28} /> : null}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Palette.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {!isSearching && !error && results.length === 0 ? (
              <FadeInView style={[styles.empty, Elevation.card]}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="search" size={26} color={Palette.primary} />
                </View>
                <Text style={styles.emptyTitle}>No guides found</Text>
                <Text style={styles.emptyText}>
                  Try a country name, visa type, document, or permit topic.
                </Text>
              </FadeInView>
            ) : null}

            <View style={styles.results}>
              {results.map((result, index) => (
                <FadeInView key={result.id} index={index}>
                  <SearchResultCard
                    result={result}
                    onPress={() => openResult(result)}
                  />
                </FadeInView>
              ))}
            </View>
          </View>
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
      scaleTo={0.98}
      style={[styles.shortcut, !isLast && styles.shortcutGap]}
      accessibilityRole="button"
      accessibilityLabel={`Search ${label}`}
    >
      <View style={styles.shortcutIcon}>
        <Ionicons name="time-outline" size={17} color={Palette.muted} />
      </View>
      <Text style={styles.shortcutText} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="arrow-up-outline" size={16} color={Palette.subtle} style={styles.shortcutArrow} />
    </PressableScale>
  );
}

function SearchResultCard({
  result,
  onPress,
}: {
  result: SearchResult;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.resultCard, Elevation.card]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${result.title}`}
    >
      <View style={styles.resultMeta}>
        {result.flagEmoji ? (
          <Text style={styles.flagEmoji}>{result.flagEmoji}</Text>
        ) : (
          <Ionicons name="flag-outline" size={16} color={Palette.subtle} />
        )}
        <Text style={styles.resultCountry}>{result.countryName}</Text>
        <View style={styles.metaDot} />
        <Text style={styles.resultCategory} numberOfLines={1}>
          {result.categoryName}
        </Text>
        {result.isPremium ? (
          <View style={styles.premium}>
            <Ionicons name="sparkles" size={10} color="#FFFFFF" />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.resultBody}>
        <View style={styles.resultTextCol}>
          <Text style={styles.resultTitle}>{result.title}</Text>
          {result.shortDescription ? (
            <Text style={styles.resultDescription} numberOfLines={2}>
              {result.shortDescription}
            </Text>
          ) : null}
        </View>
        <View style={styles.resultArrow}>
          <Ionicons name="arrow-forward" size={17} color={Palette.primary} />
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
    marginTop: 28,
  },
  listCard: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 22,
    backgroundColor: Palette.card,
  },
  shortcut: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  shortcutGap: {
    marginBottom: 2,
  },
  shortcutIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.canvas,
  },
  shortcutText: {
    flex: 1,
    marginLeft: 12,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Palette.inkSoft,
  },
  shortcutArrow: {
    transform: [{ rotate: "-45deg" }],
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.tintStrong,
  },
  chipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Palette.primary,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Palette.dangerTint,
  },
  errorText: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Palette.danger,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: Palette.card,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.tint,
  },
  emptyTitle: {
    marginTop: 14,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 18,
    color: Palette.ink,
  },
  emptyText: {
    marginTop: 6,
    textAlign: "center",
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    color: Palette.muted,
  },
  results: {
    gap: 12,
  },
  resultCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: Palette.card,
  },
  resultMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flagEmoji: {
    fontSize: 16,
  },
  resultCountry: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: Palette.primary,
    textTransform: "uppercase",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Palette.subtle,
  },
  resultCategory: {
    flexShrink: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Palette.muted,
  },
  premium: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: Palette.ink,
  },
  premiumText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 10,
    letterSpacing: 0.4,
    color: "#FFFFFF",
  },
  resultBody: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  resultTextCol: {
    flex: 1,
  },
  resultTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 17,
    lineHeight: 23,
    color: Palette.ink,
  },
  resultDescription: {
    marginTop: 4,
    fontFamily: FontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: Palette.muted,
  },
  resultArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.tint,
  },
});
