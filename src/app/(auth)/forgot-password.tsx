import { useSignIn } from "@clerk/expo/legacy";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  AuthCard,
  AuthPrimaryButton,
  AuthTextField,
} from "@/features/auth/components/auth-card";
import { getAuthErrorMessage } from "@/features/auth/errors";
import { goBack } from "expo-router/build/global-state/routing";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [hasSentCode, setHasSentCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendResetCode = async () => {
    if (!isLoaded || isSubmitting || !emailAddress.trim()) {
      return;
    }

    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: emailAddress.trim(),
      });

      setHasSentCode(true);
      setNotice("We sent a password reset code to your email.");
    } catch (authError) {
      setError(getAuthErrorMessage(authError, "Unable to send a reset code."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async () => {
    if (!isLoaded || isSubmitting || !resetCode.trim() || !newPassword) {
      return;
    }

    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode.trim(),
        password: newPassword,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
        return;
      }

      if (result.status === "needs_second_factor") {
        setError(
          "This account needs one more verification step before the reset can finish.",
        );
        return;
      }

      setError("Password reset needs another step before it can finish.");
    } catch (authError) {
      setError(
        getAuthErrorMessage(
          authError,
          "Unable to reset password with that code.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title={hasSentCode ? "Check your email" : "Reset password"}
      subtitle={
        hasSentCode
          ? "Enter the code from your email and choose a new password."
          : "Enter your email and we will send a secure reset code."
      }
      error={error}
    >
      {notice ? (
        <View className="rounded-interactive bg-diplomatic-surfaceHigh px-4 py-3">
          <Text className="text-sm font-semibold tracking-normal text-diplomatic-ink">
            {notice}
          </Text>
        </View>
      ) : null}

      <AuthTextField
        label="Email Address"
        icon="mail"
        value={emailAddress}
        onChangeText={setEmailAddress}
        editable={!hasSentCode && !isSubmitting}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="name@example.com"
        textContentType="emailAddress"
      />

      {hasSentCode ? (
        <>
          <AuthTextField
            label="Reset Code"
            icon="code"
            value={resetCode}
            onChangeText={setResetCode}
            autoCapitalize="none"
            autoComplete="one-time-code"
            keyboardType="number-pad"
            placeholder="123456"
            textContentType="oneTimeCode"
          />

          <AuthTextField
            label="New Password"
            icon="lock"
            actionLabel={isPasswordVisible ? "Hide" : "Show"}
            onActionPress={() => setIsPasswordVisible((current) => !current)}
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            placeholder="New password"
            secureTextEntry={!isPasswordVisible}
            textContentType="newPassword"
          />

          <AuthPrimaryButton
            label="Reset Password"
            isLoading={isSubmitting}
            disabled={!resetCode.trim() || !newPassword}
            onPress={resetPassword}
          />

          <Pressable
            onPress={() => {
              setHasSentCode(false);
              setResetCode("");
              setNewPassword("");
              setNotice(null);
              setError(null);
            }}
            disabled={isSubmitting}
            className="items-center"
            hitSlop={10}
          >
            <Text className="text-sm font-bold tracking-normal text-diplomatic-primary">
              Use a different email
            </Text>
          </Pressable>
        </>
      ) : (
        <AuthPrimaryButton
          label="Send Reset Code"
          isLoading={isSubmitting}
          disabled={!emailAddress.trim()}
          onPress={sendResetCode}
        />
      )}

      <Pressable className="items-center" hitSlop={10} onPress={goBack}>
        <Text className="text-sm font-bold tracking-normal text-diplomatic-primary">
          Back to sign in
        </Text>
      </Pressable>
    </AuthCard>
  );
}
