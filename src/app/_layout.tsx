import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="country/[slug]" />
        <Stack.Screen name="visa/[id]" />
        <Stack.Screen name="profile/settings" />
        <Stack.Screen name="profile/saved-items" />
        <Stack.Screen name="profile/help" />
        <Stack.Screen name="billing/paywall" />
        <Stack.Screen name="billing/manage" />
      </Stack>
    </ThemeProvider>
  );
}
