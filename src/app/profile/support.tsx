import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const supportEmail = "support@euworksupport.com";

export default function SupportScreen() {
  const router = useRouter();

  const openMail = (subject: string) => {
    void Linking.openURL(
      `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}`,
    );
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#FAFAFB]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-7"
        showsVerticalScrollIndicator={false}
      >
        <Header title="Support" onBack={() => router.back()} />

        <View className="mt-8 gap-3">
          <SupportRow
            icon="mail-outline"
            title="Contact Support"
            onPress={() => openMail("Contact Support")}
          />
          <SupportRow
            icon="alert-circle-outline"
            title="Report a Problem"
            onPress={() => openMail("Report a Problem")}
          />
          <SupportRow
            icon="help-circle-outline"
            title="FAQ"
            onPress={() => router.push("/profile/faq")}
          />
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

function SupportRow({
  icon,
  title,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-[78px] flex-row items-center rounded-[28px] border border-[#EDEDF0] bg-white px-5 active:opacity-80"
      accessibilityRole="button"
    >
      <View className="h-[50px] w-[50px] items-center justify-center rounded-[19px] bg-[#F4F4F5]">
        <Ionicons name={icon} size={24} color="#202124" />
      </View>
      <Text className="ml-5 min-w-0 flex-1 text-xl font-extrabold tracking-normal text-[#202124]">
        {title}
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#202124" />
    </Pressable>
  );
}
