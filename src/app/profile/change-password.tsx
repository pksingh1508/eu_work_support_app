import Ionicons from "@expo/vector-icons/Ionicons";
import { useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
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
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { getAuthErrorMessage } from "@/features/auth/errors";

type PasswordUser = {
  updatePassword: (params: {
    currentPassword: string;
    newPassword: string;
    signOutOfOtherSessions?: boolean;
  }) => Promise<unknown>;
};

export default function ChangePasswordScreen() {
  return (
    <PremiumGuard>
      <ChangePasswordContent />
    </PremiumGuard>
  );
}

function ChangePasswordContent() {
  const router = useRouter();
  const { user } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePassword = async () => {
    if (isSubmitting) {
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    const passwordUser = user as unknown as PasswordUser | null;

    if (!passwordUser?.updatePassword) {
      setError("Unable to update password for this account.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await passwordUser.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions: true,
      });

      Alert.alert("Password Updated", "Your password has been changed.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (authError) {
      setError(
        getAuthErrorMessage(authError, "Unable to change your password."),
      );
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
          <Header title="Change Password" onBack={() => router.back()} />

          <View className="mt-8 rounded-[30px] border border-[#EDEDF0] bg-white px-5 py-6">
            <Text className="text-xl font-extrabold tracking-normal text-[#202124]">
              Update your password
            </Text>
            <Text className="mt-2 text-sm font-semibold leading-5 tracking-normal text-[#707684]">
              Enter your current password and choose a new secure password.
            </Text>

            {error ? (
              <View className="mt-5 rounded-[18px] bg-[#FFF1F1] px-4 py-3">
                <Text className="text-sm font-semibold tracking-normal text-[#D83B3B]">
                  {error}
                </Text>
              </View>
            ) : null}

            <View className="mt-6 gap-4">
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                textContentType="password"
              />
              <PasswordField
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                textContentType="newPassword"
              />
              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                textContentType="newPassword"
              />

              <Pressable
                onPress={updatePassword}
                disabled={isSubmitting}
                className="mt-2 h-14 items-center justify-center rounded-[22px] bg-diplomatic-primary disabled:opacity-60"
                accessibilityRole="button"
              >
                {isSubmitting ? (
                  <CustomLoading size={28} />
                ) : (
                  <Text className="text-base font-extrabold tracking-normal text-white">
                    Change Password
                  </Text>
                )}
              </Pressable>
            </View>
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
      <Text className="text-[25px] font-extrabold tracking-normal text-[#202124]">
        {title}
      </Text>
      <View className="h-11 w-11" />
    </View>
  );
}

function PasswordField({
  label,
  value,
  onChangeText,
  textContentType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  textContentType: "password" | "newPassword";
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
          secureTextEntry
          autoCapitalize="none"
          autoComplete={
            textContentType === "password" ? "current-password" : "new-password"
          }
          textContentType={textContentType}
          placeholder={label}
          placeholderTextColor="#A1A6B1"
          className="min-w-0 flex-1 text-base font-semibold tracking-normal text-[#202124]"
        />
      </View>
    </View>
  );
}
