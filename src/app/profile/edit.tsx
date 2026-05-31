import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CustomLoading } from "@/components/custom-loading";
import { useAuthAccess } from "@/features/auth/access";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { supabase } from "@/lib/supabase";

type EditableProfile = {
  first_name: string | null;
  last_name: string | null;
};

export default function EditProfileScreen() {
  return (
    <PremiumGuard>
      <EditProfileContent />
    </PremiumGuard>
  );
}

function EditProfileContent() {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const { refreshProfile } = useAuthAccess();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      if (!userId) {
        setIsLoading(false);
        setError("Unable to load your account.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await supabase.rpc("ensure_user_profile");

        const { data, error: profileError } = await supabase
          .from("app_users")
          .select("first_name, last_name")
          .eq("clerk_user_id", userId)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        const profile = data as EditableProfile | null;

        if (isActive) {
          setFirstName(profile?.first_name ?? "");
          setLastName(profile?.last_name ?? "");
        }
      } catch (loadError) {
        console.warn("Unable to load editable profile", loadError);

        if (isActive) {
          setError("Unable to load your profile details.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, [userId]);

  const updateProfile = async () => {
    if (!userId || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const nextFirstName = firstName.trim() || null;
    const nextLastName = lastName.trim() || null;

    try {
      await supabase.rpc("ensure_user_profile");

      const { error: updateError } = await supabase
        .from("app_users")
        .update({
          first_name: nextFirstName,
          last_name: nextLastName,
          email: user?.primaryEmailAddress?.emailAddress ?? null,
        })
        .eq("clerk_user_id", userId);

      if (updateError) {
        throw updateError;
      }

      await refreshProfile();
      router.back();
    } catch (updateError) {
      console.warn("Unable to update profile", updateError);
      setError("Unable to update your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#FAFAFB]">
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", default: undefined })}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          className="flex-1"
          contentContainerClassName="px-5 pb-10 pt-7"
          showsVerticalScrollIndicator={false}
        >
          <Header title="Edit Profile" onBack={() => router.back()} />

          <View className="mt-8 rounded-[30px] border border-[#EDEDF0] bg-white px-5 py-6">
            <Text className="text-xl font-extrabold tracking-normal text-[#202124]">
              Update your profile
            </Text>
            <Text className="mt-2 text-base font-semibold leading-7 tracking-normal text-[#707684]">
              Set your first and last name for your EU Work Support account.
            </Text>

            {error ? (
              <View className="mt-5 rounded-[18px] bg-[#FFF1F1] px-4 py-3">
                <Text className="text-sm font-semibold tracking-normal text-[#D83B3B]">
                  {error}
                </Text>
              </View>
            ) : null}

            {isLoading ? (
              <View className="items-center justify-center py-12">
                <CustomLoading />
                <Text className="mt-3 text-sm font-semibold tracking-normal text-[#707684]">
                  Loading profile...
                </Text>
              </View>
            ) : (
              <View className="mt-6 gap-4">
                <ProfileTextField
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                  autoComplete="given-name"
                  textContentType="givenName"
                />
                <ProfileTextField
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                  autoComplete="family-name"
                  textContentType="familyName"
                />

                <Pressable
                  onPress={updateProfile}
                  disabled={isSubmitting}
                  className="mt-2 h-14 items-center justify-center rounded-[22px] bg-diplomatic-primary disabled:opacity-60"
                  accessibilityRole="button"
                >
                  {isSubmitting ? (
                    <CustomLoading size={28} />
                  ) : (
                    <Text className="text-base font-extrabold tracking-normal text-white">
                      Update Profile
                    </Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

function ProfileTextField({
  label,
  value,
  onChangeText,
  placeholder,
  autoComplete,
  textContentType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoComplete: "given-name" | "family-name";
  textContentType: "givenName" | "familyName";
}) {
  return (
    <View>
      <Text className="mb-2 text-sm font-extrabold tracking-normal text-[#202124]">
        {label}
      </Text>
      <View className="h-14 flex-row items-center rounded-[20px] border border-[#E2E2E6] bg-[#FAFAFB] px-4">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A1A6B1"
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          className="min-w-0 flex-1 text-base font-semibold tracking-normal text-[#202124]"
        />
      </View>
    </View>
  );
}
