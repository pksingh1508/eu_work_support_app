import { useSignIn } from "@clerk/expo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import {
  AuthCard,
  AuthPrimaryButton,
  AuthTextField,
} from "@/features/auth/components/auth-card";
import { getAuthErrorMessage } from "@/features/auth/errors";
import { isEmailProUser } from "@/lib/pro-account";
import { showInfoToast } from "@/lib/toast";

const CLERK_SIGN_IN_TIMEOUT_MS = 20000;

type SecondFactorMethod = "email_code" | "phone_code";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
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
        setError(getAuthErrorMessage(sendError, "Unable to send verification code."));
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
        setError(getAuthErrorMessage(sendError, "Unable to send verification code."));
        return;
      }

      setSecondFactorMethod("phone_code");
      setSecondFactorCode("");
      showInfoToast("Check your phone", "Enter the code to finish login.");
      return;
    }

    setError("This account needs a second factor that this app does not support yet.");
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
        showInfoToast(
          "Account not verified",
          "Please verify your account before logging in.",
        );
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
        setError(getAuthErrorMessage(verifyError, "Unable to verify that code."));
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
      headerTitle="Login"
      title="Welcome back"
      subtitle="Login to continue your country research, saved guides, and premium support."
      error={null}
    >
      {error ? <AuthFormError message={error} /> : null}

      {unverifiedEmail ? (
        <View className="rounded-[18px] bg-[#EEF7FF] px-4 py-4">
          <Text className="text-sm font-semibold leading-5 tracking-normal text-[#202124]">
            Your account is not verified yet. Verify it first, then come back to
            login.
          </Text>
        </View>
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
      />

      <AuthTextField
        label="Password"
        icon="lock"
        actionLabel={isPasswordVisible ? "Hide" : "Show"}
        onActionPress={() => setIsPasswordVisible((current) => !current)}
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoComplete="password"
        placeholder="Password"
        secureTextEntry={!isPasswordVisible}
        textContentType="password"
      />

      {secondFactorMethod ? (
        <View className="rounded-[18px] bg-[#EEF7FF] px-4 py-4">
          <Text className="text-sm font-semibold leading-5 tracking-normal text-[#202124]">
            Enter the code Clerk sent to your{" "}
            {secondFactorMethod === "email_code" ? "email" : "phone"} to finish
            login.
          </Text>
        </View>
      ) : null}

      {secondFactorMethod ? (
        <AuthTextField
          label="Verification Code"
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

      <View className="flex-row items-center justify-between gap-3">
        <Pressable
          onPress={() => setRememberMe((current) => !current)}
          className="flex-row items-center gap-2"
          hitSlop={10}
        >
          <View
            className={`h-5 w-5 items-center justify-center rounded-[5px] ${
              rememberMe
                ? "bg-diplomatic-primary"
                : "border border-[#DADDE3] bg-white"
            }`}
          >
            {rememberMe ? (
              <Ionicons name="checkmark" size={15} color="#FFFFFF" />
            ) : null}
          </View>
          <Text className="text-sm font-bold tracking-normal text-[#707684]">
            Remember me
          </Text>
        </Pressable>

        <Link href="/forgot-password" asChild>
          <Pressable hitSlop={10}>
            <Text className="text-sm font-extrabold tracking-normal text-diplomatic-primary">
              Forgot password?
            </Text>
          </Pressable>
        </Link>
      </View>

      <AuthPrimaryButton
        label={secondFactorMethod ? "Verify Login" : "Login"}
        isLoading={isSubmitting}
        disabled={
          secondFactorMethod
            ? !secondFactorCode.trim()
            : !emailAddress.trim() || !password
        }
        onPress={secondFactorMethod ? handleSecondFactor : handleSignIn}
      />

      {secondFactorMethod ? (
        <Pressable
          onPress={startSecondFactor}
          disabled={isSubmitting}
          className="items-center"
          hitSlop={10}
        >
          <Text className="text-sm font-bold tracking-normal text-diplomatic-primary">
            Send a new code
          </Text>
        </Pressable>
      ) : null}

      {unverifiedEmail ? (
        <Pressable
          onPress={() => openVerifyPage()}
          className="h-14 items-center justify-center rounded-[22px] border border-[#CFE0F7] bg-[#EEF7FF] active:opacity-80"
          accessibilityRole="button"
        >
          <Text className="text-base font-extrabold tracking-normal text-diplomatic-primary">
            Go to Verify Page
          </Text>
        </Pressable>
      ) : null}
    </AuthCard>
  );
}

function AuthFormError({ message }: { message: string }) {
  return (
    <View className="rounded-[18px] bg-[#FFF1F1] px-4 py-3">
      <Text className="text-sm font-semibold tracking-normal text-[#D83B3B]">
        {message}
      </Text>
    </View>
  );
}
