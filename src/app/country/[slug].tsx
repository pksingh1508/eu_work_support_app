import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@clerk/expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { CollapsingTopBar } from "@/components/country/collapsing-top-bar";
import { COUNTRY_HERO_HEIGHT, CountryHero } from "@/components/country/country-hero";
import { DocumentRow } from "@/components/country/document-row";
import { CountryDetailSkeleton } from "@/components/skeletons";
import { ContentReveal } from "@/components/ui/fade-in-view";
import { FocusStatusBar } from "@/components/ui/focus-status-bar";
import { ListGroup, ListRow } from "@/components/ui/list-group";
import { PressableScale } from "@/components/ui/pressable-scale";
import { SectionHeader } from "@/components/ui/screen-header";
import { StateView } from "@/components/ui/state-view";
import { Elevation, Palette, Radii, Type } from "@/constants/theme";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import {
  fetchCountry,
  type CountryDocument,
  type CountryState,
} from "@/features/countries/country-api";
import {
  formatLongDate,
  getCategoryIcon,
  getUrlHost,
  normalizeExternalUrl,
} from "@/features/documents/content";
import { useIsCountrySaved, useSavedStore } from "@/features/saved/saved-store";
import { haptics } from "@/lib/haptics";
import { openExternal } from "@/lib/open-external";
import { showErrorToast, showSavedToast, showUnsavedToast } from "@/lib/toast";

export default function CountryDetailScreen() {
  return (
    <PremiumGuard>
      <CountryDetailContent />
    </PremiumGuard>
  );
}

const COLLAPSE_AT = COUNTRY_HERO_HEIGHT - 120;

type CategoryGroup = {
  name: string;
  icon: string | null;
  entries: { document: CountryDocument; index: number }[];
};

/** Documents arrive sorted by category; fold them into consecutive groups. */
function groupByCategory(documents: CountryDocument[]) {
  const groups: CategoryGroup[] = [];

  documents.forEach((document, index) => {
    const current = groups[groups.length - 1];
    const entry = { document, index };

    if (current && current.name === document.categoryName) {
      current.entries.push(entry);
    } else {
      groups.push({ name: document.categoryName, icon: document.categoryIcon, entries: [entry] });
    }
  });

  return groups;
}

