import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  AuthCard,
  AuthPrimaryButton,
  AuthTextField,
} from "@/features/auth/components/auth-card";
import { isEmailProUser } from "@/lib/pro-account";
import { sendWebsitePaymentLink } from "@/lib/send-website-payment-link";
import { showInfoToast } from "@/lib/toast";

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeEmail(value: string) {
  return value.replace(/\s+/g, "").trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string | string[];
    returnTo?: string | string[];
  }>();
  const initialEmail = useMemo(
    () => normalizeEmail(getParamValue(params.email) ?? ""),
    [params.email],
  );
  const returnTo = getParamValue(params.returnTo);
  const [emailAddress, setEmailAddress] = useState(initialEmail);
  const [hasSentLink, setHasSentLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = normalizeEmail(emailAddress);
  const canSubmit = isValidEmail(normalizedEmail);

  const sendVerificationLink = async () => {
    if (isSubmitting || !canSubmit) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const alreadyVerified = await isEmailProUser(normalizedEmail);

      if (alreadyVerified) {
        showInfoToast(
          "You are a verified user",
          "Please login to access the content.",
        );
        openLogin();
        return;
      }

      await sendWebsitePaymentLink(normalizedEmail);
      setHasSentLink(true);
    } catch (verificationError) {
      const message =
        verificationError instanceof Error
          ? verificationError.message
          : "Unable to send verification link right now.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openLogin = () => {
    const href = returnTo
      ? `/sign-in?returnTo=${encodeURIComponent(returnTo)}`
      : "/sign-in";

    router.replace(href as Href);
  };

  return (
    <AuthCard
      headerTitle="Verify Account"
      title={hasSentLink ? "Check your email" : "Verify your account"}
      subtitle={
        hasSentLink
          ? "Open the website link we sent, complete verification, then return to the app."
          : "Enter your email and we will send the website link for account verification."
      }
      error={error}
    >
      {hasSentLink ? (
        <View className="rounded-[18px] bg-[#EEF7FF] px-4 py-4">
          <Text className="text-base font-semibold leading-7 tracking-normal text-[#202124]">
            Hello, we have sent a link to your email. Please check your inbox or
            spam folder, click the link, verify your account, and then log in.
          </Text>
        </View>
      ) : (
        <AuthTextField
          label="Email"
          icon="mail"
          value={emailAddress}
          onChangeText={setEmailAddress}
          editable={!isSubmitting}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="name@example.com"
          textContentType="emailAddress"
        />
      )}

      {hasSentLink ? (
        <AuthPrimaryButton label="Login" onPress={openLogin} />
      ) : (
        <AuthPrimaryButton
          label="Verify"
          isLoading={isSubmitting}
          disabled={!canSubmit}
          onPress={sendVerificationLink}
        />
      )}

      {!hasSentLink ? (
        <Pressable className="items-center" hitSlop={10} onPress={openLogin}>
          <Text className="text-sm font-bold tracking-normal text-diplomatic-primary">
            Already verified? Login
          </Text>
        </Pressable>
      ) : null}
    </AuthCard>
  );
}
