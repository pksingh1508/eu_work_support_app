import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@clerk/expo";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutLeft, LinearTransition } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCategoryIcon } from "@/features/documents/content";
import { SavedListSkeleton } from "@/components/skeletons";
import { FadeInView } from "@/components/ui/fade-in-view";
import { FlagImage } from "@/components/ui/flag-image";
import { FocusStatusBar } from "@/components/ui/focus-status-bar";
import { PressableScale } from "@/components/ui/pressable-scale";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StateView } from "@/components/ui/state-view";
import { BottomTabInset, Elevation, Motion, Palette, Radii, Type } from "@/constants/theme";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { useSavedStore } from "@/features/saved/saved-store";
import { haptics } from "@/lib/haptics";
import { type SavedCountry, type SavedDocument } from "@/lib/saved-items";
import { showErrorToast, showUnsavedToast } from "@/lib/toast";

type SavedItem = ({ type: "country" } & SavedCountry) | ({ type: "document" } & SavedDocument);
type SavedFilter = "all" | "country" | "document";

function formatSavedDate(value: string) {
  const savedAt = new Date(value);

  if (Number.isNaN(savedAt.getTime())) {
    return "Saved";
  }

  return `Saved ${savedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export default function SavedScreen() {
  return (
    <PremiumGuard>
      <SavedContent />
    </PremiumGuard>
  );
}

function SavedContent() {
  const router = useRouter();
  const { userId } = useAuth();
  const [filter, setFilter] = useState<SavedFilter>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const countries = useSavedStore((state) => state.countries);
  const documents = useSavedStore((state) => state.documents);
  const status = useSavedStore((state) => state.status);
  const pendingMutations = useSavedStore((state) => state.pendingMutations);
  const hydrateForUser = useSavedStore((state) => state.hydrateForUser);
  const refresh = useSavedStore((state) => state.refresh);
  const resetSavedStore = useSavedStore((state) => state.reset);
  const unsaveCountryOptimistic = useSavedStore((state) => state.unsaveCountryOptimistic);
  const unsaveDocumentOptimistic = useSavedStore((state) => state.unsaveDocumentOptimistic);

  const savedItems = useMemo<SavedItem[]>(
    () =>
      [
        ...countries.map((country) => ({ ...country, type: "country" as const })),
        ...documents.map((document) => ({ ...document, type: "document" as const })),
      ].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [countries, documents],
  );
  const visibleItems = useMemo(
    () => (filter === "all" ? savedItems : savedItems.filter((item) => item.type === filter)),
    [filter, savedItems],
  );
  const isLoading = status === "loading" && savedItems.length === 0;
  const hasError = status === "error" && savedItems.length === 0;

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        resetSavedStore();
        return;
      }

      void hydrateForUser(userId);
    }, [hydrateForUser, resetSavedStore, userId]),
  );

  const onRefresh = async () => {
    if (!userId) {
      return;
    }

    setIsRefreshing(true);
    try {
      await refresh(userId);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openSavedItem = (item: SavedItem) => {
    if (item.type === "country") {
      router.push({ pathname: "/country/[slug]", params: { slug: item.slug } });
      return;
    }

    router.push(`/visa/${item.documentId}`);
  };

  const unsaveItem = (item: SavedItem) => {
    if (!userId) {
      showErrorToast("Login required", "Please login to update saved items.");
      return;
    }

    const onFailure = (error: unknown) => {
      console.warn("Unable to remove saved item", error);
      showErrorToast("Could not remove saved item", "Please try again in a moment.");
    };

    if (item.type === "country") {
      void unsaveCountryOptimistic({ clerkUserId: userId, countryId: item.countryId }).catch(onFailure);
    } else {
      void unsaveDocumentOptimistic({ clerkUserId: userId, documentId: item.documentId }).catch(
        onFailure,
      );
    }

    showUnsavedToast(item.type === "country" ? item.name : item.title, item.type);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <FocusStatusBar style="dark" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Palette.primary]}
            progressBackgroundColor={Palette.card}
            tintColor={Palette.primary}
          />
        }
      >
        <ScreenHeader
          eyebrow="Your library"
          title="Saved"
          subtitle="Countries and guides you’ve bookmarked, ready whenever you are."
        />

        {!isLoading && !hasError && savedItems.length > 0 ? (
          <>
            <FadeInView index={1} style={styles.summary}>
              <SummaryTile value={countries.length} label="Countries" icon="earth" tone="primary" />
              <SummaryTile value={documents.length} label="Guides" icon="reader" tone="gold" />
            </FadeInView>
            <FadeInView index={2} style={styles.filters}>
              <SegmentedControl
                value={filter}
                onChange={setFilter}
                options={[
                  { key: "all", label: "All", count: savedItems.length },
                  { key: "country", label: "Countries", count: countries.length },
                  { key: "document", label: "Guides", count: documents.length },
                ]}
              />
            </FadeInView>
          </>
        ) : null}

        {isLoading ? <SavedListSkeleton /> : null}

        {hasError ? (
          <StateView
            icon="cloud-offline-outline"
            tone="danger"
            title="Couldn’t load your library"
            message="Check your connection and try again."
            actionLabel="Try again"
            actionIcon="refresh"
            onAction={onRefresh}
          />
        ) : null}

        {!isLoading && !hasError && savedItems.length === 0 ? (
          <StateView
            icon="bookmark"
            title="Nothing saved yet"
            message="Tap the bookmark on any country or guide and it will appear here."
            actionLabel="Explore countries"
            actionIcon="arrow-forward"
            onAction={() => router.navigate("/")}
          />
        ) : null}

        {!isLoading && savedItems.length > 0 && visibleItems.length === 0 ? (
          <StateView
            bare
            icon={filter === "country" ? "earth-outline" : "reader-outline"}
            title={filter === "country" ? "No saved countries" : "No saved guides"}
            message="Items you save in this category will show up here."
          />
        ) : null}

        <View style={styles.list}>
          {visibleItems.map((item, index) => (
            <Animated.View
              key={`${item.type}-${item.id}`}
              entering={FadeInDown.delay(Math.min(index * Motion.stagger, Motion.maxStaggerDelay))
                .springify()
                .damping(Motion.softSpring.damping)}
              exiting={FadeOutLeft.duration(240)}
              layout={LinearTransition.springify().damping(Motion.softSpring.damping)}
            >
              <SavedCard
                item={item}
                isUpdating={
                  item.type === "country"
                    ? pendingMutations[`country:${item.countryId}`] === "removing"
                    : pendingMutations[`document:${item.documentId}`] === "removing"
                }
                onPress={() => openSavedItem(item)}
                onUnsave={() => unsaveItem(item)}
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryTile({
  value,
  label,
  icon,
  tone,
}: {
  value: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: "primary" | "gold";
}) {
  const isGold = tone === "gold";

  return (
    <View style={[styles.tile, Elevation.card]}>
      <View style={[styles.tileIcon, { backgroundColor: isGold ? Palette.goldSoft : Palette.tint }]}>
        <Ionicons name={icon} size={18} color={isGold ? Palette.goldInk : Palette.primary} />
      </View>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function SavedCard({
  item,
  isUpdating,
  onPress,
  onUnsave,
}: {
  item: SavedItem;
  isUpdating: boolean;
  onPress: () => void;
  onUnsave: () => void;
}) {
  const isCountry = item.type === "country";
  const title = isCountry ? item.name : item.title;
  const countryName = isCountry ? item.name : item.countryName;
  const flagEmoji = isCountry ? item.flagEmoji : item.countryFlagEmoji;
  const description = isCountry ? item.shortDescription : (item.shortDescription ?? item.intro);

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.975}
      style={[styles.card, Elevation.card]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          {isCountry ? (
            <FlagImage country={countryName} emoji={flagEmoji} width={34} radius={5} />
          ) : (
            <>
              <Ionicons name={getCategoryIcon(item.categoryIcon)} size={22} color={Palette.primary} />
              <FlagImage country={countryName} emoji={flagEmoji} width={18} radius={3} style={styles.miniFlag} />
            </>
          )}
        </View>
        <View style={styles.cardHeading}>
          <Text style={styles.cardLabel} numberOfLines={1}>
            {isCountry ? "Country" : `${item.countryName} · ${item.categoryName}`}
          </Text>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            haptics.selection();
            onUnsave();
          }}
          disabled={isUpdating}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${title} from saved`}
          style={[styles.unsave, isUpdating && styles.unsaveBusy]}
        >
          <Ionicons name="bookmark" size={17} color={Palette.white} />
        </Pressable>
      </View>

      {description ? (
        <Text numberOfLines={2} style={styles.cardDescription}>
          {description}
        </Text>
      ) : null}

      <View style={styles.cardFooter}>
        <Ionicons name="time-outline" size={13} color={Palette.subtle} />
        <Text style={styles.cardMetaText} numberOfLines={1}>
          {formatSavedDate(item.createdAt)}
        </Text>
        <View style={styles.openPill}>
          <Text style={styles.openText}>Open</Text>
          <Ionicons name="arrow-forward" size={13} color={Palette.primary} />
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
  summary: {
    flexDirection: "row",
    gap: 12,
  },
  tile: {
    flex: 1,
    padding: 16,
    borderRadius: Radii.xl,
    backgroundColor: Palette.card,
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tileValue: {
    ...Type.display,
    fontSize: 28,
    lineHeight: 32,
    marginTop: 14,
    color: Palette.ink,
  },
  tileLabel: {
    ...Type.caption,
    marginTop: 2,
    color: Palette.muted,
  },
  filters: {
    marginTop: 20,
    marginBottom: 18,
  },
  list: {
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: Radii.xl,
    backgroundColor: Palette.card,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.cardMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.hairline,
  },
  miniFlag: {
    position: "absolute",
    right: -4,
    bottom: -4,
    borderWidth: 2,
    borderColor: Palette.card,
  },
  cardHeading: {
    flex: 1,
    minWidth: 0,
  },
  cardLabel: {
    ...Type.overline,
    color: Palette.primary,
  },
  cardTitle: {
    ...Type.title3,
    fontSize: 17,
    marginTop: 3,
    color: Palette.ink,
  },
  unsave: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.primary,
  },
  unsaveBusy: {
    opacity: 0.5,
  },
  cardDescription: {
    ...Type.footnote,
    marginTop: 12,
    color: Palette.muted,
  },
  cardFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(10,16,36,0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardMetaText: {
    ...Type.caption,
    flex: 1,
    color: Palette.muted,
  },
  openPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Palette.tint,
  },
  openText: {
    ...Type.caption,
    fontFamily: Type.label.fontFamily,
    color: Palette.primary,
  },
});
