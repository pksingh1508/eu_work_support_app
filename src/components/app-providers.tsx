import { ClerkProvider, useAuth } from "@clerk/expo";
import { useFonts } from "expo-font";
import * as ExpoSplashScreen from "expo-splash-screen";
import { DefaultTheme, ThemeProvider, type Theme } from "@react-navigation/native";
import { useRouter, useSegments } from "expo-router";
import { PropsWithChildren, useEffect } from "react";
import { Text, TextInput, type TextInputProps, type TextProps } from "react-native";

import { AuthAccessProvider, useAuthAccess } from "@/features/auth/access";
import { useSavedStore } from "@/features/saved/saved-store";
import { clerkPublishableKey, clerkTokenCache } from "@/lib/clerk";
import { optionalEnv } from "@/lib/env";
import { Palette } from "@/constants/theme";
import { appFonts, FontFamily } from "@/lib/fonts";
import { setSupabaseAccessTokenGetter } from "@/lib/supabase";

void ExpoSplashScreen.preventAutoHideAsync();

/** The design is light-first; pin navigation chrome to it to avoid dark flashes. */
const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Palette.primary,
    background: Palette.canvas,
    card: Palette.card,
    text: Palette.ink,
    border: Palette.hairline,
  },
};

const baseTextStyle = {
  fontFamily: FontFamily.body,
  color: Palette.ink,
  // Android pads custom fonts vertically; disabling it gives precise, iOS-like metrics.
  includeFontPadding: false,
} as const;

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
    style: [baseTextStyle, textDefaults.defaultProps?.style],
  };
  textInputDefaults.defaultProps = {
    ...textInputDefaults.defaultProps,
    style: [baseTextStyle, textInputDefaults.defaultProps?.style],
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

function SavedItemsHydrator() {
  const { isAuthLoaded, isSignedIn, userId } = useAuthAccess();
  const hydrateForUser = useSavedStore((state) => state.hydrateForUser);
  const resetSavedStore = useSavedStore((state) => state.reset);

  useEffect(() => {
    if (!isAuthLoaded) {
      return;
    }

    if (!isSignedIn || !userId) {
      resetSavedStore();
      return;
    }

    void hydrateForUser(userId);
  }, [
    hydrateForUser,
    isAuthLoaded,
    isSignedIn,
    resetSavedStore,
    userId,
  ]);

  return null;
}

export function AppProviders({ children }: PropsWithChildren) {
  const [fontsLoaded, fontError] = useFonts(appFonts);

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
        <ThemeProvider value={navigationTheme}>
          <AuthAccessProvider>
            <SavedItemsHydrator />
            <AuthGate>{children}</AuthGate>
          </AuthAccessProvider>
        </ThemeProvider>
      </SupabaseAuthBridge>
    </ClerkProvider>
  );
}
