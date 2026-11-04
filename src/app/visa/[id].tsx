import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@clerk/expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DocumentSections } from "@/components/document/document-sections";
import { GuideDetailSkeleton } from "@/components/skeletons";
import { Badge, ProBadge } from "@/components/ui/badge";
import { FadeInView } from "@/components/ui/fade-in-view";
import { FlagImage } from "@/components/ui/flag-image";
import { GradientFill } from "@/components/ui/gradient-fill";
import { PressableScale } from "@/components/ui/pressable-scale";
import { StackScreen } from "@/components/ui/stack-screen";
import { StarRing } from "@/components/ui/star-ring";
import { StateView } from "@/components/ui/state-view";
import { Elevation, NavyGradient, Palette, Radii, Type } from "@/constants/theme";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { estimateReadingMinutes, getCategoryIcon } from "@/features/documents/content";
import { fetchVisaDocument, type VisaDocument } from "@/features/documents/guide-api";
import { useIsDocumentSaved, useSavedStore } from "@/features/saved/saved-store";
import { FontFamily } from "@/lib/fonts";
import { haptics } from "@/lib/haptics";
import { showErrorToast, showSavedToast, showUnsavedToast } from "@/lib/toast";

export default function VisaDocumentScreen() {
  return (
    <PremiumGuard>
      <VisaDocumentContent />
    </PremiumGuard>
  );
}

function VisaDocumentContent() {
  const router = useRouter();
  const { userId } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const documentId = Array.isArray(id) ? id[0] : id;
  const [document, setDocument] = useState<VisaDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const isSaved = useIsDocumentSaved(document?.id);
  const pendingMutation = useSavedStore((state) =>
    document?.id ? state.pendingMutations[`document:${document.id}`] : undefined,
  );
  const hydrateSavedForUser = useSavedStore((state) => state.hydrateForUser);
  const saveDocumentOptimistic = useSavedStore((state) => state.saveDocumentOptimistic);
  const unsaveDocumentOptimistic = useSavedStore((state) => state.unsaveDocumentOptimistic);

  useEffect(() => {
    let isMounted = true;

    if (!documentId) {
      setIsLoading(false);
      setError("Guide not found.");
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
        setError(nextDocument ? null : "Guide not found.");
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

  const overviewText = useMemo(() => {
    if (!document) {
      return "";
    }

    return (
      document.shortDescription ??
      `${document.countryName} ${document.categoryName.toLowerCase()} guide.`
    );
  }, [document]);

  const readingMinutes = document ? estimateReadingMinutes(document.intro, document.contentJson) : 0;

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
    <StackScreen
      title={document?.title ?? "Guide"}
      eyebrow={document ? document.categoryName : undefined}
      hideLargeTitle={!document}
      rightAction={
        document ? (
          <PressableScale
            onPress={toggleSaved}
            disabled={Boolean(pendingMutation)}
            scaleTo={0.88}
            style={[styles.saveButton, isSaved && styles.saveButtonActive]}
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
        ) : null
      }
    >
      {isLoading ? <GuideDetailSkeleton /> : null}

      {!isLoading && error ? (
        <StateView
          icon={error === "Guide not found." ? "document-outline" : "cloud-offline-outline"}
          tone="danger"
          title={error}
          message="Check your connection, then try again."
          actionLabel="Try again"
          actionIcon="refresh"
          onAction={() => setReloadToken((current) => current + 1)}
          secondaryLabel="Go back"
          onSecondary={() => router.back()}
          style={styles.state}
        />
      ) : null}

      {!isLoading && document ? (
        <>
          <FadeInView index={0}>
            <View style={[styles.cover, Elevation.floating]}>
              <GradientFill colors={NavyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={styles.coverRing} pointerEvents="none">
                <StarRing size={160} starSize={10} opacity={0.4} period={160} />
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
                      color="rgba(255,255,255,0.7)"
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
                <CoverStat
                  icon="list-outline"
                  label={`${document.contentJson.sections?.length ?? 0} sections`}
                />
                {document.isPremium ? <ProBadge /> : null}
              </View>
            </View>
          </FadeInView>

          {document.tags.length > 0 ? (
            <FadeInView index={1} style={styles.tags}>
              {document.tags.slice(0, 6).map((tag) => (
                <Badge key={tag} label={tag} tone="neutral" />
              ))}
            </FadeInView>
          ) : null}

          <FadeInView index={2} style={styles.content}>
            <DocumentSections intro={document.intro} content={document.contentJson} />
          </FadeInView>

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
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.hairline,
  },
  saveButtonActive: {
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
    right: -50,
    top: -50,
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
    color: "rgba(255,255,255,0.7)",
  },
  coverOverview: {
    ...Type.body,
    marginTop: 16,
    color: "rgba(255,255,255,0.86)",
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
  tags: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  content: {
    marginTop: 24,
  },
  moreCard: {
    marginTop: 26,
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
});
