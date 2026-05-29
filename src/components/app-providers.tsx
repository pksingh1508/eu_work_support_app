import { ClerkProvider, useAuth } from "@clerk/expo";
import { useFonts } from "expo-font";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useRouter, useSegments } from "expo-router";
import { PropsWithChildren, useEffect, useState } from "react";
import {
  Text,
  TextInput,
  useColorScheme,
  type TextInputProps,
  type TextProps,
} from "react-native";

import { SplashScreen } from "@/components/splash-screen";
import { AuthAccessProvider, useAuthAccess } from "@/features/auth/access";
import { clerkPublishableKey, clerkTokenCache } from "@/lib/clerk";
import { optionalEnv } from "@/lib/env";
import { appFonts, FontFamily } from "@/lib/fonts";
import { getThemePreference } from "@/lib/local-storage";
import { setSupabaseAccessTokenGetter } from "@/lib/supabase";

let defaultTextFontsConfigured = false;

function configureDefaultTextFonts() {
  if (defaultTextFontsConfigured) {
    return;
  }

  const textDefaults = Text as unknown as {
    defaultProps?: TextProps;
  };
  const textInputDefaults = TextInput as unknown as {
    defaultProps?: TextInputProps;
  };

  textDefaults.defaultProps = {
    ...textDefaults.defaultProps,
    style: [{ fontFamily: FontFamily.body }, textDefaults.defaultProps?.style],
  };
  textInputDefaults.defaultProps = {
    ...textInputDefaults.defaultProps,
    style: [
      { fontFamily: FontFamily.body },
      textInputDefaults.defaultProps?.style,
    ],
  };
  defaultTextFontsConfigured = true;
}

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

function LoadingScreen({
  label = "Preparing your account",
}: {
  label?: string;
}) {
  return <SplashScreen label={label} />;
}

function AuthGate({ children }: PropsWithChildren) {
  const {
    isAuthLoaded,
    isSignedIn,
    hasPremiumAccess,
    isProfileLoading,
    onboardingCompleted,
  } = useAuthAccess();
  const router = useRouter();
  const segments = useSegments();

  const firstSegment = segments[0];
  const isAuthRoute = firstSegment === "(auth)";
  const isOnboardingRoute = firstSegment === "onboarding";

  useEffect(() => {
    if (
      !isAuthLoaded ||
      !isSignedIn ||
      !hasPremiumAccess ||
      isProfileLoading ||
      onboardingCompleted === null
    ) {
      return;
    }

    if (!onboardingCompleted && !isOnboardingRoute) {
      router.replace("/onboarding");
      return;
    }

    if (onboardingCompleted && (isAuthRoute || isOnboardingRoute)) {
      router.replace("/");
    }
  }, [
    isAuthLoaded,
    isSignedIn,
    hasPremiumAccess,
    isProfileLoading,
    onboardingCompleted,
    isAuthRoute,
    isOnboardingRoute,
    router,
  ]);

  if (!isAuthLoaded) {
    return <LoadingScreen label="Loading secure session" />;
  }

  if (isSignedIn && isProfileLoading && isOnboardingRoute) {
    return <LoadingScreen />;
  }

  return children;
}

export function AppProviders({ children }: PropsWithChildren) {
  const [fontsLoaded] = useFonts(appFonts);
  const colorScheme = useColorScheme();
  const [themePreference] = useState(() => getThemePreference());
  const resolvedColorScheme =
    themePreference === "system" ? colorScheme : themePreference;

  if (!fontsLoaded) {
    return <SplashScreen label="Loading app fonts" />;
  }

  configureDefaultTextFonts();

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      tokenCache={clerkTokenCache}
    >
      <SupabaseAuthBridge>
        <ThemeProvider
          value={resolvedColorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <AuthAccessProvider>
            <AuthGate>{children}</AuthGate>
          </AuthAccessProvider>
        </ThemeProvider>
      </SupabaseAuthBridge>
    </ClerkProvider>
  );
}
