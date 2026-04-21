import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabInset } from "@/constants/theme";

const savedGuides = [
  {
    country: "France",
    flag: "🇫🇷",
    title: "Passport Talent (Tech Visa)",
    description:
      "Ideal for highly skilled workers, founders, and investors. Fast-track residency with clear eligibility.",
    status: "Updated 2d ago",
    action: "View Guide",
    slug: "france",
  },
  {
    country: "Netherlands",
    flag: "🇳🇱",
    title: "Highly Educated Migrant",
    description:
      "One-year orientation year visa for recent top-tier university graduates to find work.",
    status: "Action Needed",
    action: "Continue",
    slug: "netherlands",
    needsAction: true,
  },
  {
    country: "Germany",
    flag: "🇩🇪",
    title: "EU Blue Card",
    description:
      "Streamlined process for university graduates with a binding job offer in a shortage role.",
    status: "Updated 4w ago",
    action: "View Guide",
    slug: "germany",
  },
] satisfies {
  country: string;
  flag: string;
  title: string;
  description: string;
  status: string;
  action: string;
  slug: string;
  needsAction?: boolean;
}[];

export default function SavedScreen() {
  const router = useRouter();

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

          <View className="mt-7 gap-5">
            {savedGuides.map((guide) => (
              <SavedGuideCard
                key={`${guide.country}-${guide.title}`}
                guide={guide}
                onPress={() =>
                  router.push({
                    pathname: "/country/[slug]",
                    params: { slug: guide.slug },
                  })
                }
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SavedGuideCard({
  guide,
  onPress,
}: {
  guide: (typeof savedGuides)[number];
  onPress: () => void;
}) {
  return (
    <View className="rounded-atelier bg-white px-5 py-5">
      <View className="flex-row items-start justify-between">
        <View className="min-w-0 flex-1 flex-row items-center">
          <Text className="text-[30px] tracking-normal">{guide.flag}</Text>
          <Text className="ml-3 min-w-0 flex-1 text-2xl font-extrabold tracking-normal text-diplomatic-ink">
            {guide.country}
          </Text>
        </View>
        <Ionicons name="bookmark" size={22} color="#1E7AF2" />
      </View>

      <Text className="mt-6 text-base font-extrabold tracking-normal text-diplomatic-ink">
        {guide.title}
      </Text>
      <Text
        numberOfLines={2}
        className="mt-2 text-sm font-semibold leading-5 tracking-normal text-diplomatic-secondaryText"
      >
        {guide.description}
      </Text>

      <View className="mt-7 flex-row items-center justify-between">
        <View className="min-w-0 flex-1 flex-row items-center">
          <Ionicons
            name={guide.needsAction ? "alert-circle" : "time-outline"}
            size={16}
            color={guide.needsAction ? "#D74A1F" : "#7C8497"}
          />
          <Text
            className={`ml-2 min-w-0 flex-1 text-sm font-extrabold tracking-normal ${
              guide.needsAction
                ? "text-diplomatic-tertiary"
                : "text-diplomatic-secondaryText"
            }`}
          >
            {guide.status}
          </Text>
        </View>

        <Pressable
          onPress={onPress}
          className="ml-3 flex-row items-center"
          hitSlop={10}
          accessibilityRole="button"
        >
          <Text className="text-sm font-extrabold tracking-normal text-diplomatic-primary">
            {guide.action}
          </Text>
          <Ionicons name="arrow-forward" size={15} color="#0058BC" />
        </Pressable>
      </View>
    </View>
  );
}
