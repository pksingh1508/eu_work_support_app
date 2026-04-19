import { ClerkProvider, useAuth } from '@clerk/expo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useRouter, useSegments } from 'expo-router';
import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, useColorScheme, View } from 'react-native';

import { AuthProfileProvider } from '@/features/auth/auth-profile';
import { clerkPublishableKey, clerkTokenCache } from '@/lib/clerk';
import { optionalEnv } from '@/lib/env';
import { setSupabaseAccessTokenGetter, supabase } from '@/lib/supabase';

function SupabaseAuthBridge({ children }: PropsWithChildren) {
  const { getToken } = useAuth();

  useEffect(() => {
    setSupabaseAccessTokenGetter(async () => {
      if (optionalEnv.clerkSupabaseJwtTemplate) {
        return getToken({ template: optionalEnv.clerkSupabaseJwtTemplate });
      }

      return getToken();
    });

    return () => {
      setSupabaseAccessTokenGetter(async () => null);
    };
  }, [getToken]);

  return children;
}

function LoadingScreen({ label = 'Preparing your account' }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-diplomatic-surface px-8">
      <ActivityIndicator color="#0058BC" />
      <Text className="mt-4 text-center text-sm font-semibold tracking-normal text-diplomatic-secondaryText">
        {label}
      </Text>
    </View>
  );
}

function AuthGate({ children }: PropsWithChildren) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  const firstSegment = segments[0];
  const isAuthRoute = firstSegment === '(auth)';
  const isOnboardingRoute = firstSegment === 'onboarding';

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setOnboardingCompleted(null);
      return;
    }

    setIsProfileLoading(true);

    try {
      await supabase.rpc('ensure_user_profile');

      const { data, error } = await supabase
        .from('app_users')
        .select('onboarding_completed')
        .eq('clerk_user_id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      setOnboardingCompleted(Boolean(data?.onboarding_completed));
    } catch (error) {
      console.warn('Unable to load Supabase user profile', error);
      setOnboardingCompleted(false);
    } finally {
      setIsProfileLoading(false);
    }
  }, [userId]);

  const markOnboardingCompleted = useCallback(() => {
    setOnboardingCompleted(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setOnboardingCompleted(null);
      setIsProfileLoading(false);

      if (!isAuthRoute) {
        router.replace('/sign-in');
      }

      return;
    }

    void refreshProfile();
  }, [isLoaded, isSignedIn, isAuthRoute, refreshProfile, router]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || isProfileLoading || onboardingCompleted === null) {
      return;
    }

    if (!onboardingCompleted && !isOnboardingRoute) {
      router.replace('/onboarding');
      return;
    }

    if (onboardingCompleted && (isAuthRoute || isOnboardingRoute)) {
      router.replace('/');
    }
  }, [
    isLoaded,
    isSignedIn,
    isProfileLoading,
    onboardingCompleted,
    isAuthRoute,
    isOnboardingRoute,
    router,
  ]);

  const profileValue = useMemo(
    () => ({
      isProfileLoading,
      onboardingCompleted,
      markOnboardingCompleted,
      refreshProfile,
    }),
    [isProfileLoading, onboardingCompleted, markOnboardingCompleted, refreshProfile],
  );

  if (!isLoaded) {
    return <LoadingScreen label="Loading secure session" />;
  }

  if (isSignedIn && isProfileLoading && !isOnboardingRoute) {
    return <LoadingScreen />;
  }

  return <AuthProfileProvider value={profileValue}>{children}</AuthProfileProvider>;
}

export function AppProviders({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={clerkTokenCache}>
      <SupabaseAuthBridge>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthGate>{children}</AuthGate>
        </ThemeProvider>
      </SupabaseAuthBridge>
    </ClerkProvider>
  );
}
