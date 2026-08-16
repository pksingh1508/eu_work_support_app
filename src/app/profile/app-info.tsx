import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const appInfo = [
  ["Version", "1.0.4"],
  ["Developer Name", "EU Work Support"],
];

export default function AppInfoScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#FAFAFB]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-7"
        showsVerticalScrollIndicator={false}
      >
        <Header title="App Info" onBack={() => router.back()} />

        <View className="mt-8 rounded-[30px] border border-[#EDEDF0] bg-white px-5 py-2">
          {appInfo.map(([label, value], index) => (
            <View
              key={label}
              className={`min-h-[70px] flex-row items-center ${
                index === appInfo.length - 1 ? "" : "border-b border-[#EAEAED]"
              }`}
            >
              <Text className="min-w-0 flex-1 text-lg font-extrabold tracking-normal text-[#202124]">
                {label}
              </Text>
              <Text className="text-base font-bold tracking-normal text-[#707684]">
                {value}
              </Text>
            </View>
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
