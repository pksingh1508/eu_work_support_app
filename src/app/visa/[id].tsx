import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";

const documentSelect = `
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
  countries!inner (
    id,
    name,
    slug,
    flag_emoji,
    short_description,
    is_active
  ),
  document_categories!inner (
    id,
    name,
    slug,
    icon,
    sort_order
  )
`;

type RelatedCountry = {
  id: string;
  name: string;
  slug: string;
  flag_emoji: string | null;
  short_description: string | null;
  is_active: boolean;
};

type RelatedCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number | null;
};

type RawDocument = {
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
  countries: RelatedCountry | RelatedCountry[] | null;
  document_categories: RelatedCategory | RelatedCategory[] | null;
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

type VisaDocument = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  intro: string | null;
  contentJson: ContentJson;
  isPremium: boolean;
  tags: string[];
  countryName: string;
  countrySlug: string;
  countryFlagEmoji: string | null;
  countryDescription: string | null;
  categoryName: string;
  categorySlug: string;
  categoryIcon: string | null;
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

function mapDocument(row: RawDocument): VisaDocument | null {
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
    intro: row.intro,
    contentJson: normalizeContentJson(row.content_json),
    isPremium: row.is_premium,
    tags: row.tags ?? [],
    countryName: country.name,
    countrySlug: country.slug,
    countryFlagEmoji: country.flag_emoji,
    countryDescription: country.short_description,
    categoryName: category.name,
    categorySlug: category.slug,
    categoryIcon: category.icon,
  };
}

