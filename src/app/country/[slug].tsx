import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@clerk/expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { CollapsingTopBar } from "@/components/country/collapsing-top-bar";
import {
  COUNTRY_HERO_HEIGHT,
  CountryHero,
} from "@/components/country/country-hero";
import { CustomLoading } from "@/components/custom-loading";
import { FadeInView } from "@/components/ui/fade-in-view";
import { FocusStatusBar } from "@/components/ui/focus-status-bar";
import { PressableScale } from "@/components/ui/pressable-scale";
import { BottomTabInset, Elevation, Palette } from "@/constants/theme";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import {
  useIsCountrySaved,
  useSavedStore,
} from "@/features/saved/saved-store";
import { FontFamily } from "@/lib/fonts";
import { supabase } from "@/lib/supabase";
import { showErrorToast, showSavedToast, showUnsavedToast } from "@/lib/toast";

const countrySelect = `
  id,
  slug,
  name,
  flag_emoji,
  short_description,
  popularity_rank,
  official_url,
  official_immigration_url,
  last_reviewed_at,
  country_documents (
    id,
    title,
    slug,
    short_description,
    intro,
    content_json,
    is_premium,
    tags,
    sort_order,
    language,
    status,
    document_categories (
      id,
      name,
      slug,
      icon,
      sort_order
    )
  )
`;

type DocumentCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number | null;
};

type RawCountryDocument = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  intro: string | null;
  content_json: unknown;
  is_premium: boolean;
  tags: string[] | null;
  sort_order: number | null;
  language: string;
  status: string;
  document_categories: DocumentCategory | DocumentCategory[] | null;
};

type CountryResponse = {
  id: string;
  slug: string;
  name: string;
  flag_emoji: string | null;
  short_description: string | null;
  popularity_rank: number | null;
  official_url: string | null;
  official_immigration_url: string | null;
  last_reviewed_at: string | null;
  country_documents: RawCountryDocument[] | null;
};

type CountryDocument = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  intro: string | null;
  contentJson: ContentJson;
  isPremium: boolean;
  sortOrder: number;
  categoryName: string;
  categorySlug: string;
  categoryIcon: string | null;
  categorySortOrder: number;
};

type ContentJson = {
  sections?: ContentSection[];
};

type ContentSection = {
  type?: string;
  title?: string;
  content?: string;
  items?: unknown[];
  columns?: string[];
  rows?: unknown[][];
};

type CountryState = {
  id: string;
  slug: string;
  name: string;
  flagEmoji: string | null;
  shortDescription: string | null;
  popularityRank: number | null;
  officialUrl: string | null;
  officialImmigrationUrl: string | null;
  lastReviewedAt: string | null;
  documents: CountryDocument[];
};

function firstRelation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeContentJson(value: unknown): ContentJson {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { sections: [] };
  }

  const maybeContent = value as ContentJson;
  return Array.isArray(maybeContent.sections) ? maybeContent : { sections: [] };
}

function mapCountryResponse(row: CountryResponse): CountryState {
  const documents = (row.country_documents ?? [])
    .filter(
      (document) =>
        document.status === "published" && document.language === "en",
    )
    .map((document) => {
      const category = firstRelation(document.document_categories);

      return {
        id: document.id,
        title: document.title,
        slug: document.slug,
        shortDescription: document.short_description,
        intro: document.intro,
        contentJson: normalizeContentJson(document.content_json),
        isPremium: document.is_premium,
        sortOrder: document.sort_order ?? 100,
        categoryName: category?.name ?? "Guide",
        categorySlug: category?.slug ?? "guide",
        categoryIcon: category?.icon ?? null,
        categorySortOrder: category?.sort_order ?? 100,
      };
    })
    .sort((left, right) => {
      const categorySort = left.categorySortOrder - right.categorySortOrder;

      if (categorySort !== 0) {
        return categorySort;
      }

      const documentSort = left.sortOrder - right.sortOrder;

      if (documentSort !== 0) {
        return documentSort;
      }

      return left.title.localeCompare(right.title);
    });

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    flagEmoji: row.flag_emoji,
    shortDescription: row.short_description,
    popularityRank: row.popularity_rank,
    officialUrl: row.official_url,
    officialImmigrationUrl: row.official_immigration_url,
    lastReviewedAt: row.last_reviewed_at,
    documents,
  };
}

