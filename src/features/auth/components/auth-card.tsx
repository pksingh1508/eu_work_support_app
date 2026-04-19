import { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthCardProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  error?: string | null;
}>;

type AuthTextFieldProps = TextInputProps & {
  label: string;
  icon: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

type AuthPrimaryButtonProps = {
  label: string;
  isLoading?: boolean;
  onPress: () => void;
};

export function AuthCard({ title, subtitle, error, children }: AuthCardProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      className="flex-1 bg-diplomatic-surface">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="min-h-full justify-center px-6 py-12">
        <SafeAreaView>
          <View className="rounded-[32px] bg-diplomatic-surfaceLowest px-7 py-9 shadow-ambient">
            <Text className="text-[32px] font-extrabold leading-10 tracking-normal text-diplomatic-ink">
              {title}
            </Text>
            <Text className="mt-4 text-lg leading-7 tracking-normal text-diplomatic-secondaryText">
              {subtitle}
            </Text>

            {error ? (
              <View className="mt-6 rounded-interactive bg-[#FFEDEA] px-4 py-3">
                <Text className="text-sm font-semibold tracking-normal text-[#BA1A1A]">{error}</Text>
              </View>
            ) : null}

            <View className="mt-9 gap-6">{children}</View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function AuthTextField({
  label,
  icon,
  actionLabel,
  onActionPress,
  secureTextEntry,
  ...props
}: AuthTextFieldProps) {
  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-semibold tracking-normal text-diplomatic-ink">{label}</Text>
        {actionLabel ? (
          <Pressable onPress={onActionPress} hitSlop={10}>
            <Text className="text-base font-semibold tracking-normal text-diplomatic-primary">
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="h-14 flex-row items-center rounded-interactive bg-white px-4 shadow-sm">
        <Text className="mr-3 text-lg text-[#6F7788]">{icon}</Text>
        <TextInput
          {...props}
          secureTextEntry={secureTextEntry}
          placeholderTextColor="#AEB5C4"
          className="min-w-0 flex-1 text-base font-semibold tracking-normal text-diplomatic-ink outline-none"
        />
      </View>
    </View>
  );
}

export function AuthPrimaryButton({ label, isLoading, onPress }: AuthPrimaryButtonProps) {
  return (
    <Pressable
      disabled={isLoading}
      onPress={onPress}
      className="h-14 items-center justify-center rounded-interactive bg-diplomatic-primary active:opacity-80 disabled:opacity-60">
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="text-lg font-bold tracking-normal text-white">{label} {'->'}</Text>
      )}
    </Pressable>
  );
}

export function AuthInlineLink({
  text,
  action,
  onPress,
}: {
  text: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="items-center" hitSlop={10}>
      <Text className="text-center text-sm font-semibold tracking-normal text-diplomatic-secondaryText">
        {text} <Text className="text-diplomatic-primary">{action}</Text>
      </Text>
    </Pressable>
  );
}
