import Ionicons from "@expo/vector-icons/Ionicons";
import { useUser } from "@clerk/expo";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabInset } from "@/constants/theme";
import { useAuthAccess } from "@/features/auth/access";
import { PremiumGuard } from "@/features/auth/components/premium-guard";

type MenuRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: "default" | "danger";
};

export default function ProfileScreen() {
  return (
    <PremiumGuard>
      <ProfileContent />
    </PremiumGuard>
  );
}

function ProfileContent() {
  const router = useRouter();
  const { user } = useUser();
  const { profile, refreshProfile } = useAuthAccess();
  const email = profile?.email ?? user?.primaryEmailAddress?.emailAddress ?? "";
  const databaseName = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const fullName =
    databaseName || user?.fullName || user?.firstName || "Welcome";
  const initials = getInitials(fullName);

  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
    }, [refreshProfile]),
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#FAFAFB]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: BottomTabInset + 26 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-7">
          <Text className="text-center text-[30px] font-serif font-extrabold tracking-normal text-[#202124]">
            Profile
          </Text>

          <View className="mt-6 rounded-[34px] border border-[#E8E8EC] bg-white px-5 py-6">
            <View className="flex-row items-center">
              <ProfileAvatar initials={initials} />

              <View className="ml-5 min-w-0 flex-1">
                <Text className="text-[24px] font-extrabold leading-8 tracking-normal text-[#202124]">
                  {fullName}
                </Text>
                {email ? (
                  <Text
                    className="mt-2 text-sm font-semibold leading-5 tracking-normal text-[#707684]"
                    numberOfLines={2}
                  >
                    {email}
                  </Text>
                ) : (
                  <Text className="mt-2 text-sm font-semibold tracking-normal text-[#707684]">
                    Email
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View className="mt-10 gap-3">
            <ProfileMenuRow
              icon="person-circle-outline"
              label="Account"
              onPress={() => router.push("/profile/account")}
            />
            <ProfileMenuRow
              icon="document-text-outline"
              label="Legal"
              onPress={() => router.push("/profile/legal")}
            />
            <ProfileMenuRow
              icon="help-circle-outline"
              label="Support"
              onPress={() => router.push("/profile/support")}
            />
            <ProfileMenuRow
              icon="trash-outline"
              label="Danger Zone"
              tone="danger"
              onPress={() => router.push("/profile/danger-zone")}
            />
            <ProfileMenuRow
              icon="information-circle-outline"
              label="App Info"
              onPress={() => router.push("/profile/app-info")}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const [firstName = "", lastName = ""] = parts;
  const fallbackSecondLetter = firstName.charAt(1);

  return `${firstName.charAt(0)}${
    lastName.charAt(0) || fallbackSecondLetter
  }`.toUpperCase();
}

function ProfileAvatar({ initials }: { initials: string }) {
  if (initials) {
    return (
      <View className="h-[86px] w-[86px] items-center justify-center rounded-full bg-[#C9C9CC]">
        <Text className="text-[28px] font-extrabold tracking-normal text-white">
          {initials}
        </Text>
      </View>
    );
  }

  return (
    <View className="h-[86px] w-[86px] items-center justify-center rounded-full bg-[#C9C9CC]">
      <View className="h-8 w-8 rounded-full bg-white" />
      <View className="mt-2 h-5 w-12 rounded-t-full bg-white" />
    </View>
  );
}

function ProfileMenuRow({ icon, label, onPress, tone = "default" }: MenuRowProps) {
  const isDanger = tone === "danger";

  return (
    <Pressable
      onPress={onPress}
      className="min-h-[82px] flex-row items-center rounded-[28px] border border-[#EDEDF0] bg-white px-5 active:opacity-80"
      accessibilityRole="button"
    >
      <View
        className={`h-[52px] w-[52px] items-center justify-center rounded-[20px] ${
          isDanger ? "bg-[#FFF1F1]" : "bg-[#F4F4F5]"
        }`}
      >
        <Ionicons
          name={icon}
          size={25}
          color={isDanger ? "#D83B3B" : "#202124"}
        />
      </View>
      <Text
        className={`ml-5 min-w-0 flex-1 text-xl font-extrabold tracking-normal ${
          isDanger ? "text-[#D83B3B]" : "text-[#202124]"
        }`}
      >
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#202124" />
    </Pressable>
  );
}
