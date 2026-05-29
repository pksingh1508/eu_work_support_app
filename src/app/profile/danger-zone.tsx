import Ionicons from "@expo/vector-icons/Ionicons";
import { useClerk, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomLoading } from "@/components/custom-loading";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { clearCachedAuthSnapshot } from "@/lib/local-storage";

type DeletableUser = {
  delete: () => Promise<unknown>;
};

export default function DangerZoneScreen() {
  return (
    <PremiumGuard>
      <DangerZoneContent />
    </PremiumGuard>
  );
}

function DangerZoneContent() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action permanently deletes your account. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const deletableUser = user as unknown as DeletableUser | null;

            if (!deletableUser?.delete) {
              Alert.alert(
                "Unable to delete account",
                "Please contact support to delete this account.",
              );
              return;
            }

            setIsDeleting(true);

            try {
              await deletableUser.delete();
              clearCachedAuthSnapshot();
              await signOut();
            } catch (error) {
              console.warn("Unable to delete account", error);
              Alert.alert(
                "Unable to delete account",
                "Please try again or contact support.",
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#FAFAFB]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-7"
        showsVerticalScrollIndicator={false}
      >
        <Header title="Danger Zone" onBack={() => router.back()} />

        <View className="mt-8 rounded-[30px] border border-[#F4C8C8] bg-white px-5 py-6">
          <Text className="text-xl font-extrabold tracking-normal text-[#D83B3B]">
            Delete Account
          </Text>
          <Text className="mt-2 text-sm font-semibold leading-5 tracking-normal text-[#707684]">
            Permanently remove your account and sign out of EU Work Support.
          </Text>

          <Pressable
            onPress={deleteAccount}
            disabled={isDeleting}
            className="mt-6 h-14 flex-row items-center justify-center rounded-[22px] bg-[#D83B3B] disabled:opacity-60"
            accessibilityRole="button"
          >
            {isDeleting ? (
              <CustomLoading size={28} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={19} color="#FFFFFF" />
                <Text className="ml-2 text-base font-extrabold tracking-normal text-white">
                  Delete Account
                </Text>
              </>
            )}
          </Pressable>
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
      <Text className="text-[25px] font-extrabold tracking-normal text-[#202124]">
        {title}
      </Text>
      <View className="h-11 w-11" />
    </View>
  );
}
