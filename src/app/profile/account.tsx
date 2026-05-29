import Ionicons from "@expo/vector-icons/Ionicons";
import { useClerk } from "@clerk/expo";
import { useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { clearCachedAuthSnapshot } from "@/lib/local-storage";

type AccountRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
  tone?: "default" | "danger";
};

export default function ProfileAccountScreen() {
  return (
    <PremiumGuard>
      <ProfileAccountContent />
    </PremiumGuard>
  );
}

function ProfileAccountContent() {
  const router = useRouter();
  const { signOut } = useClerk();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          clearCachedAuthSnapshot();
          await signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#FAFAFB]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-7"
        showsVerticalScrollIndicator={false}
      >
        <Header title="Account" onBack={() => router.back()} />

        <View className="mt-8 gap-3">
          <AccountRow
            icon="create-outline"
            title="Edit Profile"
            onPress={() => router.push("/profile/edit")}
          />
          <AccountRow
            icon="lock-closed-outline"
            title="Change Password"
            onPress={() => router.push("/profile/change-password")}
          />
          <AccountRow
            icon="log-out-outline"
            title="Sign Out"
            tone="danger"
            onPress={handleSignOut}
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

function AccountRow({ icon, title, onPress, tone = "default" }: AccountRowProps) {
  const isDanger = tone === "danger";

  return (
    <Pressable
      onPress={onPress}
      className="min-h-[78px] flex-row items-center rounded-[28px] border border-[#EDEDF0] bg-white px-5 active:opacity-80"
      accessibilityRole="button"
    >
      <View
        className={`h-[50px] w-[50px] items-center justify-center rounded-[19px] ${
          isDanger ? "bg-[#FFF1F1]" : "bg-[#F4F4F5]"
        }`}
      >
        <Ionicons
          name={icon}
          size={24}
          color={isDanger ? "#D83B3B" : "#202124"}
        />
      </View>
      <Text
        className={`ml-5 min-w-0 flex-1 text-xl font-extrabold tracking-normal ${
          isDanger ? "text-[#D83B3B]" : "text-[#202124]"
        }`}
      >
        {title}
      </Text>
      {!isDanger ? (
        <Ionicons name="chevron-forward" size={20} color="#202124" />
      ) : null}
    </Pressable>
  );
}
