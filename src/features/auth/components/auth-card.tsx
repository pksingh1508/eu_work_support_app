import Ionicons from '@expo/vector-icons/Ionicons';
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
  activeTab?: 'sign-in' | 'sign-up';
  onTabChange?: (tab: 'sign-in' | 'sign-up') => void;
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
  disabled?: boolean;
  onPress: () => void;
};

export function AuthCard({
  title,
  subtitle,
  error,
  activeTab,
  onTabChange,
  children,
}: AuthCardProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      className="flex-1 bg-[#F7F9FD]">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="min-h-full px-6 pb-10 pt-8">
        <SafeAreaView>
          <View className="mt-8 flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-interactive bg-diplomatic-primary">
              <Ionicons name="shield-checkmark-outline" size={25} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-xl font-extrabold tracking-normal text-diplomatic-ink">
                EU Work Support
              </Text>
              <Text className="mt-1 text-sm font-semibold tracking-normal text-diplomatic-secondaryText">
                Secure account access
              </Text>
            </View>
          </View>

          <View className="mt-8">
            <Text className="text-[32px] font-extrabold leading-10 tracking-normal text-diplomatic-ink">
              {title}
            </Text>
            <Text className="mt-3 text-base leading-6 tracking-normal text-diplomatic-secondaryText">
              {subtitle}
            </Text>
          </View>

          <View className="mt-6 rounded-interactive border border-[#E6EAF2] bg-diplomatic-surfaceLowest p-4">
            {activeTab ? (
              <View className="mb-5 h-11 flex-row rounded-interactive bg-[#F3F6FA] p-1">
                <AuthTabButton
                  label="Sign In"
                  isActive={activeTab === 'sign-in'}
                  onPress={() => onTabChange?.('sign-in')}
                />
                <AuthTabButton
                  label="Sign Up"
                  isActive={activeTab === 'sign-up'}
                  onPress={() => onTabChange?.('sign-up')}
                />
              </View>
            ) : null}

            {error ? (
              <View className="mb-5 rounded-interactive bg-[#FFEDEA] px-4 py-3">
                <Text className="text-sm font-semibold tracking-normal text-[#BA1A1A]">{error}</Text>
              </View>
            ) : null}

            <View className="gap-4">{children}</View>
          </View>

          <Text className="mt-6 px-2 text-center text-sm font-medium leading-5 tracking-normal text-diplomatic-secondaryText">
            By continuing, you agree to the Terms and Privacy Policy.
          </Text>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AuthTabButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center justify-center rounded-interactive ${
        isActive ? 'bg-[#0A0F1A]' : 'bg-transparent'
      }`}>
      <Text
        className={`text-base font-extrabold tracking-normal ${
          isActive ? 'text-white' : 'text-diplomatic-secondaryText'
        }`}>
        {label}
      </Text>
    </Pressable>
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
      </View>

      <View className="h-16 flex-row items-center rounded-interactive border border-[#E2E7F0] bg-[#F8FAFD] px-4">
        <Ionicons name={getFieldIcon(icon)} size={22} color="#8A93A4" />
        <TextInput
          {...props}
          secureTextEntry={secureTextEntry}
          placeholderTextColor="#AEB5C4"
          className="ml-3 min-w-0 flex-1 text-base font-semibold tracking-normal text-diplomatic-ink outline-none"
        />
        {actionLabel ? (
          <Pressable onPress={onActionPress} hitSlop={10} className="ml-3">
            <Ionicons
              name={actionLabel === 'Hide' ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color="#8A93A4"
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function getFieldIcon(icon: string) {
  switch (icon) {
    case 'lock':
      return 'lock-closed-outline' as const;
    case 'code':
      return 'keypad-outline' as const;
    case 'mail':
    default:
      return 'mail-outline' as const;
  }
}

export function AuthPrimaryButton({ label, isLoading, disabled, onPress }: AuthPrimaryButtonProps) {
  return (
    <Pressable
      disabled={isLoading || disabled}
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
