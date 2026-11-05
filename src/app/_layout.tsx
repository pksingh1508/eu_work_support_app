import "@/global.css";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";

import { AppProviders } from "@/components/app-providers";
import { Palette } from "@/constants/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AppProviders>
        <BottomSheetModalProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "ios_from_right",
              animationDuration: 320,
              gestureEnabled: true,
              contentStyle: { backgroundColor: Palette.canvas },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
            <Stack.Screen name="(auth)" options={{ animation: "fade_from_bottom" }} />
            <Stack.Screen name="country/[slug]" />
            <Stack.Screen name="visa/[id]" />
            <Stack.Screen name="profile/account" />
            <Stack.Screen name="profile/change-password" />
            <Stack.Screen name="profile/legal" />
            <Stack.Screen name="profile/legal/[policy]" />
            <Stack.Screen name="profile/sources-and-disclaimer" />
            <Stack.Screen name="profile/support" />
            <Stack.Screen name="profile/danger-zone" />
            <Stack.Screen name="profile/faq" />
            <Stack.Screen name="profile/app-info" />
            <Stack.Screen name="profile/settings" />
            <Stack.Screen name="profile/edit" />
            <Stack.Screen name="profile/saved-items" />
            <Stack.Screen name="profile/help" />
          </Stack>
        </BottomSheetModalProvider>
        {/* Rendered after the sheet provider so toasts float above open sheets. */}
        <AppToaster />
      </AppProviders>
    </GestureHandlerRootView>
  );
}

/** Toasts sit below the status bar instead of covering the clock. */
function AppToaster() {
  const insets = useSafeAreaInsets();

  return (
    <Toaster
      position="top-center"
      duration={2600}
      visibleToasts={3}
      gap={8}
      offset={insets.top + 6}
      enableStacking
      swipeToDismissDirection="up"
      theme="light"
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.canvas,
  },
});
