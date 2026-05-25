import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@clerk/expo";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabInset } from "@/constants/theme";
import {
  fetchSavedItems,
  SavedCountry,
  SavedDocument,
} from "@/lib/saved-items";

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
  const router = useRouter();
  const { userId } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadSavedItems() {
        if (!userId) {
          setSavedItems([]);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const items = await fetchSavedItems(userId);
          const nextSavedItems = [
            ...items.countries.map((country) => ({
              ...country,
              type: "country" as const,
            })),
            ...items.documents.map((document) => ({
              ...document,
              type: "document" as const,
            })),
          ].sort(
            (left, right) =>
              new Date(right.createdAt).getTime() -
              new Date(left.createdAt).getTime(),
          );

          if (isActive) {
            setSavedItems(nextSavedItems);
          }
        } catch (error) {
          console.warn("Unable to load saved items", error);

          if (isActive) {
            setError("Unable to load saved guides right now.");
            setSavedItems([]);
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      void loadSavedItems();

      return () => {
        isActive = false;
      };
    }, [userId]),
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

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-diplomatic-surface">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-8">
          <Text className="text-[30px] font-extrabold tracking-normal text-diplomatic-ink">
            Saved Guides
          </Text>
          <Text className="mt-3 max-w-[310px] text-base font-semibold leading-6 tracking-normal text-diplomatic-secondaryText">
            Your curated collection of European working pathways.
          </Text>

          {isLoading ? (
            <View className="mt-10 items-center rounded-atelier bg-white px-6 py-10">
              <ActivityIndicator color="#0058BC" />
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
              <Text className="mt-4 text-xl font-extrabold tracking-normal text-diplomatic-ink">
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
                  onPress={() => openSavedItem(item)}
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
  onPress,
}: {
  item: SavedItem;
  onPress: () => void;
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
            <Text className="mt-1 text-2xl font-extrabold tracking-normal text-diplomatic-ink">
              {title}
            </Text>
          </View>
        </View>
        <Ionicons name="bookmark" size={22} color="#1E7AF2" />
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
  );
}
