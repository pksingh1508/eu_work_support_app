import { useClerk } from '@clerk/expo';
import { Pressable, Text, View } from 'react-native';

import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';
import { BottomTabInset } from '@/constants/theme';

export default function ProfileScreen() {
  const { signOut } = useClerk();

  return (
    <View className="flex-1">
      <ScreenPlaceholder
        eyebrow="Profile"
        title="Account and support"
        description="Manage account settings, saved items, help access, referrals, and notification preferences."
        items={[
          "Account settings",
          "Saved items",
          "Help and support",
          "Refer and earn",
        ]}
      />
      <View className="px-6 pt-4" style={{ paddingBottom: BottomTabInset }}>
        <Pressable
          onPress={() => signOut()}
          className="h-12 items-center justify-center rounded-interactive bg-diplomatic-surfaceHigh">
          <Text className="text-sm font-bold tracking-normal text-diplomatic-ink">
            Sign out
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
