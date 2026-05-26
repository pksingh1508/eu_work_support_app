import "@/global.css";

import { Stack } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Toaster } from "sonner-native";

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
          <Stack.Screen name="profile/account" />
          <Stack.Screen name="profile/change-password" />
          <Stack.Screen name="profile/legal" />
          <Stack.Screen name="profile/legal/[policy]" />
          <Stack.Screen name="profile/support" />
          <Stack.Screen name="profile/danger-zone" />
          <Stack.Screen name="profile/app-info" />
          <Stack.Screen name="profile/settings" />
          <Stack.Screen name="profile/edit" />
          <Stack.Screen name="profile/saved-items" />
          <Stack.Screen name="profile/help" />
        </Stack>
        <Toaster
          duration={2200}
          position="top-center"
          richColors
          visibleToasts={2}
          toastOptions={{
            titleStyle: {
              color: "#111827",
              fontFamily: "Inter_700Bold",
              fontSize: 15,
            },
            descriptionStyle: {
              color: "#6B7280",
              fontFamily: "Inter_500Medium",
              fontSize: 13,
            },
            style: {
              backgroundColor: "#FFFFFF",
              borderColor: "#E5E7EB",
              borderRadius: 18,
              shadowColor: "#111827",
              shadowOpacity: 0.14,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
            },
          }}
        />
      </AppProviders>
    </GestureHandlerRootView>
  );
}
