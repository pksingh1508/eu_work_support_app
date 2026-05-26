import Ionicons from "@expo/vector-icons/Ionicons";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomLoading } from "@/components/custom-loading";

type SplashScreenProps = {
  label?: string;
};

export function SplashScreen({
  label = "Loading EU Work Support",
}: SplashScreenProps) {
  return (
    <SafeAreaView
      accessibilityLabel={label}
      className="flex-1 bg-diplomatic-primary"
      edges={["top", "bottom"]}
    >
      <StatusBar style="light" />

      <View className="flex-1 items-center justify-center px-8">
        <View className="h-[104px] w-[104px] items-center justify-center rounded-interactive bg-white shadow-sm">
          <CustomLoading size={72} starCount={12} accessibilityLabel={label} />
        </View>

        <Text className="mt-7 text-center text-[30px] font-serif font-extrabold leading-9 tracking-normal text-white">
          EU Work Support
        </Text>
        <Text className="mt-3 text-center text-base font-medium leading-6 tracking-normal text-[#E8F1FF]">
          Country-wise immigration and work guidance for Europe
        </Text>

        <View className="mt-6 flex-row items-center rounded-interactive bg-[#0F62D6] px-4 py-3">
          <Ionicons name="lock-closed-outline" size={16} color="#DCEBFF" />
          <Text className="ml-2 text-sm font-extrabold tracking-normal text-white">
            Trusted guidance hub
          </Text>
        </View>

        <Text className="mt-7 text-center text-sm font-extrabold tracking-normal text-[#E8F1FF]">
          29 European destinations
        </Text>
      </View>
    </SafeAreaView>
  );
}