function getCategoryIcon(icon: string | null): keyof typeof Ionicons.glyphMap {
  switch (icon) {
    case "briefcase":
    case "building-2":
      return "briefcase-outline";
    case "graduation-cap":
      return "school-outline";
    case "passport":
    case "id-card":
    case "file-text":
      return "document-text-outline";
    case "shield-check":
      return "shield-checkmark-outline";
    case "car":
      return "car-outline";
    case "heart-pulse":
      return "heart-outline";
    case "book-open":
      return "book-outline";
    case "languages":
      return "language-outline";
    default:
      return "document-text-outline";
  }
}

function stringifyValue(value: unknown) {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return "";
}

function normalizeExternalUrl(value: string | null) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return null;
  }

  const normalizedValue = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    const parsedUrl = new URL(normalizedValue);

    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
      ? parsedUrl.toString()
      : null;
  } catch {
    return null;
  }
}

function formatLastReviewedAt(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

async function fetchCountry(slug: string) {
  const { data, error } = await supabase
    .from("countries")
    .select(countrySelect)
    .eq("slug", slug)
    .eq("is_active", true)
    .eq("country_documents.status", "published")
    .eq("country_documents.language", "en")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapCountryResponse(data as CountryResponse) : null;
}

export default function CountryDetailScreen() {
  return (
    <PremiumGuard>
      <CountryDetailContent />
    </PremiumGuard>
  );
}

const COLLAPSE_AT = COUNTRY_HERO_HEIGHT - 120;

function CountryDetailContent() {
  const router = useRouter();
  const { userId } = useAuth();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const countrySlug = Array.isArray(slug) ? slug[0] : slug;
  const [country, setCountry] = useState<CountryState | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<CountryDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isCountrySavedState = useIsCountrySaved(country?.id);
  const pendingCountryMutation = useSavedStore((state) =>
    country?.id ? state.pendingMutations[`country:${country.id}`] : undefined,
  );
  const hydrateSavedForUser = useSavedStore((state) => state.hydrateForUser);
  const saveCountryOptimistic = useSavedStore(
    (state) => state.saveCountryOptimistic,
  );
  const unsaveCountryOptimistic = useSavedStore(
    (state) => state.unsaveCountryOptimistic,
  );
  const isSavingCountry = Boolean(pendingCountryMutation);
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [isBarSolid, setIsBarSolid] = useState(false);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  useAnimatedReaction(
    () => scrollY.value > COLLAPSE_AT - 40,
    (solid, previous) => {
      if (solid !== previous) {
        scheduleOnRN(setIsBarSolid, solid);
      }
    },
  );

  useEffect(() => {
    let isMounted = true;

    if (!countrySlug) {
      setIsLoading(false);
      setError("Country not found.");
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchCountry(countrySlug)
      .then((nextCountry) => {
        if (!isMounted) {
          return;
        }

        setCountry(nextCountry);
        setError(nextCountry ? null : "Country not found.");
      })
      .catch((fetchError) => {
        if (!isMounted) {
          return;
        }

        console.warn("Unable to fetch country details", fetchError);
        setCountry(null);
        setError("Unable to load this country right now.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [countrySlug]);

  useEffect(() => {
    if (userId) {
      void hydrateSavedForUser(userId);
    }
  }, [hydrateSavedForUser, userId]);

  const overviewText =
    country?.shortDescription ??
    `${country?.name ?? "This country"} visa, immigration, work, study, and document guidance.`;

  const heroSubtitle = useMemo(() => {
    const firstThreeCategories = Array.from(
      new Set(
        country?.documents.map((document) =>
          document.categoryName.toLowerCase(),
        ) ?? [],
      ),
    ).slice(0, 3);

    return firstThreeCategories.length > 0
      ? firstThreeCategories.join(", ")
      : "visa, permits, documents";
  }, [country]);

  const officialUrl = normalizeExternalUrl(country?.officialUrl ?? null);
  const officialImmigrationUrl = normalizeExternalUrl(
    country?.officialImmigrationUrl ?? null,
  );
  const lastReviewedDate = formatLastReviewedAt(
    country?.lastReviewedAt ?? null,
  );

  const toggleSavedCountry = async () => {
    if (!country) {
      return;
    }

    if (!userId) {
      Alert.alert("Login required", "Please login to save countries.");
      return;
    }

    const nextIsSaved = !isCountrySavedState;

    if (nextIsSaved) {
      void saveCountryOptimistic({
        clerkUserId: userId,
        countryId: country.id,
        country: {
          id: `country:${country.id}`,
          countryId: country.id,
          slug: country.slug,
          name: country.name,
          flagEmoji: country.flagEmoji,
          shortDescription: country.shortDescription,
          createdAt: new Date().toISOString(),
        },
      }).catch((error) => {
        console.warn("Unable to update saved country", error);
        showErrorToast(
          "Could not save country",
          "Please try again in a moment.",
        );
      });
      showSavedToast(country.name, "country");
      return;
    }

    void unsaveCountryOptimistic({
      clerkUserId: userId,
      countryId: country.id,
    }).catch((error) => {
      console.warn("Unable to update saved country", error);
      showErrorToast(
        "Could not remove country",
        "Please try again in a moment.",
      );
    });
    showUnsavedToast(country.name, "country");
  };

  return (
    <View style={styles.screen}>
      <FocusStatusBar style={isBarSolid || !country ? "dark" : "light"} />
      <CollapsingTopBar
        title={country?.name ?? "Country"}
        topInset={insets.top}
        scrollY={scrollY}
        collapseAt={country ? COLLAPSE_AT : 0}
        onBack={() => router.back()}
        rightAction={
          <PressableScale
            onPress={toggleSavedCountry}
            disabled={!country || isSavingCountry}
            style={[
              styles.saveButton,
              isCountrySavedState && styles.saveButtonActive,
              (!country || isSavingCountry) && styles.disabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isCountrySavedState
                ? `Unsave ${country?.name ?? "country"}`
                : `Save ${country?.name ?? "country"}`
            }
          >
            <Ionicons
              name={isCountrySavedState ? "bookmark" : "bookmark-outline"}
              size={19}
              color={isCountrySavedState ? "#FFFFFF" : Palette.ink}
            />
          </PressableScale>
        }
      />

      <Animated.ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {isLoading ? (
          <View style={[styles.stateCard, Elevation.card, { marginTop: insets.top + 90 }]}>
            <CustomLoading />
            <Text style={styles.stateText}>Loading country guide…</Text>
          </View>
        ) : null}

        {!isLoading && error ? (
          <FadeInView style={[styles.stateCard, Elevation.card, { marginTop: insets.top + 90 }]}>
            <View style={styles.stateIcon}>
              <Ionicons name="alert-circle" size={26} color={Palette.danger} />
            </View>
            <Text style={styles.stateTitle}>{error}</Text>
            <PressableScale
              onPress={() => router.back()}
              style={styles.primaryButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.primaryButtonText}>Go back</Text>
            </PressableScale>
          </FadeInView>
        ) : null}

        {!isLoading && country ? (
          <>
            <CountryHero
              name={country.name}
              subtitle={heroSubtitle}
              flagEmoji={country.flagEmoji}
              documentCount={country.documents.length}
              topInset={insets.top}
              scrollY={scrollY}
            />

            <View style={styles.body}>
              <FadeInView index={1}>
                <View style={[styles.overview, Elevation.card]}>
                  <View style={styles.overviewIcon}>
                    <Ionicons name="compass-outline" size={20} color={Palette.primary} />
                  </View>
                  <View style={styles.overviewText}>
                    <Text style={styles.overviewTitle}>Immigration overview</Text>
                    <Text style={styles.overviewBody}>{overviewText}</Text>
                  </View>
                </View>
              </FadeInView>

              <FadeInView index={2} style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Guides & documents</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>{country.documents.length}</Text>
                </View>
              </FadeInView>

              <View style={styles.documents}>
                {country.documents.map((document, index) => (
                  <FadeInView key={document.id} index={index + 3}>
                    <DocumentRow
                      document={document}
                      index={index}
                      onPress={() => setSelectedDocument(document)}
                    />
                  </FadeInView>
                ))}
              </View>

              <SourceAndReviewDetails
                officialUrl={officialUrl}
                officialImmigrationUrl={officialImmigrationUrl}
                lastReviewedDate={lastReviewedDate}
              />
            </View>
          </>
        ) : null}
      </Animated.ScrollView>

      <DocumentModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </View>
  );
}

function SourceAndReviewDetails({
  officialUrl,
  officialImmigrationUrl,
  lastReviewedDate,
}: {
  officialUrl: string | null;
  officialImmigrationUrl: string | null;
  lastReviewedDate: string | null;
}) {
  if (!officialUrl && !officialImmigrationUrl && !lastReviewedDate) {
    return null;
  }

  return (
    <View className="mt-4 rounded-[24px] border border-[#E3E4E8] bg-[#F3F4F6] px-5 py-5">
      <Text className="text-xs font-inter-bold uppercase tracking-[0.8px] text-[#6B7280]">
        Source information
      </Text>

      {lastReviewedDate ? (
        <View className="mt-4 flex-row items-center">
          <Ionicons name="checkmark-circle-outline" size={18} color="#6B7280" />
          <Text className="ml-2 text-sm font-inter-medium tracking-normal text-[#626876]">
            Last reviewed: {lastReviewedDate}
          </Text>
        </View>
      ) : null}

      {officialUrl ? (
        <OfficialSourceLink title="Official website" url={officialUrl} />
      ) : null}

      {officialImmigrationUrl ? (
        <OfficialSourceLink
          title="Official immigration website"
          url={officialImmigrationUrl}
        />
      ) : null}
    </View>
  );
}

function OfficialSourceLink({ title, url }: { title: string; url: string }) {
  const openWebsite = () => {
    void Linking.openURL(url).catch(() => {
      Alert.alert(
        "Unable to open website",
        `Please try opening the ${title.toLowerCase()} again.`,
      );
    });
  };

  return (
    <Pressable
      onPress={openWebsite}
      className="mt-3 min-h-11 flex-row items-center rounded-[16px] bg-[#E8E9EC] px-4 py-3 active:opacity-70"
      accessibilityRole="link"
      accessibilityLabel={`Open ${title.toLowerCase()}`}
      accessibilityHint="Opens the website in your browser"
    >
      <Ionicons name="globe-outline" size={19} color="#4B5563" />
      <View className="ml-3 min-w-0 flex-1">
        <Text className="text-sm font-inter-bold tracking-normal text-[#4B5563] underline">
          {title}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-1 text-xs font-inter-medium tracking-normal text-[#737985]"
        >
          {url}
        </Text>
      </View>
      <Ionicons name="open-outline" size={17} color="#4B5563" />
    </Pressable>
  );
}

function DocumentRow({
  document,
  index,
  onPress,
}: {
  document: CountryDocument;
  index: number;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.docCard, Elevation.card]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${document.title}`}
    >
      <View style={styles.docIcon}>
        <Ionicons
          name={
            index === 0
              ? "information-circle-outline"
              : getCategoryIcon(document.categoryIcon)
          }
          size={22}
          color={Palette.primary}
        />
      </View>
      <View style={styles.docBody}>
        <View style={styles.docMeta}>
          <Text style={styles.docCategory} numberOfLines={1}>
            {document.categoryName}
          </Text>
          {document.isPremium ? (
            <View style={styles.proBadge}>
              <Ionicons name="sparkles" size={10} color="#FFFFFF" />
              <Text style={styles.proText}>PRO</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.docTitle}>{document.title}</Text>
        <Text style={styles.docDescription} numberOfLines={2}>
          {document.shortDescription ?? document.intro ?? "Complete guide"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Palette.subtle} />
    </PressableScale>
  );
}

function DocumentModal({
  document,
  onClose,
}: {
  document: CountryDocument | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={Boolean(document)}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        edges={["top", "bottom"]}
        className="flex-1 bg-diplomatic-surface"
      >
        {document ? (
          <>
            <StatusBar style="dark" />
            <View className="border-b border-[#E0E5EF] bg-white px-5 py-4">
              <View className="flex-row items-start justify-between gap-4">
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-inter-bold uppercase tracking-normal text-diplomatic-primary">
                    {document.categoryName}
                  </Text>
                  <Text className="mt-1 text-2xl font-heading tracking-normal text-diplomatic-ink">
                    {document.title}
                  </Text>
                </View>
                <Pressable
                  onPress={onClose}
                  className="h-10 w-10 items-center justify-center rounded-full bg-diplomatic-surfaceHigh"
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={22} color="#0A0F1A" />
                </Pressable>
              </View>
            </View>

            <ScrollView
              className="flex-1"
              contentContainerClassName="gap-4 px-5 py-5"
              showsVerticalScrollIndicator={false}
            >
              {document.intro ? (
                <View className="rounded-interactive bg-white px-4 py-4">
                  <Text className="text-lg font-inter-medium leading-7 tracking-normal text-diplomatic-secondaryText">
                    {document.intro}
                  </Text>
                </View>
              ) : null}

              {(document.contentJson.sections ?? []).map((section, index) => (
                <ContentSectionView
                  key={`${section.type ?? "section"}-${index}`}
                  section={section}
                />
              ))}
            </ScrollView>
          </>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

function ContentSectionView({ section }: { section: ContentSection }) {
  const title = section.title;
  const content = section.content;

  if (section.type === "table") {
    return <TableSection section={section} />;
  }

  if (section.type === "faq") {
    return <FaqSection section={section} />;
  }

  if (section.type === "source_links") {
    return <SourceLinksSection section={section} />;
  }

  const sectionTone =
    section.type === "warning"
      ? "bg-[#FFEDEA] border-[#FFD4CE]"
      : section.type === "callout" || section.type === "quick_answer"
        ? "bg-diplomatic-surfaceHigh border-[#D5DDF0]"
        : "bg-white border-[#E0E5EF]";

  const items = Array.isArray(section.items) ? section.items : [];
  const isNumbered = section.type === "numbered_steps";
  const isChecklist = section.type === "checklist";

  return (
    <View className={`rounded-interactive border px-4 py-4 ${sectionTone}`}>
      {title ? (
        <Text className="text-lg font-inter-bold tracking-normal text-diplomatic-ink">
          {title}
        </Text>
      ) : null}
      {content ? (
        <Text className="mt-2 text-base font-inter-medium leading-6 tracking-normal text-diplomatic-secondaryText">
          {content}
        </Text>
      ) : null}

      {items.length > 0 ? (
        <View className="mt-3 gap-2">
          {items.map((item, index) => (
            <View
              key={`${stringifyValue(item)}-${index}`}
              className="flex-row items-start"
            >
              {isChecklist ? (
                <Ionicons name="checkmark-circle" size={17} color="#1E7AF2" />
              ) : (
                <Text className="w-7 text-base font-inter-bold tracking-normal text-diplomatic-primary">
                  {isNumbered ? `${index + 1}.` : "•"}
                </Text>
              )}
              <Text className="ml-2 min-w-0 flex-1 text-base font-inter-medium leading-6 tracking-normal text-diplomatic-secondaryText">
                {stringifyValue(item)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function TableSection({ section }: { section: ContentSection }) {
  const columns = Array.isArray(section.columns) ? section.columns : [];
  const rows = Array.isArray(section.rows) ? section.rows : [];
  const columnCount = Math.max(
    columns.length,
    ...rows.map((row) => row?.length ?? 0),
    1,
  );
  const columnWidth = columnCount <= 2 ? 220 : 170;
  const tableWidth = columnWidth * columnCount;

  return (
    <View className="rounded-interactive border border-[#E0E5EF] bg-white px-4 py-4">
      {section.title ? (
        <Text className="text-lg font-inter-bold tracking-normal text-diplomatic-ink">
          {section.title}
        </Text>
      ) : null}

      <ScrollView
        horizontal
        className="mt-3"
        showsHorizontalScrollIndicator={false}
      >
        <View
          className="overflow-hidden rounded-interactive border border-[#E0E5EF]"
          style={{ minWidth: tableWidth }}
        >
          {columns.length > 0 ? (
            <View className="flex-row bg-diplomatic-surfaceHigh">
              {columns.map((column) => (
                <Text
                  key={column}
                  className="px-3 py-3 text-left text-sm font-inter-bold uppercase tracking-normal text-diplomatic-ink"
                  style={{ width: columnWidth, textAlign: "left" }}
                >
                  {column}
                </Text>
              ))}
            </View>
          ) : null}

          {rows.map((row, rowIndex) => (
            <View
              key={`${section.title ?? "table"}-${rowIndex}`}
              className={`flex-row ${rowIndex % 2 === 0 ? "bg-white" : "bg-[#F8FAFD]"}`}
            >
              {(Array.isArray(row) ? row : []).map((cell, cellIndex) => (
                <Text
                  key={`${rowIndex}-${cellIndex}`}
                  className="px-3 py-4 text-left text-sm font-inter-medium leading-6 tracking-normal text-diplomatic-secondaryText"
                  style={{ width: columnWidth, textAlign: "left" }}
                >
                  {stringifyValue(cell)}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function FaqSection({ section }: { section: ContentSection }) {
  const items = Array.isArray(section.items) ? section.items : [];

  return (
    <View className="rounded-interactive border border-[#E0E5EF] bg-white px-4 py-4">
      {section.title ? (
        <Text className="text-lg font-inter-bold tracking-normal text-diplomatic-ink">
          {section.title}
        </Text>
      ) : null}

      <View className="mt-3 gap-3">
        {items.map((item, index) => {
          const faq = item as { question?: unknown; answer?: unknown };

          return (
            <View key={`${stringifyValue(faq.question)}-${index}`}>
              <Text className="text-base font-inter-bold leading-6 tracking-normal text-diplomatic-ink">
                {stringifyValue(faq.question)}
              </Text>
              <Text className="mt-1 text-base font-inter-medium leading-6 tracking-normal text-diplomatic-secondaryText">
                {stringifyValue(faq.answer)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SourceLinksSection({ section }: { section: ContentSection }) {
  const items = Array.isArray(section.items) ? section.items : [];

  return (
    <View className="rounded-interactive border border-[#E0E5EF] bg-white px-4 py-4">
      {section.title ? (
        <Text className="text-lg font-inter-bold tracking-normal text-diplomatic-ink">
          {section.title}
        </Text>
      ) : null}

      <View className="mt-3 gap-2">
        {items.map((item, index) => {
          const source = item as { label?: unknown; url?: unknown };
          const url = stringifyValue(source.url);

          return (
            <Pressable
              key={`${url}-${index}`}
              onPress={() => {
                if (url) {
                  void Linking.openURL(url);
                }
              }}
              className="flex-row items-center"
            >
              <Ionicons name="link-outline" size={17} color="#1E7AF2" />
              <Text className="ml-2 min-w-0 flex-1 text-base font-inter-bold tracking-normal text-diplomatic-primary">
                {stringifyValue(source.label) || url}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.card,
  },
  saveButtonActive: {
    backgroundColor: Palette.primary,
  },
  disabled: {
    opacity: 0.6,
  },
  stateCard: {
    marginHorizontal: 20,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 26,
    backgroundColor: Palette.card,
  },
  stateIcon: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.dangerTint,
  },
  stateTitle: {
    marginTop: 16,
    textAlign: "center",
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 18,
    color: Palette.ink,
  },
  stateText: {
    marginTop: 12,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Palette.muted,
  },
  primaryButton: {
    marginTop: 20,
    height: 48,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: Palette.primary,
  },
  primaryButtonText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 15,
    color: "#FFFFFF",
  },
  body: {
    paddingHorizontal: 20,
    marginTop: -28,
  },
  overview: {
    flexDirection: "row",
    gap: 14,
    padding: 18,
    borderRadius: 24,
    backgroundColor: Palette.card,
  },
  overviewIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.tint,
  },
  overviewText: {
    flex: 1,
  },
  overviewTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 16,
    color: Palette.ink,
  },
  overviewBody: {
    marginTop: 6,
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 22,
    color: Palette.muted,
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 21,
    letterSpacing: -0.3,
    color: Palette.ink,
  },
  countPill: {
    minWidth: 28,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.tint,
  },
  countPillText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 12,
    color: Palette.primary,
  },
  documents: {
    gap: 12,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: Palette.card,
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.tint,
  },
  docBody: {
    flex: 1,
    minWidth: 0,
  },
  docMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  docCategory: {
    flexShrink: 1,
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Palette.primary,
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Palette.ink,
  },
  proText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 9,
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  docTitle: {
    marginTop: 4,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: Palette.ink,
  },
  docDescription: {
    marginTop: 3,
    fontFamily: FontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: Palette.muted,
  },
});
