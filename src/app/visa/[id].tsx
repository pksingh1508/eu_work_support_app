import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@clerk/expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedRef } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ArticleStyleProvider, READER_SCALES } from "@/components/document/article-theme";
import { DocumentArticle } from "@/components/document/document-sections";
import { GuideDetailSkeleton } from "@/components/skeletons";
import { ProBadge } from "@/components/ui/badge";
import { FadeInView } from "@/components/ui/fade-in-view";
import { FlagImage } from "@/components/ui/flag-image";
import { GradientFill } from "@/components/ui/gradient-fill";
import { PressableScale } from "@/components/ui/pressable-scale";
import { AppSheet } from "@/components/ui/sheet";
import { BAR_HEIGHT, StackScreen } from "@/components/ui/stack-screen";
import { StarRing } from "@/components/ui/star-ring";
import { StateView } from "@/components/ui/state-view";
import { Elevation, NavyGradient, Palette, Radii, Type } from "@/constants/theme";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { buildArticle, countArticleWords, getTableOfContents } from "@/features/documents/article";
import { getCategoryIcon } from "@/features/documents/content";
import { fetchVisaDocument, type VisaDocument } from "@/features/documents/guide-api";
import { useIsDocumentSaved, useSavedStore } from "@/features/saved/saved-store";
import { FontFamily } from "@/lib/fonts";
import { haptics } from "@/lib/haptics";
import { getReaderScale, setReaderScale } from "@/lib/local-storage";
import { showErrorToast, showSavedToast, showUnsavedToast } from "@/lib/toast";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_FOUND = "Guide not found.";
const INLINE_TOC_LIMIT = 5;

export default function VisaDocumentScreen() {
  return (
    <PremiumGuard>
      <VisaDocumentContent />
    </PremiumGuard>
  );
}

function VisaDocumentContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const documentId = Array.isArray(id) ? id[0] : id;
  const [document, setDocument] = useState<VisaDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [isContentsOpen, setIsContentsOpen] = useState(false);
  const [readerScale, setReaderScaleState] = useState(getReaderScale);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const articleOffset = useRef(0);
  const sectionOffsets = useRef<Record<string, number>>({});
  const isSaved = useIsDocumentSaved(document?.id);
  const pendingMutation = useSavedStore((state) =>
    document?.id ? state.pendingMutations[`document:${document.id}`] : undefined,
  );
  const hydrateSavedForUser = useSavedStore((state) => state.hydrateForUser);
  const saveDocumentOptimistic = useSavedStore((state) => state.saveDocumentOptimistic);
  const unsaveDocumentOptimistic = useSavedStore((state) => state.unsaveDocumentOptimistic);

  useEffect(() => {
    let isMounted = true;

    if (!documentId || !UUID_PATTERN.test(documentId)) {
      setIsLoading(false);
      setError(NOT_FOUND);
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
        setError(nextDocument ? null : NOT_FOUND);
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
  }, [documentId, reloadToken]);

  useEffect(() => {
    if (userId) {
      void hydrateSavedForUser(userId);
    }
  }, [hydrateSavedForUser, userId]);

  const article = useMemo(
    () => (document ? buildArticle(document.intro, document.contentJson, document.title) : null),
    [document],
  );
  const contents = useMemo(() => (article ? getTableOfContents(article) : []), [article]);
  const readingMinutes = article ? Math.max(1, Math.round(countArticleWords(article) / 220)) : 0;

  const overviewText = document
    ? (document.shortDescription ?? `${document.countryName} ${document.categoryName.toLowerCase()} guide.`)
    : "";

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const changeReaderScale = (scale: number) => {
    haptics.selection();
    setReaderScaleState(scale);
    setReaderScale(scale);
  };

  const jumpToSection = useCallback(
    (sectionId: string) => {
      const offset = sectionOffsets.current[sectionId];
      setIsContentsOpen(false);

      if (offset === undefined) {
        return;
      }

      const y = Math.max(0, articleOffset.current + offset - (insets.top + BAR_HEIGHT + 12));
      // Let the sheet start closing before the page scrolls underneath it.
      setTimeout(() => scrollRef.current?.scrollTo({ y, animated: true }), 120);
    },
    [insets.top, scrollRef],
  );

  const toggleSaved = () => {
    if (!document) {
      return;
    }

    if (!userId) {
      showErrorToast("Login required", "Please login to save guides.");
      return;
    }

    haptics.selection();

    if (!isSaved) {
      void saveDocumentOptimistic({
        clerkUserId: userId,
        documentId: document.id,
        document: {
          id: `document:${document.id}`,
          documentId: document.id,
          title: document.title,
          slug: document.slug,
          shortDescription: document.shortDescription,
          intro: document.intro,
          countryName: document.countryName,
          countrySlug: document.countrySlug,
          countryFlagEmoji: document.countryFlagEmoji,
          categoryName: document.categoryName,
          categorySlug: document.categorySlug,
          categoryIcon: document.categoryIcon,
          createdAt: new Date().toISOString(),
        },
      }).catch((saveError) => {
        console.warn("Unable to update saved document", saveError);
        showErrorToast("Could not save guide", "Please try again in a moment.");
      });
      showSavedToast(document.title, "document");
      return;
    }

    void unsaveDocumentOptimistic({ clerkUserId: userId, documentId: document.id }).catch(
      (saveError) => {
        console.warn("Unable to update saved document", saveError);
        showErrorToast("Could not remove guide", "Please try again in a moment.");
      },
    );
    showUnsavedToast(document.title, "document");
  };

  return (
    <>
      <StackScreen
        title={document?.title ?? "Guide"}
        eyebrow={document ? document.categoryName : undefined}
        hideLargeTitle={!document}
        scrollRef={scrollRef}
        showProgress={Boolean(document)}
        onBack={goBack}
        rightAction={
          document ? (
            <View style={styles.actions}>
              <PressableScale
                onPress={() => setIsContentsOpen(true)}
                scaleTo={0.88}
                haptic="selection"
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel="Contents and text size"
              >
                <Ionicons name="reader-outline" size={19} color={Palette.ink} />
              </PressableScale>
              <PressableScale
                onPress={toggleSaved}
                disabled={Boolean(pendingMutation)}
                disabledOpacity={1}
                scaleTo={0.88}
                style={[styles.headerButton, isSaved && styles.headerButtonActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSaved }}
                accessibilityLabel={isSaved ? `Remove ${document.title} from saved` : `Save ${document.title}`}
              >
                <Ionicons
                  name={isSaved ? "bookmark" : "bookmark-outline"}
                  size={19}
                  color={isSaved ? Palette.white : Palette.ink}
                />
              </PressableScale>
            </View>
          ) : null
        }
      >
        {isLoading ? <GuideDetailSkeleton /> : null}

        {!isLoading && error ? (
          <StateView
            icon={error === NOT_FOUND ? "document-outline" : "cloud-offline-outline"}
            tone="danger"
            title={error}
            message={
              error === NOT_FOUND
                ? "This guide may have moved or is no longer published."
                : "Check your connection, then try again."
            }
            actionLabel={error === NOT_FOUND ? undefined : "Try again"}
            actionIcon="refresh"
            onAction={() => setReloadToken((current) => current + 1)}
            secondaryLabel="Go back"
            onSecondary={goBack}
            style={styles.state}
          />
        ) : null}

        {!isLoading && document && article ? (
          <>
            <FadeInView index={0}>
              <View style={[styles.cover, Elevation.raised]}>
                <GradientFill colors={NavyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                <View style={styles.coverRing} pointerEvents="none">
                  <StarRing size={150} starSize={10} opacity={0.32} period={160} />
                </View>
                <View style={styles.coverTop}>
                  <View style={styles.coverFlag}>
                    <FlagImage
                      country={document.countryName}
                      emoji={document.countryFlagEmoji}
                      width={36}
                      radius={5}
                    />
                  </View>
                  <View style={styles.coverMeta}>
                    <Text style={styles.coverCountry}>{document.countryName}</Text>
                    <View style={styles.coverCategory}>
                      <Ionicons
                        name={getCategoryIcon(document.categoryIcon)}
                        size={13}
                        color="rgba(255,255,255,0.75)"
                      />
                      <Text style={styles.coverCategoryText} numberOfLines={1}>
                        {document.categoryName}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.coverOverview}>{overviewText}</Text>
                <View style={styles.coverStats}>
                  <CoverStat icon="time-outline" label={`${readingMinutes} min read`} />
                  {contents.length > 0 ? (
                    <CoverStat icon="list-outline" label={`${contents.length} sections`} />
                  ) : null}
                  {document.isPremium ? <ProBadge /> : null}
                </View>
              </View>
            </FadeInView>

            {contents.length >= 3 ? (
              <FadeInView index={1}>
                <View style={styles.toc}>
                  <Text style={styles.tocEyebrow}>In this guide</Text>
                  {contents.slice(0, INLINE_TOC_LIMIT).map((entry, index) => (
                    <PressableScale
                      key={entry.id}
                      onPress={() => jumpToSection(entry.id)}
                      haptic="selection"
                      scaleTo={0.98}
                      style={styles.tocRow}
                      accessibilityRole="button"
                      accessibilityLabel={`Jump to ${entry.title}`}
                    >
                      <Text style={styles.tocNumber}>{String(index + 1).padStart(2, "0")}</Text>
                      <Text style={styles.tocTitle} numberOfLines={2}>
                        {entry.title}
                      </Text>
                      <Ionicons name="arrow-down" size={15} color={Palette.muted} />
                    </PressableScale>
                  ))}
                  {contents.length > INLINE_TOC_LIMIT ? (
                    <PressableScale
                      onPress={() => setIsContentsOpen(true)}
                      haptic="selection"
                      style={styles.tocMore}
                      accessibilityRole="button"
                      accessibilityLabel={`Show all ${contents.length} sections`}
                    >
                      <Text style={styles.tocMoreText}>All {contents.length} sections</Text>
                      <Ionicons name="chevron-forward" size={15} color={Palette.primary} />
                    </PressableScale>
                  ) : null}
                </View>
              </FadeInView>
            ) : null}

            <View
              style={styles.content}
              onLayout={(event) => {
                articleOffset.current = event.nativeEvent.layout.y;
              }}
            >
              <FadeInView index={2}>
                <ArticleStyleProvider scale={readerScale}>
                  <DocumentArticle
                    article={article}
                    onSectionLayout={(sectionId, y) => {
                      sectionOffsets.current[sectionId] = y;
                    }}
                  />
                </ArticleStyleProvider>
              </FadeInView>
            </View>

            <PressableScale
              onPress={() => router.push(`/country/${document.countrySlug}`)}
              haptic="light"
              scaleTo={0.98}
              style={[styles.moreCard, Elevation.card]}
              accessibilityRole="button"
              accessibilityLabel={`View all ${document.countryName} guides`}
            >
              <FlagImage country={document.countryName} emoji={document.countryFlagEmoji} width={40} radius={6} />
              <View style={styles.moreText}>
                <Text style={styles.moreEyebrow}>Keep exploring</Text>
                <Text style={styles.moreTitle}>All {document.countryName} guides</Text>
              </View>
              <View style={styles.moreArrow}>
                <Ionicons name="arrow-forward" size={17} color={Palette.white} />
              </View>
            </PressableScale>
          </>
        ) : null}
      </StackScreen>

      <AppSheet
        visible={isContentsOpen}
        onClose={() => setIsContentsOpen(false)}
        snapPoints={["70%"]}
        scrollable
        header={
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Reading</Text>
            <Text style={styles.sheetLabel}>Text size</Text>
            <View style={styles.scaleRow} accessibilityRole="radiogroup">
              {READER_SCALES.map((scale) => {
                const isActive = Math.abs(scale - readerScale) < 0.01;

                return (
                  <PressableScale
                    key={scale}
                    onPress={() => changeReaderScale(scale)}
                    scaleTo={0.94}
                    style={[styles.scaleOption, isActive && styles.scaleOptionActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`Text size ${Math.round(scale * 100)} percent`}
                  >
                    <Text
                      style={[
                        styles.scaleGlyph,
                        { fontSize: Math.round(15 * scale) },
                        isActive && styles.scaleGlyphActive,
                      ]}
                    >
                      Aa
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
            {contents.length > 0 ? <Text style={[styles.sheetLabel, styles.sheetContentsLabel]}>Contents</Text> : null}
          </View>
        }
      >
        <View style={styles.sheetList}>
          {contents.map((entry, index) => (
            <PressableScale
              key={entry.id}
              onPress={() => jumpToSection(entry.id)}
              haptic="selection"
              scaleTo={0.98}
              dimOnPress
              style={[styles.sheetRow, index < contents.length - 1 && styles.sheetRowDivider]}
              accessibilityRole="button"
              accessibilityLabel={`Jump to ${entry.title}`}
            >
              <Text style={styles.tocNumber}>{String(index + 1).padStart(2, "0")}</Text>
              <Text style={styles.sheetRowTitle}>{entry.title}</Text>
            </PressableScale>
          ))}
        </View>
      </AppSheet>
    </>
  );
}

function CoverStat({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.coverStat}>
      <Ionicons name={icon} size={13} color={Palette.gold} />
      <Text style={styles.coverStatText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.hairline,
  },
  headerButtonActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  state: {
    marginTop: 24,
  },
  cover: {
    overflow: "hidden",
    padding: 20,
    borderRadius: Radii.xxl,
    backgroundColor: Palette.navy,
  },
  coverRing: {
    position: "absolute",
    right: -62,
    top: -84,
  },
  coverTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coverFlag: {
    padding: 5,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  coverMeta: {
    flex: 1,
    minWidth: 0,
  },
  coverCountry: {
    ...Type.headline,
    color: Palette.white,
  },
  coverCategory: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  coverCategoryText: {
    ...Type.caption,
    flexShrink: 1,
    color: "rgba(255,255,255,0.78)",
  },
  coverOverview: {
    ...Type.body,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 16,
    color: "rgba(255,255,255,0.9)",
  },
  coverStats: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  coverStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  coverStatText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: Palette.white,
  },
  toc: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    borderRadius: Radii.xl,
    backgroundColor: Palette.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,16,36,0.08)",
  },
  tocEyebrow: {
    ...Type.overline,
    marginBottom: 4,
    color: Palette.primary,
  },
  tocRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  tocNumber: {
    width: 22,
    fontFamily: FontFamily.displayBold,
    fontSize: 13,
    color: Palette.primary,
  },
  tocTitle: {
    ...Type.bodyMedium,
    flex: 1,
    color: Palette.ink,
  },
  tocMore: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Palette.divider,
  },
  tocMoreText: {
    ...Type.label,
    color: Palette.primary,
  },
  content: {
    marginTop: 12,
  },
  moreCard: {
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: Radii.xl,
    backgroundColor: Palette.card,
  },
  moreText: {
    flex: 1,
  },
  moreEyebrow: {
    ...Type.overline,
    color: Palette.primary,
  },
  moreTitle: {
    ...Type.headline,
    marginTop: 3,
    color: Palette.ink,
  },
  moreArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.primary,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  sheetTitle: {
    ...Type.title2,
    color: Palette.ink,
  },
  sheetLabel: {
    ...Type.overline,
    marginTop: 18,
    marginBottom: 10,
    color: Palette.muted,
  },
  sheetContentsLabel: {
    marginTop: 22,
    marginBottom: 0,
  },
  scaleRow: {
    flexDirection: "row",
    gap: 8,
  },
  scaleOption: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.sm,
    backgroundColor: Palette.cardMuted,
    borderWidth: 1,
    borderColor: "rgba(10,16,36,0.08)",
  },
  scaleOptionActive: {
    backgroundColor: Palette.tint,
    borderColor: Palette.primary,
  },
  scaleGlyph: {
    fontFamily: FontFamily.displayBold,
    color: Palette.inkSoft,
  },
  scaleGlyphActive: {
    color: Palette.primary,
  },
  sheetList: {
    marginTop: 4,
  },
  sheetRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  sheetRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.divider,
  },
  sheetRowTitle: {
    ...Type.bodyMedium,
    flex: 1,
    color: Palette.ink,
  },
});
