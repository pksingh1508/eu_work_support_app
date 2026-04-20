import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabInset } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

const countrySelect = `
  id,
  slug,
  name,
  flag_emoji,
  short_description,
  popularity_rank,
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

function formatShortTopic(value: string | null) {
  if (!value) {
    return "Guide";
  }

  return value.length > 22 ? `${value.slice(0, 22).trim()}...` : value;
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
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const countrySlug = Array.isArray(slug) ? slug[0] : slug;
  const [country, setCountry] = useState<CountryState | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<CountryDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const shareCountry = async () => {
    if (!country) {
      return;
    }

    await Share.share({
      message: `${country.name} immigration and visa guide in EU Work Support.`,
    });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-diplomatic-surface">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-5">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="h-10 flex-row items-center rounded-interactive border border-[#E0E5EF] bg-white px-4"
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={18} color="#0A0F1A" />
              <Text className="ml-2 text-sm font-extrabold tracking-normal text-diplomatic-ink">
                {country?.name ?? "Country"}
              </Text>
            </Pressable>

            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={shareCountry}
                disabled={!country}
                className="h-10 w-10 items-center justify-center rounded-interactive border border-[#E0E5EF] bg-white"
                accessibilityRole="button"
              >
                <Ionicons
                  name="share-social-outline"
                  size={19}
                  color="#0A0F1A"
                />
              </Pressable>
              <Pressable
                className="h-10 w-10 items-center justify-center rounded-interactive bg-diplomatic-primary"
                accessibilityRole="button"
              >
                <Ionicons name="bookmark-outline" size={19} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {isLoading ? (
            <View className="mt-16 items-center justify-center rounded-atelier bg-white px-6 py-12">
              <ActivityIndicator color="#0058BC" />
              <Text className="mt-4 text-base font-bold tracking-normal text-diplomatic-secondaryText">
                Loading country guide...
              </Text>
            </View>
          ) : null}

          {!isLoading && error ? (
            <View className="mt-8 rounded-atelier bg-white px-6 py-8">
              <Ionicons name="alert-circle-outline" size={30} color="#BA1A1A" />
              <Text className="mt-4 text-xl font-extrabold tracking-normal text-diplomatic-ink">
                {error}
              </Text>
              <Pressable
                onPress={() => router.back()}
                className="mt-6 h-12 items-center justify-center rounded-interactive bg-diplomatic-primary"
              >
                <Text className="text-base font-extrabold tracking-normal text-white">
                  Go back
                </Text>
              </Pressable>
            </View>
          ) : null}

          {!isLoading && country ? (
            <>
              <View className="mt-5 min-h-[190px] rounded-interactive bg-[#111827] p-5">
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
                  <View className="flex-row items-center rounded-interactive bg-diplomatic-primary px-3 py-2">
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
                  <View className="flex-1 rounded-interactive bg-white/10 px-4 py-4">
                    <Text className="text-lg font-extrabold tracking-normal text-white">
                      4-12 weeks
                    </Text>
                    <Text className="mt-1 text-sm font-semibold tracking-normal text-white opacity-70">
                      typical process
                    </Text>
                  </View>
                  <View className="flex-1 rounded-interactive bg-white/10 px-4 py-4">
                    <Text className="text-lg font-extrabold tracking-normal text-white">
                      {country.documents.length} docs
                    </Text>
                    <Text className="mt-1 text-sm font-semibold tracking-normal text-white opacity-70">
                      checklist items
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mt-5 rounded-interactive border border-[#E0E5EF] bg-white px-4 py-4">
                <View className="flex-row items-start justify-between">
                  <View className="min-w-0 flex-1 flex-row items-start">
                    <Ionicons
                      name="information-circle-outline"
                      size={20}
                      color="#1E7AF2"
                    />
                    <View className="ml-3 min-w-0 flex-1">
                      <Text className="text-base font-extrabold tracking-normal text-diplomatic-ink">
                        Immigration overview
                      </Text>
                      <Text className="mt-2 text-sm font-semibold leading-5 tracking-normal text-diplomatic-secondaryText">
                        {overviewText}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-up" size={18} color="#7C8497" />
                </View>
              </View>

              <View className="mt-6 rounded-t-atelier bg-white px-4 py-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-lg font-extrabold tracking-normal text-diplomatic-ink">
                    Required documents
                  </Text>
                  <Text className="text-sm font-extrabold tracking-normal text-diplomatic-primary">
                    {country.documents.length} items
                  </Text>
                </View>
              </View>

              <View className="mt-3 gap-3">
                {country.documents.map((document, index) => (
                  <DocumentRow
                    key={document.id}
                    document={document}
                    index={index}
                    onPress={() => setSelectedDocument(document)}
                  />
                ))}
              </View>
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
      className="min-h-[54px] justify-center rounded-interactive border border-[#E0E5EF] bg-white px-4 py-3"
      accessibilityRole="button"
    >
      <View className="flex-row items-center">
        <Ionicons
          name={
            index === 0
              ? "information-circle-outline"
              : getCategoryIcon(document.categoryIcon)
          }
          size={20}
          color="#1E7AF2"
        />
        <Text className="ml-3 min-w-0 flex-1 text-base font-extrabold tracking-normal text-diplomatic-ink">
          {document.title}
        </Text>
        <Text className="ml-2 max-w-[118px] text-xs font-semibold tracking-normal text-diplomatic-secondaryText">
          {formatShortTopic(document.shortDescription)}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#7C8497" />
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
                  <Text className="mt-1 text-2xl font-extrabold tracking-normal text-diplomatic-ink">
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
        <View className="min-w-[390px] overflow-hidden rounded-interactive border border-[#E0E5EF]">
          {columns.length > 0 ? (
            <View className="flex-row bg-diplomatic-surfaceHigh">
              {columns.map((column) => (
                <Text
                  key={column}
                  className="min-w-[170px] flex-1 px-3 py-3 text-sm font-extrabold uppercase tracking-normal text-diplomatic-ink"
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
                  className="min-w-[170px] flex-1 px-3 py-4 text-sm font-semibold leading-6 tracking-normal text-diplomatic-secondaryText"
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
