import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabInset } from "@/constants/theme";
import { appStorage } from "@/lib/local-storage";
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
    <SafeAreaView edges={["top"]} className="flex-1 bg-diplomatic-surface">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        className="flex-1"
        contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-8">
          <View className="h-14 flex-row items-center rounded-[26px] border border-[#A4AAB8] bg-white px-4">
            <Ionicons name="search" size={19} color="#8E95A3" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => submitSearch()}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Search countries and topics"
              placeholderTextColor="#A8AEBA"
              className="ml-3 min-w-0 flex-1 text-base font-semibold tracking-normal text-diplomatic-ink"
            />
            {query.length > 0 ? (
              <Pressable
                onPress={() => {
                  setQuery("");
                  setDebouncedQuery("");
                }}
                hitSlop={10}
              >
                <Ionicons name="close-circle" size={20} color="#8E95A3" />
              </Pressable>
            ) : null}
          </View>

          {!shouldSearch ? (
            <>
              <SectionTitle title="Recent Searches" className="mt-14" />
              <View className="mt-6 gap-7">
                {recentSearches.map((recentSearch) => (
                  <QueryShortcut
                    key={recentSearch}
                    icon="time-outline"
                    label={recentSearch}
                    onPress={() => submitSearch(recentSearch)}
                  />
                ))}
              </View>

              <SectionTitle title="Trending Queries" className="mt-14" />
              <View className="mt-5 flex-row flex-wrap gap-3">
                {trendingQueries.map((trendingQuery) => (
                  <Pressable
                    key={trendingQuery}
                    onPress={() => submitSearch(trendingQuery)}
                    className="min-h-11 min-w-[145px] items-center justify-center rounded-interactive bg-diplomatic-surfaceHigh px-4"
                  >
                    <Text className="text-sm font-extrabold tracking-normal text-diplomatic-primary">
                      {trendingQuery}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <View className="mt-9">
              <View className="flex-row items-center justify-between">
                <SectionTitle title="Results" />
                {isSearching ? <ActivityIndicator color="#0058BC" /> : null}
              </View>

              {error ? (
                <View className="mt-5 rounded-interactive bg-[#FFEDEA] px-4 py-3">
                  <Text className="text-sm font-semibold tracking-normal text-[#BA1A1A]">
                    {error}
                  </Text>
                </View>
              ) : null}

              {!isSearching && !error && results.length === 0 ? (
                <View className="mt-10 items-center rounded-atelier bg-white px-6 py-8">
                  <Ionicons name="search" size={30} color="#8E95A3" />
                  <Text className="mt-4 text-center text-lg font-extrabold tracking-normal text-diplomatic-ink">
                    No guides found
                  </Text>
                  <Text className="mt-2 text-center text-sm font-semibold leading-5 tracking-normal text-diplomatic-secondaryText">
                    Try a country name, visa type, document, or permit topic.
                  </Text>
                </View>
              ) : null}

              <View className="mt-5 gap-4">
                {results.map((result) => (
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    onPress={() => openResult(result)}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({
  title,
  className = "",
}: {
  title: string;
  className?: string;
}) {
  return (
    <Text
      className={`${className} text-lg font-extrabold tracking-normal text-diplomatic-ink`}
    >
      {title}
    </Text>
  );
}

function QueryShortcut({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center" hitSlop={10}>
      <Ionicons name={icon} size={18} color="#8E95A3" />
      <Text className="ml-3 text-base font-bold tracking-normal text-diplomatic-secondaryText">
        {label}
      </Text>
    </Pressable>
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
    <Pressable
      onPress={onPress}
      className="rounded-atelier bg-white px-5 py-5"
      accessibilityRole="button"
    >
      <View className="flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            {result.flagEmoji ? (
              <Text className="text-xl tracking-normal">
                {result.flagEmoji}
              </Text>
            ) : (
              <Ionicons name="flag-outline" size={18} color="#8E95A3" />
            )}
            <Text className="text-xs font-extrabold uppercase tracking-normal text-diplomatic-primary">
              {result.countryName}
            </Text>
            <Text className="text-xs font-bold tracking-normal text-diplomatic-secondaryText">
              {result.categoryName}
            </Text>
          </View>

          <Text className="mt-3 text-lg font-extrabold tracking-normal text-diplomatic-ink">
            {result.title}
          </Text>
          {result.shortDescription ? (
            <Text className="mt-2 text-sm font-semibold leading-5 tracking-normal text-diplomatic-secondaryText">
              {result.shortDescription}
            </Text>
          ) : null}
        </View>

        <View className="mt-1 h-10 w-10 items-center justify-center rounded-full bg-diplomatic-surfaceHigh">
          <Ionicons name="arrow-forward" size={19} color="#0058BC" />
        </View>
      </View>

      {result.isPremium ? (
        <View className="mt-4 self-start rounded-full bg-[#0A0F1A] px-3 py-1">
          <Text className="text-xs font-extrabold uppercase tracking-normal text-white">
            Premium
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
