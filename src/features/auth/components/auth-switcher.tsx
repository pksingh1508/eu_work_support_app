import Ionicons from '@expo/vector-icons/Ionicons';
import { useSignIn, useSignUp } from '@clerk/expo/legacy';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthCard, AuthPrimaryButton, AuthTextField } from '@/features/auth/components/auth-card';
import { getAuthErrorMessage } from '@/features/auth/errors';

type AuthTab = 'sign-in' | 'sign-up';

export function AuthSwitcher({ initialTab = 'sign-in' }: { initialTab?: AuthTab }) {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const isSignIn = activeTab === 'sign-in';

  const title = isSignIn ? 'Welcome back' : 'Create account';
  const subtitle = isSignIn
    ? 'Sign in to continue your country research, saved guides, and premium support.'
    : 'Create your secure account to save guides and track your Europe plans.';

  return (
    <AuthCard
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={title}
      subtitle={subtitle}
      error={null}>
      {isSignIn ? <SignInForm /> : <SignUpForm />}
    </AuthCard>
  );
}

function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!isLoaded || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        identifier: emailAddress.trim(),
        password,
        strategy: 'password',
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        return;
      }

      setError('This account needs another verification step before sign in can continue.');
    } catch (authError) {
      setError(getAuthErrorMessage(authError, 'Unable to sign in with those details.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {error ? <AuthFormError message={error} /> : null}

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
              rememberMe ? 'bg-diplomatic-primary' : 'border border-[#C7CEDB] bg-white'
            }`}>
            {rememberMe ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
          </View>
          <Text className="text-sm font-bold tracking-normal text-diplomatic-secondaryText">
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

      <AuthPrimaryButton label="Sign In" isLoading={isSubmitting} onPress={handleSignIn} />
    </>
  );
}

function SignUpForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateAccount = async () => {
    if (!isLoaded || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signUp.create({
        emailAddress: emailAddress.trim(),
        password,
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        return;
      }

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setIsVerificationPending(true);
    } catch (authError) {
      setError(getAuthErrorMessage(authError, 'Unable to create your account.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!isLoaded || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (result.status === 'complete' && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        return;
      }

      setError('We could not complete verification yet. Please check the code and try again.');
    } catch (authError) {
      setError(getAuthErrorMessage(authError, 'Unable to verify that code.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return isVerificationPending ? (
    <>
      {error ? <AuthFormError message={error} /> : null}

      <AuthTextField
        label="Verification Code"
        icon="code"
        value={verificationCode}
        onChangeText={setVerificationCode}
        autoCapitalize="none"
        keyboardType="number-pad"
        placeholder="123456"
        textContentType="oneTimeCode"
      />

      <AuthPrimaryButton label="Verify Email" isLoading={isSubmitting} onPress={handleVerifyEmail} />

      <Pressable
        onPress={() => setIsVerificationPending(false)}
        className="items-center"
        hitSlop={10}>
        <Text className="text-sm font-bold tracking-normal text-diplomatic-primary">
          Edit email address
        </Text>
      </Pressable>
    </>
  ) : (
    <>
      {error ? <AuthFormError message={error} /> : null}

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
        autoComplete="new-password"
        placeholder="Create a password"
        secureTextEntry={!isPasswordVisible}
        textContentType="newPassword"
      />

      <AuthPrimaryButton
        label="Create Account"
        isLoading={isSubmitting}
        onPress={handleCreateAccount}
      />
    </>
  );
}

function AuthFormError({ message }: { message: string }) {
  return (
    <View className="rounded-interactive bg-[#FFEDEA] px-4 py-3">
      <Text className="text-sm font-semibold tracking-normal text-[#BA1A1A]">{message}</Text>
    </View>
  );
}
