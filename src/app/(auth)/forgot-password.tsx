import { useSignIn } from "@clerk/expo/legacy";
import { useRouter } from "expo-router";
import { useState } from "react";
import { InlineNotice } from "@/components/ui/inline-notice";
import {
  AuthCard,
  AuthInlineLink,
  AuthPrimaryButton,
  AuthTextField,
} from "@/features/auth/components/auth-card";
import { getAuthErrorMessage } from "@/features/auth/errors";

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
      headerTitle="Reset password"
      title={hasSentCode ? "Check your email" : "Forgot password?"}
      subtitle={
        hasSentCode
          ? "Enter the code from your email and choose a new password."
          : "Enter your email and we’ll send you a secure reset code."
      }
      error={error}
    >
      {notice ? <InlineNotice tone="success" message={notice} /> : null}

      <AuthTextField
        label="Email"
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
            label="Reset code"
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
            label="New password"
            icon="lock"
            actionLabel={isPasswordVisible ? "Hide" : "Show"}
            onActionPress={() => setIsPasswordVisible((current) => !current)}
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            secureTextEntry={!isPasswordVisible}
            textContentType="newPassword"
          />

          <AuthPrimaryButton
            label="Reset password"
            isLoading={isSubmitting}
            disabled={!resetCode.trim() || !newPassword}
            onPress={resetPassword}
          />

          <AuthInlineLink
            text=""
            action="Use a different email"
            onPress={() => {
              if (isSubmitting) {
                return;
              }
              setHasSentCode(false);
              setResetCode("");
              setNewPassword("");
              setNotice(null);
              setError(null);
            }}
          />
        </>
      ) : (
        <AuthPrimaryButton
          label="Send reset code"
          isLoading={isSubmitting}
          disabled={!emailAddress.trim()}
          onPress={sendResetCode}
        />
      )}

      <AuthInlineLink
        text="Remembered it?"
        action="Back to login"
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/sign-in"))}
      />
    </AuthCard>
  );
}
