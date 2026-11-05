import { Tabs } from "expo-router";
import React from "react";

import { AppTabBar } from "@/components/app-tab-bar";
import { Palette } from "@/constants/theme";

export default function AppTabs() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // "shift" can leave a tab painted blank on Android (RN Animated issue
        // with bottom-tabs 7.15); the sliding tab indicator carries the motion.
        animation: "none",
        sceneStyle: { backgroundColor: Palette.canvas },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