function CountryDetailContent() {
  const router = useRouter();
  const { userId } = useAuth();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const countrySlug = Array.isArray(slug) ? slug[0] : slug;
  const [country, setCountry] = useState<CountryState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const isCountrySaved = useIsCountrySaved(country?.id);
  const pendingCountryMutation = useSavedStore((state) =>
    country?.id ? state.pendingMutations[`country:${country.id}`] : undefined,
  );
  const hydrateSavedForUser = useSavedStore((state) => state.hydrateForUser);
  const saveCountryOptimistic = useSavedStore((state) => state.saveCountryOptimistic);
  const unsaveCountryOptimistic = useSavedStore((state) => state.unsaveCountryOptimistic);
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
  }, [countrySlug, reloadToken]);

  useEffect(() => {
    if (userId) {
      void hydrateSavedForUser(userId);
    }
  }, [hydrateSavedForUser, userId]);

  const groups = useMemo(() => groupByCategory(country?.documents ?? []), [country]);

  const heroSubtitle = useMemo(() => {
    const names = groups.slice(0, 3).map((group) => group.name.toLowerCase());
    return names.length > 0 ? `Guides on ${names.join(", ")}.` : "Visa, permit and document guidance.";
  }, [groups]);

  const overviewText =
    country?.shortDescription ??
    `${country?.name ?? "This country"} visa, immigration, work, study, and document guidance.`;
  const officialUrl = normalizeExternalUrl(country?.officialUrl ?? null);
  const officialImmigrationUrl = normalizeExternalUrl(country?.officialImmigrationUrl ?? null);
  const lastReviewedDate = formatLongDate(country?.lastReviewedAt ?? null);
  const reviewedShort = country?.lastReviewedAt
    ? new Date(country.lastReviewedAt).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  const toggleSavedCountry = () => {
    if (!country) {
      return;
    }

    if (!userId) {
      showErrorToast("Login required", "Please login to save countries.");
      return;
    }

    haptics.selection();

    if (!isCountrySaved) {
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
      }).catch((saveError) => {
        console.warn("Unable to update saved country", saveError);
        showErrorToast("Could not save country", "Please try again in a moment.");
      });
      showSavedToast(country.name, "country");
      return;
    }

    void unsaveCountryOptimistic({ clerkUserId: userId, countryId: country.id }).catch(
      (saveError) => {
        console.warn("Unable to update saved country", saveError);
        showErrorToast("Could not remove country", "Please try again in a moment.");
      },
    );
    showUnsavedToast(country.name, "country");
  };

  const openGuide = useCallback(
    (document: CountryDocument) => {
      router.push({
        pathname: "/visa/[id]",
        params: { id: document.id, title: document.title, category: document.categoryName },
      });
    },
    [router],
  );

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <View style={styles.screen}>
      <FocusStatusBar style={isBarSolid || (!country && !isLoading) ? "dark" : "light"} />
      <CollapsingTopBar
        title={country?.name ?? "Country"}
        topInset={insets.top}
        scrollY={scrollY}
        collapseAt={country || isLoading ? COLLAPSE_AT : 0}
        onBack={goBack}
        rightAction={
          country ? (
            <PressableScale
              onPress={toggleSavedCountry}
              disabled={isSavingCountry}
              scaleTo={0.88}
              style={[styles.saveButton, isCountrySaved && styles.saveButtonActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: isCountrySaved }}
              accessibilityLabel={isCountrySaved ? `Remove ${country.name} from saved` : `Save ${country.name}`}
            >
              <Ionicons
                name={isCountrySaved ? "bookmark" : "bookmark-outline"}
                size={19}
                color={isCountrySaved ? Palette.white : Palette.ink}
              />
            </PressableScale>
          ) : null
        }
      />

      <Animated.ScrollView
        style={styles.screen}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {isLoading ? <CountryDetailSkeleton /> : null}

        {!isLoading && error ? (
          <View style={[styles.errorWrap, { paddingTop: insets.top + 90 }]}>
            <StateView
              icon={error === "Country not found." ? "map-outline" : "cloud-offline-outline"}
              tone="danger"
              title={error}
              message="Check your connection, then try again."
              actionLabel="Try again"
              actionIcon="refresh"
              onAction={() => setReloadToken((current) => current + 1)}
              secondaryLabel="Go back"
              onSecondary={goBack}
            />
          </View>
        ) : null}

        {!isLoading && country ? (
          <>
            <CountryHero
              name={country.name}
              subtitle={heroSubtitle}
              flagEmoji={country.flagEmoji}
              documentCount={country.documents.length}
              categoryCount={groups.length}
              reviewedLabel={reviewedShort}
              topInset={insets.top}
              scrollY={scrollY}
            />

            <ContentReveal style={styles.body}>
              <View style={[styles.overview, Elevation.raised]}>
                <View style={styles.overviewIcon}>
                  <Ionicons name="compass" size={20} color={Palette.primary} />
                </View>
                <View style={styles.overviewText}>
                  <Text style={styles.overviewTitle}>Immigration overview</Text>
                  <Text style={styles.overviewBody}>{overviewText}</Text>
                </View>
              </View>

              <View style={styles.sectionHeader}>
                <SectionHeader
                  eyebrow="Library"
                  title="Guides & documents"
                  count={country.documents.length}
                />
              </View>

              {country.documents.length === 0 ? (
                <StateView
                  icon="reader-outline"
                  title="Guides coming soon"
                  message={`We’re preparing ${country.name} guides. Check back shortly.`}
                />
              ) : null}

              {groups.map((group) => (
                <View key={group.name} style={styles.group}>
                  <View style={styles.groupHeader}>
                    <Ionicons name={getCategoryIcon(group.icon)} size={14} color={Palette.muted} />
                    <Text style={styles.groupTitle}>{group.name}</Text>
                    <View style={styles.groupLine} />
                    <Text style={styles.groupCount}>{group.entries.length}</Text>
                  </View>
                  <View style={styles.documents}>
                    {group.entries.map(({ document, index }) => (
                      <DocumentRow
                        key={document.id}
                        document={document}
                        isFirst={index === 0}
                        onPress={openGuide}
                      />
                    ))}
                  </View>
                </View>
              ))}

              {officialUrl || officialImmigrationUrl || lastReviewedDate ? (
                <ListGroup
                  title="Official sources"
                  footer={lastReviewedDate ? `Last reviewed ${lastReviewedDate}` : undefined}
                  style={styles.sources}
                >
                  {officialUrl ? (
                    <ListRow
                      icon="globe-outline"
                      title="Official website"
                      subtitle={getUrlHost(officialUrl)}
                      external
                      onPress={() => void openExternal(officialUrl)}
                    />
                  ) : null}
                  {officialImmigrationUrl ? (
                    <ListRow
                      icon="business-outline"
                      title="Immigration authority"
                      subtitle={getUrlHost(officialImmigrationUrl)}
                      external
                      onPress={() => void openExternal(officialImmigrationUrl)}
                    />
                  ) : null}
                  {!officialUrl && !officialImmigrationUrl && lastReviewedDate ? (
                    <ListRow
                      icon="shield-checkmark-outline"
                      tone="success"
                      title="Reviewed by our team"
                      subtitle={lastReviewedDate}
                    />
                  ) : null}
                </ListGroup>
              ) : null}
            </ContentReveal>
          </>
        ) : null}
      </Animated.ScrollView>
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
  errorWrap: {
    paddingHorizontal: 20,
  },
  body: {
    paddingHorizontal: 20,
    marginTop: -30,
  },
  overview: {
    flexDirection: "row",
    gap: 14,
    padding: 18,
    borderRadius: Radii.xl,
    backgroundColor: Palette.card,
  },
  overviewIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.tint,
  },
  overviewText: {
    flex: 1,
  },
  overviewTitle: {
    ...Type.headline,
    color: Palette.ink,
  },
  overviewBody: {
    ...Type.callout,
    marginTop: 4,
    color: Palette.muted,
  },
  sectionHeader: {
    marginTop: 32,
  },
  group: {
    marginBottom: 18,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    marginLeft: 4,
  },
  groupTitle: {
    ...Type.overline,
    color: Palette.muted,
  },
  groupLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(10,16,36,0.12)",
  },
  groupCount: {
    ...Type.caption,
    color: Palette.muted,
  },
  documents: {
    gap: 10,
  },
  sources: {
    marginTop: 14,
  },
});
