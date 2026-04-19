import { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function OnboardingScreen({
  eyebrow,
  title,
  description,
  onBack,
  children,
}: PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  onBack?: () => void;
}>) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      className="flex-1 bg-diplomatic-surface">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="min-h-full px-6 py-8">
        <SafeAreaView className="flex-1 justify-center">
          <View className="rounded-[32px] bg-diplomatic-surfaceLowest px-7 py-9 shadow-ambient">
            <View className="min-h-8 flex-row items-center justify-between gap-4">
              <Text className="text-xs font-bold uppercase tracking-normal text-diplomatic-primary">
                {eyebrow}
              </Text>
              {onBack ? (
                <Pressable
                  onPress={onBack}
                  hitSlop={12}
                  className="rounded-interactive px-2 py-1 active:opacity-70">
                  <Text className="text-sm font-bold tracking-normal text-diplomatic-primary">
                    Back
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <Text className="mt-3 text-[30px] font-extrabold leading-10 tracking-normal text-diplomatic-ink">
              {title}
            </Text>
            <Text className="mt-4 text-base leading-6 tracking-normal text-diplomatic-secondaryText">
              {description}
            </Text>
            <View className="mt-8 gap-5">{children}</View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
