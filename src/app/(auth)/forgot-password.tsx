import { Link } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { AuthCard, AuthPrimaryButton, AuthTextField } from '@/features/auth/components/auth-card';

export default function ForgotPasswordScreen() {
  return (
    <AuthCard
      title="Reset Password"
      subtitle="Password reset will use Clerk email verification. This screen is ready for the next auth iteration.">
      <AuthTextField
        label="Email Address"
        icon="mail"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="name@example.com"
        textContentType="emailAddress"
      />
      <AuthPrimaryButton label="Send Reset Code" onPress={() => null} />
      <Link href="/sign-in" asChild>
        <Pressable className="items-center" hitSlop={10}>
          <Text className="text-sm font-bold tracking-normal text-diplomatic-primary">
            Back to sign in
          </Text>
        </Pressable>
      </Link>
    </AuthCard>
  );
}
