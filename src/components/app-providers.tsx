import { ClerkProvider, useAuth } from '@clerk/expo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { PropsWithChildren, useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { clerkPublishableKey, clerkTokenCache } from '@/lib/clerk';
import { setSupabaseAccessTokenGetter } from '@/lib/supabase';

function SupabaseAuthBridge({ children }: PropsWithChildren) {
  const { getToken } = useAuth();

  useEffect(() => {
    setSupabaseAccessTokenGetter(async () => getToken());

    return () => {
      setSupabaseAccessTokenGetter(async () => null);
    };
  }, [getToken]);

  return children;
}

export function AppProviders({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={clerkTokenCache}>
      <SupabaseAuthBridge>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {children}
        </ThemeProvider>
      </SupabaseAuthBridge>
    </ClerkProvider>
  );
}

