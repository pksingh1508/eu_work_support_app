import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "@/lib/supabase";

type EditableProfile = {
  first_name: string | null;
  last_name: string | null;
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
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

      router.back();
    } catch (updateError) {
      console.warn("Unable to update profile", updateError);
      setError("Unable to update your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-diplomatic-surface">
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
              Edit
            </Text>
          </View>

          <View className="mt-6 rounded-interactive bg-white px-4 py-5">
            <Text className="text-2xl font-extrabold tracking-normal text-diplomatic-ink">
              Edit Profile
            </Text>
            <Text className="mt-2 text-sm font-semibold leading-5 tracking-normal text-diplomatic-secondaryText">
              Set your first and last name for your EU Work Support account.
            </Text>

            {error ? (
              <View className="mt-4 rounded-interactive bg-[#FFEDEA] px-4 py-3">
                <Text className="text-sm font-semibold tracking-normal text-[#BA1A1A]">
                  {error}
                </Text>
              </View>
            ) : null}

            {isLoading ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator color="#0058BC" />
                <Text className="mt-3 text-sm font-semibold tracking-normal text-diplomatic-secondaryText">
                  Loading profile...
                </Text>
              </View>
            ) : (
              <View className="mt-5 gap-4">
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
                  className="mt-2 min-h-[52px] flex-row items-center justify-center rounded-interactive bg-diplomatic-primary disabled:opacity-60"
                  accessibilityRole="button"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color="#FFFFFF"
                      />
                      <Text className="ml-2 text-base font-extrabold tracking-normal text-white">
                        Update
                      </Text>
                    </>
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
      <Text className="mb-2 text-base font-extrabold tracking-normal text-diplomatic-ink">
        {label}
      </Text>
      <View className="h-14 flex-row items-center rounded-interactive border border-[#E0E5EF] bg-[#F8FAFD] px-4">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A8AEBA"
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          className="min-w-0 flex-1 text-base font-semibold tracking-normal text-diplomatic-ink"
        />
      </View>
    </View>
  );
}
