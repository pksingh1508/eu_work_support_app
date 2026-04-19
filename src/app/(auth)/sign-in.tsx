import { useSignIn } from '@clerk/expo/legacy';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  AuthCard,
  AuthInlineLink,
  AuthPrimaryButton,
  AuthTextField,
} from '@/features/auth/components/auth-card';
import { getAuthErrorMessage } from '@/features/auth/errors';

export default function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
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
    <AuthCard
      title="Welcome Back"
      subtitle="Sign in to your EU Work Support portal to continue."
      error={error}>
      <AuthTextField
        label="Email Address"
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

      <Link href="/forgot-password" asChild>
        <Pressable className="-mt-4 self-end" hitSlop={10}>
          <Text className="text-sm font-bold tracking-normal text-diplomatic-primary">Forgot?</Text>
        </Pressable>
      </Link>

      <AuthPrimaryButton label="Sign In" isLoading={isSubmitting} onPress={handleSignIn} />

      <View className="items-center">
        <Link href="/sign-up" asChild>
          <AuthInlineLink text="Don't have an account?" action="Create one" onPress={() => null} />
        </Link>
      </View>
    </AuthCard>
  );
}
