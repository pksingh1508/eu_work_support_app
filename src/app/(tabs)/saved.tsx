import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@clerk/expo";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomLoading } from "@/components/custom-loading";
import { BottomTabInset } from "@/constants/theme";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { useSavedStore } from "@/features/saved/saved-store";
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
    <SafeAreaView edges={["top"]} className="flex-1 bg-diplomatic-surface">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-8">
          <Text className="text-[30px] font-serif font-extrabold tracking-normal text-diplomatic-ink">
            Saved Guides
          </Text>
          <Text className="mt-3 max-w-[310px] text-base font-semibold leading-6 tracking-normal text-diplomatic-secondaryText">
            Your curated collection of European working pathways.
          </Text>

          {isLoading ? (
            <View className="mt-10 items-center rounded-atelier bg-white px-6 py-10">
              <CustomLoading />
              <Text className="mt-4 text-base font-bold tracking-normal text-diplomatic-secondaryText">
                Loading saved guides...
              </Text>
            </View>
          ) : null}

          {!isLoading && error ? (
            <View className="mt-7 rounded-atelier bg-white px-5 py-6">
              <Ionicons name="alert-circle-outline" size={30} color="#BA1A1A" />
              <Text className="mt-4 text-lg font-extrabold tracking-normal text-diplomatic-ink">
                {error}
              </Text>
            </View>
          ) : null}

          {!isLoading && !error && savedItems.length === 0 ? (
            <View className="mt-7 rounded-atelier bg-white px-5 py-7">
              <Ionicons name="bookmark-outline" size={32} color="#1E7AF2" />
              <Text className="mt-4 text-xl font-serif font-extrabold tracking-normal text-diplomatic-ink">
                No saved guides yet
              </Text>
              <Text className="mt-2 text-sm font-semibold leading-5 tracking-normal text-diplomatic-secondaryText">
                Save countries or documents and they will show up here.
              </Text>
            </View>
          ) : null}

          {!isLoading && !error && savedItems.length > 0 ? (
            <View className="mt-7 gap-5">
              {savedItems.map((item) => (
                <SavedGuideCard
                  key={`${item.type}-${item.id}`}
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
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  const exitProgress = useRef(new Animated.Value(0)).current;
  const [isLeaving, setIsLeaving] = useState(false);

  const handleUnsave = () => {
    if (isLeaving || isUpdating) {
      return;
    }

    setIsLeaving(true);
    Animated.timing(exitProgress, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onUnsave();
        return;
      }

      setIsLeaving(false);
    });
  };

  const animatedStyle = {
    opacity: exitProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.15],
    }),
    transform: [
      {
        translateX: exitProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 420],
        }),
      },
      {
        scale: exitProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.98],
        }),
      },
    ],
  };

  return (
    <Animated.View style={animatedStyle}>
      <View className="rounded-atelier bg-white px-5 py-5">
      <View className="flex-row items-start justify-between">
        <View className="min-w-0 flex-1 flex-row items-center">
          {flagEmoji ? (
            <Text className="text-[30px] tracking-normal">{flagEmoji}</Text>
          ) : (
            <View className="h-9 w-9 items-center justify-center rounded-full bg-diplomatic-surfaceHigh">
              <Ionicons
                name={isCountry ? "flag-outline" : "document-text-outline"}
                size={20}
                color="#1E7AF2"
              />
            </View>
          )}
          <View className="ml-3 min-w-0 flex-1">
            <Text className="text-xs font-extrabold uppercase tracking-normal text-diplomatic-primary">
              {label}
            </Text>
            <Text className="mt-1 text-2xl font-serif font-extrabold tracking-normal text-diplomatic-ink">
              {title}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={handleUnsave}
          disabled={isUpdating || isLeaving}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Unsave ${title}`}
          className="h-9 w-9 items-center justify-center rounded-full bg-[#DFF3E6] active:opacity-70 disabled:opacity-60"
        >
          <Ionicons name="bookmark" size={21} color="#183B2B" />
        </Pressable>
      </View>

      {description ? (
        <Text
          numberOfLines={2}
          className="mt-5 text-sm font-semibold leading-5 tracking-normal text-diplomatic-secondaryText"
        >
          {description}
        </Text>
      ) : null}

      <View className="mt-7 flex-row items-center justify-between">
        <View className="min-w-0 flex-1 flex-row items-center">
          <Ionicons name="time-outline" size={16} color="#7C8497" />
          <Text className="ml-2 min-w-0 flex-1 text-sm font-extrabold tracking-normal text-diplomatic-secondaryText">
            {status} - {formatSavedDate(item.createdAt)}
          </Text>
        </View>

        <Pressable
          onPress={onPress}
          className="ml-3 flex-row items-center"
          hitSlop={10}
          accessibilityRole="button"
        >
          <Text className="text-sm font-extrabold tracking-normal text-diplomatic-primary">
            Open
          </Text>
          <Ionicons name="arrow-forward" size={15} color="#0058BC" />
        </Pressable>
      </View>
      </View>
    </Animated.View>
  );
}
