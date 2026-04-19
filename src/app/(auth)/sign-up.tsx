import { useSignUp } from '@clerk/expo/legacy';
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

export default function SignUpScreen() {
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

  return (
    <AuthCard
      title={isVerificationPending ? 'Verify Email' : 'Create Account'}
      subtitle={
        isVerificationPending
          ? 'Enter the code Clerk sent to your email address.'
          : 'Start your EU Work Support account with email and password.'
      }
      error={error}>
      {isVerificationPending ? (
        <>
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

          <AuthPrimaryButton
            label="Verify Email"
            isLoading={isSubmitting}
            onPress={handleVerifyEmail}
          />

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

          <View className="items-center">
            <Link href="/sign-in" asChild>
              <AuthInlineLink text="Already have an account?" action="Sign in" onPress={() => null} />
            </Link>
          </View>
        </>
      )}
    </AuthCard>
  );
}
