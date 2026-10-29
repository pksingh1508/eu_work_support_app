import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@clerk/expo";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeOutRight,
  LinearTransition,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomLoading } from "@/components/custom-loading";
import { FadeInView } from "@/components/ui/fade-in-view";
import { FocusStatusBar } from "@/components/ui/focus-status-bar";
import { PressableScale } from "@/components/ui/pressable-scale";
import { ScreenHeader } from "@/components/ui/screen-header";
import { BottomTabInset, Elevation, Motion, Palette } from "@/constants/theme";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { useSavedStore } from "@/features/saved/saved-store";
import { FontFamily } from "@/lib/fonts";
import { SavedCountry, SavedDocument } from "@/lib/saved-items";
import { showErrorToast, showUnsavedToast } from "@/lib/toast";

type SavedItem =
  | ({ type: "country" } & SavedCountry)
  | ({ type: "document" } & SavedDocument);

function formatSavedDate(value: string) {
  const savedAt = new Date(value);

  if (Number.isNaN(savedAt.getTime())) {
    return "Saved";
  }

  return `Saved ${savedAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
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
  const countries = useSavedStore((state) => state.countries);
  const documents = useSavedStore((state) => state.documents);
  const status = useSavedStore((state) => state.status);
  const pendingMutations = useSavedStore((state) => state.pendingMutations);
  const hydrateForUser = useSavedStore((state) => state.hydrateForUser);
  const resetSavedStore = useSavedStore((state) => state.reset);
  const unsaveCountryOptimistic = useSavedStore(
    (state) => state.unsaveCountryOptimistic,
  );
  const unsaveDocumentOptimistic = useSavedStore(
    (state) => state.unsaveDocumentOptimistic,
  );

  const savedItems = useMemo(
    () =>
      [
        ...countries.map((country) => ({
          ...country,
          type: "country" as const,
        })),
        ...documents.map((document) => ({
          ...document,
          type: "document" as const,
        })),
      ].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      ),
    [countries, documents],
  );
  const isLoading = status === "loading" && savedItems.length === 0;
  const error =
    status === "error" ? "Unable to load saved guides right now." : null;

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        resetSavedStore();
        return;
      }

      void hydrateForUser(userId);
    }, [hydrateForUser, resetSavedStore, userId]),
  );

  const openSavedItem = (item: SavedItem) => {
    if (item.type === "country") {
      router.push({
        pathname: "/country/[slug]",
        params: { slug: item.slug },
      });
      return;
    }

    router.push(`/visa/${item.documentId}`);
  };

  const unsaveItem = async (item: SavedItem) => {
    if (!userId) {
      Alert.alert("Login required", "Please login to update saved items.");
      return;
    }

    if (item.type === "country") {
      void unsaveCountryOptimistic({
        clerkUserId: userId,
        countryId: item.countryId,
      }).catch((error) => {
        console.warn("Unable to remove saved item", error);
        showErrorToast(
          "Could not remove saved item",
          "Please try again in a moment.",
        );
      });
    } else {
      void unsaveDocumentOptimistic({
        clerkUserId: userId,
        documentId: item.documentId,
      }).catch((error) => {
        console.warn("Unable to remove saved item", error);
        showErrorToast(
          "Could not remove saved item",
          "Please try again in a moment.",
        );
      });
    }

    showUnsavedToast(
      item.type === "country" ? item.name : item.title,
      item.type,
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <FocusStatusBar style="dark" />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: BottomTabInset + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="Your library"
          title="Saved guides"
          subtitle="Your curated collection of European working pathways."
        />

        {!isLoading && !error && savedItems.length > 0 ? (
          <FadeInView index={1} style={styles.summary}>
            <SummaryStat value={countries.length} label="Countries" icon="flag" />
            <SummaryStat value={documents.length} label="Documents" icon="document-text" />
          </FadeInView>
        ) : null}

        {isLoading ? (
          <View style={[styles.stateCard, Elevation.card]}>
            <CustomLoading />
            <Text style={styles.stateText}>Loading saved guides…</Text>
          </View>
        ) : null}

        {!isLoading && error ? (
          <FadeInView style={[styles.stateCard, Elevation.card]}>
            <View style={[styles.stateIcon, styles.stateIconDanger]}>
              <Ionicons name="alert-circle" size={26} color={Palette.danger} />
            </View>
            <Text style={styles.stateTitle}>{error}</Text>
          </FadeInView>
        ) : null}

        {!isLoading && !error && savedItems.length === 0 ? (
          <FadeInView index={1} style={[styles.stateCard, Elevation.card]}>
            <View style={styles.stateIcon}>
              <Ionicons name="bookmark" size={26} color={Palette.primary} />
            </View>
            <Text style={styles.stateTitle}>No saved guides yet</Text>
            <Text style={styles.stateText}>
              Tap the bookmark on any country or document and it will show up here.
            </Text>
            <PressableScale
              onPress={() => router.push("/")}
              style={styles.stateButton}
              accessibilityRole="button"
              accessibilityLabel="Explore countries"
            >
              <Text style={styles.stateButtonText}>Explore countries</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </PressableScale>
          </FadeInView>
        ) : null}

        {!isLoading && !error && savedItems.length > 0 ? (
          <View style={styles.list}>
            {savedItems.map((item, index) => (
              <Animated.View
                key={`${item.type}-${item.id}`}
                entering={FadeInDown.delay(Math.min(index * Motion.stagger, Motion.maxStaggerDelay)).springify()}
                exiting={FadeOutRight.duration(260)}
                layout={LinearTransition.springify().damping(Motion.softSpring.damping)}
              >
                <SavedGuideCard
                  item={item}
                  isUpdating={
                    item.type === "country"
                      ? pendingMutations[`country:${item.countryId}`] ===
                        "removing"
                      : pendingMutations[`document:${item.documentId}`] ===
                        "removing"
                  }
                  onPress={() => openSavedItem(item)}
                  onUnsave={() => unsaveItem(item)}
                />
              </Animated.View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryStat({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={[styles.stat, Elevation.card]}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={16} color={Palette.primary} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function SavedGuideCard({
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
  const flagEmoji = isCountry ? item.flagEmoji : item.countryFlagEmoji;
  const label = isCountry ? "Country" : item.countryName;
  const description = isCountry
    ? item.shortDescription
    : item.shortDescription ?? item.intro;
  const status = isCountry ? "Saved country" : item.categoryName;

  return (
    <PressableScale
      onPress={onPress}
      style={[styles.card, Elevation.card]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          {flagEmoji ? (
            <Text style={styles.cardEmoji}>{flagEmoji}</Text>
          ) : (
            <Ionicons
              name={isCountry ? "flag-outline" : "document-text-outline"}
              size={22}
              color={Palette.primary}
            />
          )}
        </View>
        <View style={styles.cardHeading}>
          <Text style={styles.cardLabel} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onUnsave();
          }}
          disabled={isUpdating}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Unsave ${title}`}
          style={[styles.unsave, isUpdating && styles.unsavePressed]}
        >
          <Ionicons name="bookmark" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {description ? (
        <Text numberOfLines={2} style={styles.cardDescription}>
          {description}
        </Text>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.cardMeta}>
          <Ionicons name="time-outline" size={14} color={Palette.subtle} />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {status} · {formatSavedDate(item.createdAt)}
          </Text>
        </View>
        <View style={styles.openPill}>
          <Text style={styles.openText}>Open</Text>
          <Ionicons name="arrow-forward" size={14} color={Palette.primary} />
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
    marginBottom: 20,
  },
  stat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: Palette.card,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.tint,
  },
  statValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    lineHeight: 24,
    color: Palette.ink,
  },
  statLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Palette.muted,
  },
  stateCard: {
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
    backgroundColor: Palette.tint,
  },
  stateIconDanger: {
    backgroundColor: Palette.dangerTint,
  },
  stateTitle: {
    marginTop: 16,
    textAlign: "center",
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 19,
    color: Palette.ink,
  },
  stateText: {
    marginTop: 8,
    textAlign: "center",
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 21,
    color: Palette.muted,
  },
  stateButton: {
    marginTop: 20,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: Palette.primary,
  },
  stateButtonText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 15,
    color: "#FFFFFF",
  },
  list: {
    gap: 14,
  },
  card: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: Palette.card,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.canvas,
  },
  cardEmoji: {
    fontSize: 26,
  },
  cardHeading: {
    flex: 1,
    minWidth: 0,
  },
  cardLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Palette.primary,
  },
  cardTitle: {
    marginTop: 2,
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 18,
    lineHeight: 24,
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
  unsavePressed: {
    opacity: 0.6,
  },
  cardDescription: {
    marginTop: 14,
    fontFamily: FontFamily.body,
    fontSize: 14,
    lineHeight: 21,
    color: Palette.muted,
  },
  cardFooter: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Palette.hairline,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardMeta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardMetaText: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Palette.muted,
  },
  openPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Palette.tint,
  },
  openText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 13,
    color: Palette.primary,
  },
});
