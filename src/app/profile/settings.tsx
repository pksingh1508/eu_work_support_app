import Ionicons from "@expo/vector-icons/Ionicons";
import { useClerk } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { clearCachedAuthSnapshot } from "@/lib/local-storage";

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = async () => {
    clearCachedAuthSnapshot();
    await signOut();
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-diplomatic-surface">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-7"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="h-10 flex-row items-center rounded-interactive border border-[#E0E5EF] bg-white px-4"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={18} color="#0A0F1A" />
            <Text className="ml-2 text-sm font-extrabold tracking-normal text-diplomatic-ink">
              Profile
            </Text>
          </Pressable>

          <Text className="text-[30px] font-extrabold tracking-normal text-diplomatic-ink">
            Settings
          </Text>
        </View>

        <View className="mt-5 gap-3">
          <SettingsRow
            icon="language-outline"
            title="Language"
            subtitle="English"
            onPress={() => undefined}
          />
          <SettingsRow
            icon="notifications-outline"
            title="Notification preferences"
            subtitle="Visa updates and reminders"
            trailing={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#CBD2DF", true: "#1E7AF2" }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            title="Privacy & security"
            subtitle="Password, data, devices"
            onPress={() => undefined}
          />
          <SettingsRow
            icon="document-text-outline"
            title="Terms and conditions"
            subtitle="App policy and service rules"
            onPress={() => undefined}
          />
          <SettingsRow
            icon="help-circle-outline"
            title="Help center"
            subtitle="FAQ, chat, contact support"
            onPress={() => router.push("/profile/help")}
          />
        </View>

        <View className="mt-4 rounded-interactive border border-[#CFE0F7] bg-diplomatic-surfaceHigh px-4 py-4">
          <Text className="text-base font-extrabold tracking-normal text-diplomatic-ink">
            Account safety
          </Text>
          <Text className="mt-2 text-sm font-semibold leading-5 tracking-normal text-diplomatic-secondaryText">
            Your saved guides and billing data are protected with secure account
            access.
          </Text>
        </View>

        <Pressable
          onPress={handleLogout}
          className="mt-4 h-12 flex-row items-center justify-center rounded-interactive border border-[#EF8F8F] bg-white"
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={18} color="#D83B3B" />
          <Text className="ml-2 text-base font-extrabold tracking-normal text-[#D83B3B]">
            Logout
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="min-h-[58px] flex-row items-center rounded-interactive bg-white px-4 py-3"
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={21} color="#1E7AF2" />
      <View className="ml-3 min-w-0 flex-1">
        <Text className="text-base font-extrabold tracking-normal text-diplomatic-ink">
          {title}
        </Text>
        <Text className="mt-1 text-sm font-semibold tracking-normal text-diplomatic-secondaryText">
          {subtitle}
        </Text>
      </View>
      {trailing ?? (
        <Ionicons name="chevron-forward" size={18} color="#8E95A3" />
      )}
    </Pressable>
  );
}
