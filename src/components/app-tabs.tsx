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
        animation: "shift",
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
