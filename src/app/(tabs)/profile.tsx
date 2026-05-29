import Ionicons from "@expo/vector-icons/Ionicons";
import { useUser } from "@clerk/expo";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabInset } from "@/constants/theme";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { supabase } from "@/lib/supabase";

type AppUserProfile = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  image_url: string | null;
};

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
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const email = profile?.email ?? user?.primaryEmailAddress?.emailAddress ?? "";
  const databaseName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const fullName =
    databaseName || user?.fullName || user?.firstName || "Welcome";
  const initials = databaseName
    ? `${profile?.first_name?.trim().charAt(0) ?? ""}${
        profile?.last_name?.trim().charAt(0) ??
        profile?.first_name?.trim().charAt(1) ??
        ""
      }`.toUpperCase()
    : fullName.trim().charAt(0).toUpperCase();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadProfile() {
        if (!user?.id) {
          setProfile(null);
          return;
        }

        try {
          await supabase.rpc("ensure_user_profile");

          const { data, error } = await supabase
            .from("app_users")
            .select("first_name, last_name, email, image_url")
            .eq("clerk_user_id", user.id)
            .maybeSingle();

          if (error) {
            throw error;
          }

          if (isActive) {
            setProfile((data as AppUserProfile | null) ?? null);
          }
        } catch (error) {
          console.warn("Unable to load profile details", error);
        }
      }

      void loadProfile();

      return () => {
        isActive = false;
      };
    }, [user?.id]),
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
              <ProfileAvatar initials={initials} imageUrl={profile?.image_url} />

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

function ProfileAvatar({
  initials,
  imageUrl,
}: {
  initials: string;
  imageUrl?: string | null;
}) {
  if (initials) {
    return (
      <View className="h-[86px] w-[86px] items-center justify-center rounded-full bg-[#C9C9CC]">
        <Text className="text-[28px] font-extrabold tracking-normal text-white">
          {initials}
        </Text>
      </View>
    );
  }

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        className="h-[86px] w-[86px] rounded-full bg-[#C9C9CC]"
        contentFit="cover"
        transition={180}
      />
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
