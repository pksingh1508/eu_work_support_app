import Ionicons from "@expo/vector-icons/Ionicons";
import { useUser } from "@clerk/expo";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabInset } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

type AppUserProfile = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

function getInitials(name: string, email: string) {
  const source = name || email;
  const parts = source
    .replace(/@.*$/, "")
    .split(/\s|\.|_/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "EU";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const email = profile?.email ?? user?.primaryEmailAddress?.emailAddress ?? "";
  const databaseName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const fullName = databaseName || "No Name Set";
  const initials = getInitials(databaseName, email);

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
            .select("first_name, last_name, email")
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
    <SafeAreaView edges={["top"]} className="flex-1 bg-diplomatic-surface">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: BottomTabInset + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-7">
          <View className="flex-row items-center justify-between">
            <Text className="text-[30px] font-extrabold tracking-normal text-diplomatic-ink">
              Profile
            </Text>
            <Pressable
              onPress={() => router.push("/profile/settings")}
              className="h-10 w-10 items-center justify-center rounded-interactive border border-[#E0E5EF] bg-white"
              accessibilityRole="button"
            >
              <Ionicons name="settings-outline" size={20} color="#0A0F1A" />
            </Pressable>
          </View>

          <View className="mt-5 items-center rounded-interactive bg-white px-4 py-5">
            <View className="h-[74px] w-[74px] items-center justify-center rounded-interactive bg-[#0B1019]">
              <Text className="text-[22px] font-extrabold tracking-normal text-white">
                {initials}
              </Text>
            </View>
            <Text className="mt-4 text-2xl font-extrabold tracking-normal text-diplomatic-ink">
              {fullName}
            </Text>
            {email ? (
              <Text className="mt-1 text-sm font-semibold tracking-normal text-diplomatic-secondaryText">
                {email}
              </Text>
            ) : null}

            <Pressable
              onPress={() => router.push("/profile/edit")}
              className="mt-4 h-11 w-full flex-row items-center justify-center rounded-interactive bg-diplomatic-primary"
              accessibilityRole="button"
            >
              <Ionicons name="help-circle-outline" size={16} color="#FFFFFF" />
              <Text className="ml-2 text-base font-extrabold tracking-normal text-white">
                Edit Profile
              </Text>
            </Pressable>
          </View>

          <View className="mt-4 flex-row gap-3">
            <MetricCard value="29" label="Countries" />
            <MetricCard value="21" label="Saved" />
            <MetricCard value="Pro" label="Plan" isPrimary />
          </View>

          <View className="mt-4 flex-row items-center rounded-interactive bg-[#0B1019] px-4 py-4">
            <Ionicons
              name="checkmark-circle-outline"
              size={26}
              color="#FFFFFF"
            />
            <View className="ml-3 min-w-0 flex-1">
              <Text className="text-base font-extrabold tracking-normal text-white">
                Premium active
              </Text>
              <Text className="mt-1 text-sm font-semibold tracking-normal text-white opacity-70">
                Renews on 14 May 2026
              </Text>
            </View>
            <Pressable hitSlop={10}>
              <Text className="text-sm font-extrabold tracking-normal text-white">
                Manage
              </Text>
            </Pressable>
          </View>

          <View className="mt-4 gap-3">
            <ProfileMenuRow
              icon="bookmark-outline"
              label="Saved items"
              onPress={() => router.push("/profile/saved-items")}
            />
            <ProfileMenuRow
              icon="help-circle-outline"
              label="Support and help"
              onPress={() => router.push("/profile/help")}
            />
            <ProfileMenuRow
              icon="notifications-outline"
              label="Notifications"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  value,
  label,
  isPrimary,
}: {
  value: string;
  label: string;
  isPrimary?: boolean;
}) {
  return (
    <View className="min-h-[60px] flex-1 justify-center rounded-interactive bg-white px-3">
      <Text
        className={`text-xl font-extrabold tracking-normal ${
          isPrimary ? "text-diplomatic-primary" : "text-diplomatic-ink"
        }`}
      >
        {value}
      </Text>
      <Text className="mt-1 text-xs font-extrabold tracking-normal text-diplomatic-secondaryText">
        {label}
      </Text>
    </View>
  );
}

function ProfileMenuRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="min-h-[54px] flex-row items-center rounded-interactive bg-white px-4"
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={21} color="#1E7AF2" />
      <Text className="ml-3 min-w-0 flex-1 text-base font-extrabold tracking-normal text-diplomatic-ink">
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#8E95A3" />
    </Pressable>
  );
}
