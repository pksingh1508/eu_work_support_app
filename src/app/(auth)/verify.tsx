import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { InlineNotice } from "@/components/ui/inline-notice";
import {
  AuthCard,
  AuthInlineLink,
  AuthPrimaryButton,
  AuthTextField,
} from "@/features/auth/components/auth-card";
import { isEmailProUser } from "@/lib/pro-account";
import { sendWebsitePaymentLink } from "@/lib/send-email";
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
        showInfoToast("You already have access", "Login to continue.");
        openLogin();
        return;
      }

      await sendWebsitePaymentLink(normalizedEmail);
      setHasSentLink(true);
    } catch (verificationError) {
      const message =
        verificationError instanceof Error
          ? verificationError.message
          : "Unable to send email right now.";
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
      headerTitle="Request access"
      title={hasSentLink ? "Check your inbox" : "Request access"}
      subtitle={
        hasSentLink
          ? `We’ve sent an email to ${normalizedEmail}.`
          : "Enter your email and we’ll send you a link to unlock EU Work Support."
      }
      error={error}
    >
      {hasSentLink ? (
        <InlineNotice
          tone="success"
          title="Email sent"
          message="Open the email and follow the link to request access. Once approved, come back and login."
        />
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
          returnKeyType="send"
          onSubmitEditing={sendVerificationLink}
        />
      )}

      {hasSentLink ? (
        <AuthPrimaryButton label="Go to login" onPress={openLogin} />
      ) : (
        <AuthPrimaryButton
          label="Request access"
          isLoading={isSubmitting}
          disabled={!canSubmit}
          onPress={sendVerificationLink}
        />
      )}

      {!hasSentLink ? (
        <AuthInlineLink text="Already have access?" action="Login" onPress={openLogin} />
      ) : (
        <AuthInlineLink
          text="Wrong email?"
          action="Try again"
          onPress={() => setHasSentLink(false)}
        />
      )}
    </AuthCard>
  );
}
