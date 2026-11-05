import { useSignIn } from "@clerk/expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Palette, Type } from "@/constants/theme";
import {
  AuthCard,
  AuthInlineLink,
  AuthPrimaryButton,
  AuthTextField,
} from "@/features/auth/components/auth-card";
import { getAuthErrorMessage } from "@/features/auth/errors";
import { FontFamily } from "@/lib/fonts";
import { haptics } from "@/lib/haptics";
import { isEmailProUser } from "@/lib/pro-account";
import { showInfoToast } from "@/lib/toast";

const CLERK_SIGN_IN_TIMEOUT_MS = 20000;

type SecondFactorMethod = "email_code" | "phone_code";

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

export default function SignInScreen() {
  const { signIn } = useSignIn();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [secondFactorCode, setSecondFactorCode] = useState("");
  const [secondFactorMethod, setSecondFactorMethod] =
    useState<SecondFactorMethod | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestedReturnTo = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  const safeReturnTo =
    requestedReturnTo &&
    requestedReturnTo.startsWith("/") &&
    !requestedReturnTo.startsWith("//") &&
    requestedReturnTo !== "/sign-in"
      ? requestedReturnTo
      : "/";

  const openVerifyPage = (emailOverride?: string) => {
    const email = emailOverride ?? unverifiedEmail ?? emailAddress.trim();
    router.push(
      `/verify?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(
        safeReturnTo,
      )}` as Href,
    );
  };

  const finishSignIn = async () => {
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          setError(
            "This account needs another verification step before login can finish.",
          );
          return;
        }

        const url = decorateUrl(safeReturnTo);

        if (url.startsWith("http")) {
          window.location.href = url;
          return;
        }

        router.replace(url as Href);
      },
    });
  };

  const startSecondFactor = async () => {
    const hasEmailCode = signIn.supportedSecondFactors.some(
      (factor) => factor.strategy === "email_code",
    );
    const hasPhoneCode = signIn.supportedSecondFactors.some(
      (factor) => factor.strategy === "phone_code",
    );

    if (hasEmailCode) {
      const { error: sendError } = await withTimeout(
        signIn.mfa.sendEmailCode(),
        CLERK_SIGN_IN_TIMEOUT_MS,
        "Clerk did not send the verification code. Please try again.",
      );

      if (sendError) {
        setError(
          getAuthErrorMessage(sendError, "Unable to send verification code."),
        );
        return;
      }

      setSecondFactorMethod("email_code");
      setSecondFactorCode("");
      showInfoToast("Check your email", "Enter the code to finish login.");
      return;
    }

    if (hasPhoneCode) {
      const { error: sendError } = await withTimeout(
        signIn.mfa.sendPhoneCode(),
        CLERK_SIGN_IN_TIMEOUT_MS,
        "Clerk did not send the verification code. Please try again.",
      );

      if (sendError) {
        setError(
          getAuthErrorMessage(sendError, "Unable to send verification code."),
        );
        return;
      }

      setSecondFactorMethod("phone_code");
      setSecondFactorCode("");
      showInfoToast("Check your phone", "Enter the code to finish login.");
      return;
    }

    setError(
      "This account needs a second factor that this app does not support yet.",
    );
  };

  const handleSignIn = async () => {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setUnverifiedEmail(null);
    setSecondFactorMethod(null);
    setSecondFactorCode("");

    const normalizedEmail = emailAddress.trim().toLowerCase();
    setIsSubmitting(true);

    try {
      const isVerified = await isEmailProUser(normalizedEmail);

      if (!isVerified) {
        showInfoToast("Access required", "Request access to continue.");
        setUnverifiedEmail(normalizedEmail);
        openVerifyPage(normalizedEmail);
        return;
      }

      const { error: signInError } = await withTimeout(
        signIn.password({
          emailAddress: normalizedEmail,
          password,
        }),
        CLERK_SIGN_IN_TIMEOUT_MS,
        "Clerk did not respond. Check that Native API and email/password login are enabled in Clerk.",
      );

      if (signInError) {
        setError(
          getAuthErrorMessage(
            signInError,
            "Unable to login with those details.",
          ),
        );
        return;
      }

      if (signIn.status === "complete") {
        await finishSignIn();
        return;
      }

      if (
        signIn.status === "needs_client_trust" ||
        signIn.status === "needs_second_factor"
      ) {
        await startSecondFactor();
        return;
      }

      setError(
        "Login could not finish. Please check your credentials and try again.",
      );
    } catch (authError) {
      setError(
        getAuthErrorMessage(authError, "Unable to login with those details."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecondFactor = async () => {
    if (isSubmitting || !secondFactorMethod || !secondFactorCode.trim()) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const { error: verifyError } =
        secondFactorMethod === "email_code"
          ? await withTimeout(
              signIn.mfa.verifyEmailCode({ code: secondFactorCode.trim() }),
              CLERK_SIGN_IN_TIMEOUT_MS,
              "Clerk did not verify the code. Please try again.",
            )
          : await withTimeout(
              signIn.mfa.verifyPhoneCode({ code: secondFactorCode.trim() }),
              CLERK_SIGN_IN_TIMEOUT_MS,
              "Clerk did not verify the code. Please try again.",
            );

      if (verifyError) {
        setError(
          getAuthErrorMessage(verifyError, "Unable to verify that code."),
        );
        return;
      }

      if (signIn.status === "complete") {
        await finishSignIn();
        return;
      }

      setError("That code was accepted, but login still needs another step.");
    } catch (authError) {
      setError(getAuthErrorMessage(authError, "Unable to verify that code."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Login to continue your country research and saved guides."
      error={error}
    >
      {unverifiedEmail ? (
        <InlineNotice
          tone="warning"
          title="Access not granted yet"
          message="Request access with this email and we’ll let you know as soon as it’s approved."
        />
      ) : null}

      <AuthTextField
        label="Email"
        icon="mail"
        value={emailAddress}
        onChangeText={setEmailAddress}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="name@example.com"
        textContentType="emailAddress"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <AuthTextField
        ref={passwordRef}
        label="Password"
        icon="lock"
        actionLabel={isPasswordVisible ? "Hide" : "Show"}
        onActionPress={() => setIsPasswordVisible((current) => !current)}
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoComplete="password"
        placeholder="Your password"
        secureTextEntry={!isPasswordVisible}
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={secondFactorMethod ? undefined : handleSignIn}
      />

      {secondFactorMethod ? (
        <InlineNotice
          message={`Enter the code we sent to your ${
            secondFactorMethod === "email_code" ? "email" : "phone"
          } to finish login.`}
        />
      ) : null}

      {secondFactorMethod ? (
        <AuthTextField
          label="Verification code"
          icon="code"
          value={secondFactorCode}
          onChangeText={setSecondFactorCode}
          autoCapitalize="none"
          autoComplete="one-time-code"
          keyboardType="number-pad"
          placeholder="123456"
          textContentType="oneTimeCode"
        />
      ) : null}

      <View style={styles.optionsRow}>
        <Pressable
          onPress={() => {
            haptics.selection();
            setRememberMe((current) => !current);
          }}
          style={styles.remember}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: rememberMe }}
        >
          <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
            {rememberMe ? <Ionicons name="checkmark" size={14} color={Palette.white} /> : null}
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </Pressable>

        <Link href="/forgot-password" asChild>
          <Pressable hitSlop={10} accessibilityRole="link">
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>
        </Link>
      </View>

      <AuthPrimaryButton
        label={secondFactorMethod ? "Verify & login" : "Login"}
        isLoading={isSubmitting}
        disabled={secondFactorMethod ? !secondFactorCode.trim() : !emailAddress.trim() || !password}
        onPress={secondFactorMethod ? handleSecondFactor : handleSignIn}
      />

      {secondFactorMethod ? (
        <AuthInlineLink text="Didn’t get it?" action="Send a new code" onPress={startSecondFactor} />
      ) : null}

      {unverifiedEmail ? (
        <Button label="Request access" variant="secondary" icon="mail-unread-outline" onPress={() => openVerifyPage()} />
      ) : (
        <AuthInlineLink
          text="Don’t have access yet?"
          action="Request access"
          onPress={() => openVerifyPage(emailAddress.trim())}
        />
      )}
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  remember: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Palette.faint,
    backgroundColor: Palette.card,
  },
  checkboxOn: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primary,
  },
  rememberText: {
    ...Type.callout,
    fontFamily: FontFamily.bodyMedium,
    color: Palette.inkSoft,
  },
  forgot: {
    ...Type.label,
    color: Palette.primary,
  },
});
