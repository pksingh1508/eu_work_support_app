import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@clerk/expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomLoading } from "@/components/custom-loading";
import { BottomTabInset } from "@/constants/theme";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import {
  useIsCountrySaved,
  useSavedStore,
} from "@/features/saved/saved-store";
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
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#FAFAFB]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-7">
          <Header
            title={country?.name ?? "Country"}
            onBack={() => router.back()}
            rightAction={
              <Pressable
                onPress={toggleSavedCountry}
                disabled={!country || isSavingCountry}
                className={`h-11 w-11 items-center justify-center rounded-full border border-[#E6E6EA] active:opacity-70 disabled:opacity-60 ${
                  isCountrySavedState ? "bg-[#DFF3E6]" : "bg-white"
                }`}
                accessibilityRole="button"
                accessibilityLabel={
                  isCountrySavedState
                    ? `Unsave ${country?.name ?? "country"}`
                    : `Save ${country?.name ?? "country"}`
                }
              >
                <Ionicons
                  name={isCountrySavedState ? "bookmark" : "bookmark-outline"}
                  size={21}
                  color={isCountrySavedState ? "#183B2B" : "#202124"}
                />
              </Pressable>
            }
          />

          {isLoading ? (
            <View className="mt-16 items-center justify-center rounded-[30px] border border-[#EDEDF0] bg-white px-6 py-12">
              <CustomLoading />
              <Text className="mt-4 text-base font-bold tracking-normal text-[#707684]">
                Loading country guide...
              </Text>
            </View>
          ) : null}

          {!isLoading && error ? (
            <View className="mt-8 rounded-[30px] border border-[#EDEDF0] bg-white px-6 py-8">
              <Ionicons name="alert-circle-outline" size={30} color="#BA1A1A" />
              <Text className="mt-4 text-xl font-extrabold tracking-normal text-[#202124]">
                {error}
              </Text>
              <Pressable
                onPress={() => router.back()}
                className="mt-6 h-12 items-center justify-center rounded-[22px] bg-diplomatic-primary"
              >
                <Text className="text-base font-extrabold tracking-normal text-white">
                  Go back
                </Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoading && country ? (
            <>
              <View className="mt-8 min-h-[190px] rounded-[30px] bg-[#111827] p-5">
                <View className="flex-row items-start justify-between">
                  <View className="h-16 w-16 items-center justify-center">
                    {country.flagEmoji ? (
                      <Text className="text-[48px] tracking-normal">
                        {country.flagEmoji}
                      </Text>
                    ) : (
                      <Ionicons name="flag-outline" size={44} color="#FFFFFF" />
                    )}
                  </View>
                  <View className="flex-row items-center rounded-[16px] bg-diplomatic-primary px-3 py-2">
                    <Ionicons
                      name="radio-button-on-outline"
                      size={13}
                      color="#FFFFFF"
                    />
                    <Text className="ml-2 text-xs font-extrabold tracking-normal text-white">
                      Popular
                    </Text>
                  </View>
                </View>

                <Text className="mt-4 text-[34px] font-extrabold leading-10 tracking-normal text-white">
                  {country.name}
                </Text>
                <Text className="mt-1 text-base font-semibold leading-6 tracking-normal text-white opacity-80">
                  {heroSubtitle}
                </Text>

                <View className="mt-4 flex-row gap-3">
                  <View className="flex-1 rounded-[20px] bg-white/10 px-4 py-4">
                    <Text className="text-lg font-extrabold tracking-normal text-white">
                      4-12 weeks
                    </Text>
                    <Text className="mt-1 text-sm font-semibold tracking-normal text-white opacity-70">
                      typical process
                    </Text>
                  </View>
                  <View className="flex-1 rounded-[20px] bg-white/10 px-4 py-4">
                    <Text className="text-lg font-extrabold tracking-normal text-white">
                      {country.documents.length} docs
                    </Text>
                    <Text className="mt-1 text-sm font-semibold tracking-normal text-white opacity-70">
                      checklist items
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mt-5 rounded-[30px] border border-[#EDEDF0] bg-white px-5 py-5">
                <View className="flex-row items-start justify-between">
                  <View className="min-w-0 flex-1 flex-row items-start">
                    <Ionicons
                      name="information-circle-outline"
                      size={20}
                      color="#1E7AF2"
                    />
                    <View className="ml-3 min-w-0 flex-1">
                      <Text className="text-base font-extrabold tracking-normal text-[#202124]">
                        Immigration overview
                      </Text>
                      <Text className="mt-2 text-sm font-semibold leading-6 tracking-normal text-[#707684]">
                        {overviewText}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-up" size={18} color="#7C8497" />
                </View>
              </View>

              <View className="mt-6 rounded-[30px] border border-[#EDEDF0] bg-white px-5 py-5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xl font-extrabold tracking-normal text-[#202124]">
                    Document Lists
                  </Text>
                  <Text className="text-sm font-extrabold tracking-normal text-diplomatic-primary">
                    {country.documents.length} items
                  </Text>
                </View>

                <View className="mt-5 gap-3">
                  {country.documents.map((document, index) => (
                    <DocumentRow
                      key={document.id}
                      document={document}
                      index={index}
                      onPress={() => setSelectedDocument(document)}
                    />
                  ))}
                </View>
              </View>

              <SourceAndReviewDetails
                officialUrl={officialUrl}
                officialImmigrationUrl={officialImmigrationUrl}
                lastReviewedDate={lastReviewedDate}
              />
            </>
          ) : null}
        </View>
      </ScrollView>

      <DocumentModal
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
      />
    </SafeAreaView>
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
      <Text className="text-xs font-extrabold uppercase tracking-[0.8px] text-[#6B7280]">
        Source information
      </Text>

      {lastReviewedDate ? (
        <View className="mt-4 flex-row items-center">
          <Ionicons name="checkmark-circle-outline" size={18} color="#6B7280" />
          <Text className="ml-2 text-sm font-semibold tracking-normal text-[#626876]">
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
        <Text className="text-sm font-extrabold tracking-normal text-[#4B5563] underline">
          {title}
        </Text>
        <Text
          numberOfLines={1}
          className="mt-1 text-xs font-semibold tracking-normal text-[#737985]"
        >
          {url}
        </Text>
      </View>
      <Ionicons name="open-outline" size={17} color="#4B5563" />
    </Pressable>
  );
}

function Header({
  title,
  onBack,
  rightAction,
}: {
  title: string;
  onBack: () => void;
  rightAction?: ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Pressable
        onPress={onBack}
        className="h-11 w-11 items-center justify-center rounded-full border border-[#E6E6EA] bg-white"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={21} color="#202124" />
      </Pressable>
      <Text
        className="mx-3 min-w-0 flex-1 text-center text-[28px] font-extrabold tracking-normal text-[#202124]"
        numberOfLines={1}
      >
        {title}
      </Text>
      {rightAction ?? <View className="h-11 w-11" />}
    </View>
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
    <Pressable
      onPress={onPress}
      className="rounded-[24px] border border-[#E2E2E6] bg-[#FAFAFB] px-4 py-4 active:opacity-80"
      accessibilityRole="button"
    >
      <View className="flex-row items-start">
        <View className="h-11 w-11 items-center justify-center rounded-[16px] bg-[#EEF7FF]">
          <Ionicons
            name={
              index === 0
                ? "information-circle-outline"
                : getCategoryIcon(document.categoryIcon)
            }
            size={23}
            color="#1E7AF2"
          />
        </View>
        <View className="ml-3 min-w-0 flex-1">
          <Text className="text-base font-extrabold leading-6 tracking-normal text-[#202124]">
            {document.title}
          </Text>
          <Text className="mt-2 text-sm font-semibold leading-5 tracking-normal text-[#707684]">
            {document.shortDescription ?? document.intro ?? "Complete guide"}
          </Text>
        </View>
      </View>
      <View className="mt-4 flex-row items-center justify-between">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <View className="flex-row items-center rounded-full bg-white px-3 py-2">
            <Ionicons
              name={getCategoryIcon(document.categoryIcon)}
              size={15}
              color="#1E7AF2"
            />
            <Text
              numberOfLines={1}
              className="ml-2 max-w-[170px] text-xs font-extrabold tracking-normal text-diplomatic-primary"
            >
              {document.categoryName}
            </Text>
          </View>
          {document.isPremium ? (
            <View className="flex-row items-center rounded-full bg-[#EEF7FF] px-3 py-2">
              <Ionicons name="sparkles-outline" size={14} color="#1E7AF2" />
              <Text className="ml-1 text-xs font-extrabold tracking-normal text-diplomatic-primary">
                Pro
              </Text>
            </View>
          ) : null}
        </View>
        <Ionicons name="chevron-down" size={21} color="#7C8497" />
      </View>
    </Pressable>
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
            <View className="border-b border-[#E0E5EF] bg-white px-5 py-4">
              <View className="flex-row items-start justify-between gap-4">
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-extrabold uppercase tracking-normal text-diplomatic-primary">
                    {document.categoryName}
                  </Text>
                  <Text className="mt-1 text-2xl font-serif font-extrabold tracking-normal text-diplomatic-ink">
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
                  <Text className="text-lg font-semibold leading-7 tracking-normal text-diplomatic-secondaryText">
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
        <Text className="text-lg font-extrabold tracking-normal text-diplomatic-ink">
          {title}
        </Text>
      ) : null}
      {content ? (
        <Text className="mt-2 text-base font-semibold leading-6 tracking-normal text-diplomatic-secondaryText">
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
                <Text className="w-7 text-base font-extrabold tracking-normal text-diplomatic-primary">
                  {isNumbered ? `${index + 1}.` : "•"}
                </Text>
              )}
              <Text className="ml-2 min-w-0 flex-1 text-base font-semibold leading-6 tracking-normal text-diplomatic-secondaryText">
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
        <Text className="text-lg font-extrabold tracking-normal text-diplomatic-ink">
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
                  className="px-3 py-3 text-left text-sm font-extrabold uppercase tracking-normal text-diplomatic-ink"
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
                  className="px-3 py-4 text-left text-sm font-semibold leading-6 tracking-normal text-diplomatic-secondaryText"
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
        <Text className="text-lg font-extrabold tracking-normal text-diplomatic-ink">
          {section.title}
        </Text>
      ) : null}

      <View className="mt-3 gap-3">
        {items.map((item, index) => {
          const faq = item as { question?: unknown; answer?: unknown };

          return (
            <View key={`${stringifyValue(faq.question)}-${index}`}>
              <Text className="text-base font-extrabold leading-6 tracking-normal text-diplomatic-ink">
                {stringifyValue(faq.question)}
              </Text>
              <Text className="mt-1 text-base font-semibold leading-6 tracking-normal text-diplomatic-secondaryText">
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
        <Text className="text-lg font-extrabold tracking-normal text-diplomatic-ink">
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
              <Text className="ml-2 min-w-0 flex-1 text-base font-extrabold tracking-normal text-diplomatic-primary">
                {stringifyValue(source.label) || url}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
