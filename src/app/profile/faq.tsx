import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { FAQs, type FAQItem } from "@/constants/FAQ";

export default function FAQScreen() {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(FAQs[0]?.id ?? null);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#FAFAFB]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-7"
        showsVerticalScrollIndicator={false}
      >
        <Header title="FAQ" onBack={() => router.back()} />

        <View className="mt-8">
          <Text className="text-[28px] font-serif font-extrabold tracking-normal text-[#202124]">
            Common questions
          </Text>
          <Text className="mt-3 text-base font-semibold leading-6 tracking-normal text-[#707684]">
            Quick answers for using EU Work Support and managing your guides.
          </Text>
        </View>

        <View className="mt-7 gap-3">
          {FAQs.map((item) => (
            <FAQAccordionItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onPress={() =>
                setOpenId((currentId) =>
                  currentId === item.id ? null : item.id,
                )
              }
            />
          ))}
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

function FAQAccordionItem({
  item,
  isOpen,
  onPress,
}: {
  item: FAQItem;
  isOpen: boolean;
  onPress: () => void;
}) {
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: withTiming(isOpen ? "180deg" : "0deg", { duration: 180 }),
      },
    ],
  }));

  return (
    <Animated.View
      layout={LinearTransition.duration(180)}
      className="overflow-hidden rounded-[24px] border border-[#EDEDF0] bg-white"
    >
      <Pressable
        onPress={onPress}
        className="min-h-[74px] flex-row items-center px-5 py-4 active:opacity-80"
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
      >
        <View className="mr-4 h-10 w-10 items-center justify-center rounded-[16px] bg-[#F4F4F5]">
          <Ionicons name="help-circle-outline" size={21} color="#202124" />
        </View>
        <Text className="min-w-0 flex-1 text-base font-extrabold leading-6 tracking-normal text-[#202124]">
          {item.question}
        </Text>
        <Animated.View
          style={chevronStyle}
          className="ml-3 h-8 w-8 items-center justify-center rounded-full bg-[#FAFAFB]"
        >
          <Ionicons name="chevron-down" size={18} color="#202124" />
        </Animated.View>
      </Pressable>

      {isOpen ? (
        <Animated.View
          entering={FadeInDown.duration(180)}
          exiting={FadeOutUp.duration(140)}
          className="px-5 pb-5"
        >
          <View className="border-t border-[#EFEFF2] pt-4">
            <Text className="text-[15px] font-semibold leading-6 tracking-normal text-[#707684]">
              {item.answer}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}
