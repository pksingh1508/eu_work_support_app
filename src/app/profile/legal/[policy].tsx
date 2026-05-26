import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { dataDeletion } from "@/constants/dataDeletion";
import { openSource } from "@/constants/openSource";
import { privacyPolicy } from "@/constants/privacyPolicy";
import { termsAndCondition } from "@/constants/terms&condition";

const policies = {
  "privacy-policy": privacyPolicy,
  "terms-and-conditions": termsAndCondition,
  "data-deletion": dataDeletion,
  "open-source": openSource,
} as const;

type PolicyKey = keyof typeof policies;
type PolicyBlock = (typeof policies)[PolicyKey]["blocks"][number];

function isPolicyKey(value: string): value is PolicyKey {
  return value in policies;
}

export default function PolicyDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ policy?: string }>();
  const policyKey = params.policy && isPolicyKey(params.policy)
    ? params.policy
    : "privacy-policy";
  const policy = policies[policyKey];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#FAFAFB]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-7"
        showsVerticalScrollIndicator={false}
      >
        <Header title="Legal" onBack={() => router.back()} />

        <View className="mt-8 rounded-[30px] border border-[#EDEDF0] bg-white px-5 py-6">
          <Text className="text-[26px] font-extrabold leading-8 tracking-normal text-[#202124]">
            {policy.title}
          </Text>
          <Text className="mt-2 text-sm font-bold tracking-normal text-[#707684]">
            Last updated: {policy.lastUpdated}
          </Text>

          <View className="mt-6">
            {policy.blocks.map((block, index) => (
              <PolicyBlockRenderer
                key={`${block.type}-${index}`}
                block={block}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Pressable
        onPress={onBack}
        className="h-11 w-11 items-center justify-center rounded-full border border-[#E6E6EA] bg-white"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-back" size={21} color="#202124" />
      </Pressable>
      <Text className="text-[28px] font-extrabold tracking-normal text-[#202124]">
        {title}
      </Text>
      <View className="h-11 w-11" />
    </View>
  );
}

function PolicyBlockRenderer({ block }: { block: PolicyBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <Text className="mb-3 mt-6 text-xl font-extrabold tracking-normal text-[#202124]">
          {block.text}
        </Text>
      );
    case "subheading":
      return (
        <Text className="mb-2 mt-4 text-base font-extrabold tracking-normal text-[#202124]">
          {block.text}
        </Text>
      );
    case "paragraph":
      return (
        <Text className="mb-4 text-base font-semibold leading-7 tracking-normal text-[#5F6673]">
          {block.text}
        </Text>
      );
    case "bullets":
      return (
        <View className="mb-4 gap-2">
          {block.items.map((item) => (
            <View key={item} className="flex-row items-start">
              <Text className="mr-2 mt-[2px] text-base font-extrabold text-[#202124]">
                •
              </Text>
              <Text className="min-w-0 flex-1 text-base font-semibold leading-7 tracking-normal text-[#5F6673]">
                {item}
              </Text>
            </View>
          ))}
        </View>
      );
    case "table":
      return (
        <View className="mb-4 mt-2 overflow-hidden rounded-[18px] border border-[#EAEAED]">
          <View className="flex-row bg-[#F4F4F5] px-3 py-3">
            {block.headers.map((header) => (
              <Text
                key={header}
                className="flex-1 text-xs font-extrabold tracking-normal text-[#202124]"
              >
                {header}
              </Text>
            ))}
          </View>
          {block.rows.map((row, rowIndex) => (
            <View
              key={`${row[0]}-${rowIndex}`}
              className={`flex-row px-3 py-3 ${
                rowIndex === block.rows.length - 1
                  ? ""
                  : "border-b border-[#EAEAED]"
              }`}
            >
              {row.map((cell, cellIndex) => (
                <Text
                  key={`${row[0]}-${cellIndex}`}
                  className="flex-1 pr-2 text-[11px] font-semibold leading-4 tracking-normal text-[#5F6673]"
                >
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
    default:
      return null;
  }
}
