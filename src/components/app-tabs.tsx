import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { Platform, useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const themeName = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[themeName];
  const iconColor = {
    default: colors.textSecondary,
    selected: colors.primary,
  };
  const labelStyle = {
    default: {
      color: colors.textSecondary,
      fontSize: Platform.select({ android: 12, default: 11 }),
      fontWeight: '600' as const,
    },
    selected: {
      color: colors.text,
      fontSize: Platform.select({ android: 12, default: 11 }),
      fontWeight: '700' as const,
    },
  };

  return (
    <NativeTabs
      backgroundColor={colors.surfaceLowest}
      blurEffect={themeName === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
      disableTransparentOnScrollEdge
      iconColor={iconColor}
      indicatorColor={colors.backgroundSelected}
      labelStyle={labelStyle}
      labelVisibilityMode="labeled"
      rippleColor={colors.backgroundSelected}
      shadowColor={colors.outlineVariant}
      tintColor={colors.primary}>
      <NativeTabs.Trigger name="index" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon
          md="home"
          sf={{ default: 'house', selected: 'house.fill' }}
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon md="search" sf="magnifyingglass" />
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="saved" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon
          md="bookmark"
          sf={{ default: 'bookmark', selected: 'bookmark.fill' }}
        />
        <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="billing" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon
          md="credit_card"
          sf={{ default: 'creditcard', selected: 'creditcard.fill' }}
        />
        <NativeTabs.Trigger.Label>Billing</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile" disableTransparentOnScrollEdge>
        <NativeTabs.Trigger.Icon
          md="person"
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
        />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
