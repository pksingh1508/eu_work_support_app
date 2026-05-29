import Ionicons from '@expo/vector-icons/Ionicons';
import { useSignIn } from '@clerk/expo/legacy';
import { Link, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthCard, AuthPrimaryButton, AuthTextField } from '@/features/auth/components/auth-card';
import { getAuthErrorMessage } from '@/features/auth/errors';
import { isEmailProUser } from '@/lib/pro-account';
import { showInfoToast } from '@/lib/toast';

export function AuthSwitcher() {
  return (
    <AuthCard
      headerTitle="Login"
      title="Welcome back"
      subtitle="Login to continue your country research, saved guides, and premium support."
      error={null}>
      <SignInForm />
    </AuthCard>
  );
}

function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestedReturnTo = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  const safeReturnTo =
    requestedReturnTo &&
    requestedReturnTo.startsWith('/') &&
    !requestedReturnTo.startsWith('//') &&
    requestedReturnTo !== '/sign-in'
      ? requestedReturnTo
      : '/';

  const handleSignIn = async () => {
    if (!isLoaded || isSubmitting) {
      return;
    }

    setError(null);
    setUnverifiedEmail(null);
    setIsSubmitting(true);
    const normalizedEmail = emailAddress.trim().toLowerCase();

    try {
      const isVerified = await isEmailProUser(normalizedEmail);

      if (!isVerified) {
        setUnverifiedEmail(normalizedEmail);
        showInfoToast(
          "Your account is not verified",
          "Please verify your account.",
        );
        return;
      }

      const result = await signIn.create({
        identifier: normalizedEmail,
        password,
        strategy: 'password',
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace(safeReturnTo as Href);
        return;
      }

      setError('This account needs website verification before login can continue.');
    } catch (authError) {
      setError(getAuthErrorMessage(authError, 'Unable to login with those details.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openVerifyPage = () => {
    const email = unverifiedEmail ?? emailAddress.trim();
    router.push(
      `/verify?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(
        safeReturnTo,
      )}` as Href,
    );
  };

  return (
    <>
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
        actionLabel={isPasswordVisible ? 'Hide' : 'Show'}
        onActionPress={() => setIsPasswordVisible((current) => !current)}
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoComplete="password"
        placeholder="Password"
        secureTextEntry={!isPasswordVisible}
        textContentType="password"
      />

      <View className="flex-row items-center justify-between gap-3">
        <Pressable
          onPress={() => setRememberMe((current) => !current)}
          className="flex-row items-center gap-2"
          hitSlop={10}>
          <View
            className={`h-5 w-5 items-center justify-center rounded-[5px] ${
              rememberMe ? 'bg-diplomatic-primary' : 'border border-[#DADDE3] bg-white'
            }`}>
            {rememberMe ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
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
        label="Login"
        isLoading={isSubmitting}
        disabled={!emailAddress.trim() || !password}
        onPress={handleSignIn}
      />

      {unverifiedEmail ? (
        <Pressable
          onPress={openVerifyPage}
          className="h-14 items-center justify-center rounded-[22px] border border-[#CFE0F7] bg-[#EEF7FF] active:opacity-80"
          accessibilityRole="button"
        >
          <Text className="text-base font-extrabold tracking-normal text-diplomatic-primary">
            Go to Verify Page
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}

function AuthFormError({ message }: { message: string }) {
  return (
    <View className="rounded-[18px] bg-[#FFF1F1] px-4 py-3">
      <Text className="text-sm font-semibold tracking-normal text-[#D83B3B]">{message}</Text>
    </View>
  );
}
