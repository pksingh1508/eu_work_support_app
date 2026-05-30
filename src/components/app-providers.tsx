import { ClerkProvider, useAuth } from "@clerk/expo";
import { useFonts } from "expo-font";
import * as ExpoSplashScreen from "expo-splash-screen";
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

import { AuthAccessProvider, useAuthAccess } from "@/features/auth/access";
import { clerkPublishableKey, clerkTokenCache } from "@/lib/clerk";
import { optionalEnv } from "@/lib/env";
import { appFonts, FontFamily } from "@/lib/fonts";
import { getThemePreference } from "@/lib/local-storage";
import { setSupabaseAccessTokenGetter } from "@/lib/supabase";

void ExpoSplashScreen.preventAutoHideAsync();

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

function AuthGate({ children }: PropsWithChildren) {
  const { isAuthLoaded, isSignedIn } = useAuthAccess();
  const router = useRouter();
  const segments = useSegments();

  const firstSegment = segments[0];
  const isAuthRoute = firstSegment === "(auth)";

  useEffect(() => {
    if (!isAuthLoaded || !isSignedIn) {
      return;
    }

    if (isAuthRoute) {
      router.replace("/");
    }
  }, [
    isAuthLoaded,
    isSignedIn,
    isAuthRoute,
    router,
  ]);

  return children;
}

export function AppProviders({ children }: PropsWithChildren) {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const colorScheme = useColorScheme();
  const [themePreference] = useState(() => getThemePreference());
  const resolvedColorScheme =
    themePreference === "system" ? colorScheme : themePreference;

  useEffect(() => {
    if (!fontsLoaded && !fontError) {
      return;
    }

    if (fontError) {
      console.warn("Unable to load app fonts", fontError);
    }

    void ExpoSplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  if (fontsLoaded) {
    configureDefaultTextFonts();
  }

  if (!fontsLoaded && !fontError) {
    return null;
  }

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