async function fetchVisaDocument(id: string) {
  const { data, error } = await supabase
    .from("country_documents")
    .select(documentSelect)
    .eq("id", id)
    .eq("status", "published")
    .eq("language", "en")
    .eq("countries.is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapDocument(data as RawDocument) : null;
}

export default function VisaDocumentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const documentId = Array.isArray(id) ? id[0] : id;
  const [document, setDocument] = useState<VisaDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!documentId) {
      setIsLoading(false);
      setError("Document not found.");
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchVisaDocument(documentId)
      .then((nextDocument) => {
        if (!isMounted) {
          return;
        }

        setDocument(nextDocument);
        setError(nextDocument ? null : "Document not found.");
      })
      .catch((fetchError) => {
        if (!isMounted) {
          return;
        }

        console.warn("Unable to fetch visa document", fetchError);
        setDocument(null);
        setError("Unable to load this guide right now.");
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [documentId]);

  const overviewText = useMemo(() => {
    if (!document) {
      return "";
    }

    return (
      document.shortDescription ??
      document.intro ??
      `${document.countryName} ${document.categoryName.toLowerCase()} guide.`
    );
  }, [document]);

  const shareDocument = async () => {
    if (!document) {
      return;
    }

    await Share.share({
      message: `${document.title} for ${document.countryName} in EU Work Support.`,
    });
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-diplomatic-surface">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-8 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="h-10 flex-row items-center rounded-interactive border border-[#E0E5EF] bg-white px-4"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={18} color="#0A0F1A" />
            <Text className="ml-2 text-sm font-extrabold tracking-normal text-diplomatic-ink">
              {document?.countryName ?? "Guide"}
            </Text>
          </Pressable>

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={shareDocument}
              disabled={!document}
              className="h-10 w-10 items-center justify-center rounded-interactive border border-[#E0E5EF] bg-white disabled:opacity-50"
              accessibilityRole="button"
            >
              <Ionicons name="share-social-outline" size={19} color="#0A0F1A" />
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
          <View className="mt-16 items-center justify-center rounded-atelier bg-white px-6 py-14">
            <ActivityIndicator color="#0058BC" />
            <Text className="mt-4 text-base font-bold tracking-normal text-diplomatic-secondaryText">
              Loading guide...
            </Text>
          </View>
        ) : null}

        {!isLoading && error ? (
          <View className="mt-8 rounded-atelier bg-white px-6 py-8">
            <Ionicons name="alert-circle-outline" size={32} color="#BA1A1A" />
            <Text className="mt-4 text-xl font-extrabold tracking-normal text-diplomatic-ink">
              {error}
            </Text>
            <Text className="mt-2 text-base font-semibold leading-6 tracking-normal text-diplomatic-secondaryText">
              Please go back and open the guide again.
            </Text>
            <Pressable
              onPress={() => router.back()}
              className="mt-6 h-12 items-center justify-center rounded-interactive bg-diplomatic-primary"
              accessibilityRole="button"
            >
              <Text className="text-base font-extrabold tracking-normal text-white">
                Go back
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && document ? (
          <>
            <View className="mt-5 rounded-interactive bg-[#111827] p-5">
              <View className="flex-row items-start justify-between">
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center">
                    {document.countryFlagEmoji ? (
                      <Text className="text-[38px] tracking-normal">
                        {document.countryFlagEmoji}
                      </Text>
                    ) : (
                      <Ionicons name="flag-outline" size={34} color="#FFFFFF" />
                    )}
                    <View className="ml-3 min-w-0 flex-1">
                      <Text className="text-sm font-extrabold uppercase tracking-normal text-[#9FC6FF]">
                        {document.categoryName}
                      </Text>
                      <Text className="mt-1 text-sm font-semibold tracking-normal text-white opacity-70">
                        {document.countryName}
                      </Text>
                    </View>
                  </View>

                  <Text className="mt-5 text-[32px] font-extrabold leading-10 tracking-normal text-white">
                    {document.title}
                  </Text>
                  <Text className="mt-2 text-base font-semibold leading-6 tracking-normal text-white opacity-80">
                    {overviewText}
                  </Text>
                </View>

                {document.isPremium ? (
                  <View className="ml-3 flex-row items-center rounded-interactive bg-diplomatic-primary px-3 py-2">
                    <Ionicons
                      name="sparkles-outline"
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text className="ml-2 text-xs font-extrabold tracking-normal text-white">
                      Pro
                    </Text>
                  </View>
                ) : null}
              </View>

              <View className="mt-5 flex-row gap-3">
                <InfoChip
                  icon={getCategoryIcon(document.categoryIcon)}
                  label={document.categoryName}
                />
                <InfoChip
                  icon="document-text-outline"
                  label={`${document.contentJson.sections?.length ?? 0} sections`}
                />
              </View>
            </View>

            {document.intro ? (
              <View className="mt-5 rounded-interactive border border-[#E0E5EF] bg-white px-4 py-4">
                <Text className="text-lg font-semibold leading-7 tracking-normal text-diplomatic-secondaryText">
                  {document.intro}
                </Text>
              </View>
            ) : null}

            <View className="mt-5 gap-4">
              {(document.contentJson.sections ?? []).map((section, index) => (
                <ContentSectionView
                  key={`${section.type ?? "section"}-${index}`}
                  section={section}
                />
              ))}
            </View>

            <Pressable
              onPress={() => router.push(`/country/${document.countrySlug}`)}
              className="mt-6 flex-row items-center justify-center rounded-interactive border border-[#CFE0F7] bg-diplomatic-surfaceHigh px-4 py-4"
              accessibilityRole="button"
            >
              <Ionicons name="flag-outline" size={18} color="#1E7AF2" />
              <Text className="ml-2 text-base font-extrabold tracking-normal text-diplomatic-primary">
                View all {document.countryName} guides
              </Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoChip({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View className="min-w-0 flex-1 flex-row items-center rounded-interactive bg-white/10 px-3 py-3">
      <Ionicons name={icon} size={17} color="#FFFFFF" />
      <Text
        numberOfLines={1}
        className="ml-2 min-w-0 flex-1 text-sm font-extrabold tracking-normal text-white"
      >
        {label}
      </Text>
    </View>
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
      : section.type === "hero"
        ? "bg-[#111827] border-[#111827]"
        : section.type === "callout" || section.type === "quick_answer"
          ? "bg-diplomatic-surfaceHigh border-[#D5DDF0]"
          : "bg-white border-[#E0E5EF]";
  const titleColor =
    section.type === "hero" ? "text-white" : "text-diplomatic-ink";
  const bodyColor =
    section.type === "hero"
      ? "text-[#E8F1FF]"
      : "text-diplomatic-secondaryText";
  const items = Array.isArray(section.items) ? section.items : [];
  const isNumbered = section.type === "numbered_steps";
  const isChecklist = section.type === "checklist";

  return (
    <View className={`rounded-interactive border px-4 py-4 ${sectionTone}`}>
      {title ? (
        <Text
          className={`text-xl font-extrabold tracking-normal ${titleColor}`}
        >
          {title}
        </Text>
      ) : null}
      {content ? (
        <Text
          className={`mt-2 text-base font-semibold leading-7 tracking-normal ${bodyColor}`}
        >
          {content}
        </Text>
      ) : null}

      {items.length > 0 ? (
        <View className="mt-3 gap-3">
          {items.map((item, index) => (
            <View
              key={`${stringifyValue(item)}-${index}`}
              className="flex-row items-start"
            >
              {isChecklist ? (
                <Ionicons name="checkmark-circle" size={18} color="#1E7AF2" />
              ) : (
                <Text className="w-7 text-base font-extrabold tracking-normal text-diplomatic-primary">
                  {isNumbered ? `${index + 1}.` : "•"}
                </Text>
              )}
              <Text
                className={`ml-2 min-w-0 flex-1 text-base font-semibold leading-7 tracking-normal ${bodyColor}`}
              >
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
        <Text className="text-xl font-extrabold tracking-normal text-diplomatic-ink">
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
                  className="px-3 py-4 text-left text-base font-semibold leading-7 tracking-normal text-diplomatic-secondaryText"
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
        <Text className="text-xl font-extrabold tracking-normal text-diplomatic-ink">
          {section.title}
        </Text>
      ) : null}

      <View className="mt-3 gap-4">
        {items.map((item, index) => {
          const faq = item as { question?: unknown; answer?: unknown };

          return (
            <View key={`${stringifyValue(faq.question)}-${index}`}>
              <Text className="text-base font-extrabold leading-6 tracking-normal text-diplomatic-ink">
                {stringifyValue(faq.question)}
              </Text>
              <Text className="mt-1 text-base font-semibold leading-7 tracking-normal text-diplomatic-secondaryText">
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
        <Text className="text-xl font-extrabold tracking-normal text-diplomatic-ink">
          {section.title}
        </Text>
      ) : null}

      <View className="mt-3 gap-3">
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
              accessibilityRole="link"
            >
              <Ionicons name="link-outline" size={18} color="#1E7AF2" />
              <Text className="ml-2 min-w-0 flex-1 text-base font-extrabold leading-6 tracking-normal text-diplomatic-primary">
                {stringifyValue(source.label) || url}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
