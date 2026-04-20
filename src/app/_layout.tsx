import "@/global.css";

import { Stack } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AppProviders } from "@/components/app-providers";

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <AppProviders>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="country/[slug]" />
          <Stack.Screen name="visa/[id]" />
          <Stack.Screen name="profile/settings" />
          <Stack.Screen name="profile/edit" />
          <Stack.Screen name="profile/saved-items" />
          <Stack.Screen name="profile/help" />
          <Stack.Screen name="billing/paywall" />
          <Stack.Screen name="billing/manage" />
        </Stack>
      </AppProviders>
    </GestureHandlerRootView>
  );
}
