import Ionicons from '@expo/vector-icons/Ionicons';
import { PropsWithChildren } from 'react';
import {
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

import { CustomLoading } from "@/components/custom-loading";

type AuthCardProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  error?: string | null;
  activeTab?: 'sign-in' | 'sign-up';
  onTabChange?: (tab: 'sign-in' | 'sign-up') => void;
}>;

type AuthTextFieldProps = TextInputProps & {
  label: string;
  icon?: string;
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
      className="flex-1 bg-[#FAFAFB]">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="min-h-full px-5 pb-10 pt-7">
        <SafeAreaView className="flex-1 justify-center">
          <View className="rounded-[30px] border border-[#EDEDF0] bg-white px-5 py-6">
            <Text className="text-[30px] font-extrabold leading-9 tracking-normal text-[#202124]">
              {title}
            </Text>
            <Text className="mt-3 text-base font-semibold leading-7 tracking-normal text-[#707684]">
              {subtitle}
            </Text>

            {activeTab ? (
              <View className="mt-6 h-12 flex-row rounded-[20px] bg-[#F4F4F5] p-1">
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
              <View className="mt-5 rounded-[18px] bg-[#FFF1F1] px-4 py-3">
                <Text className="text-sm font-semibold tracking-normal text-[#D83B3B]">{error}</Text>
              </View>
            ) : null}

            <View className="mt-6 gap-4">{children}</View>
          </View>

          <Text className="mt-6 px-2 text-center text-sm font-semibold leading-5 tracking-normal text-[#707684]">
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
      className={`flex-1 items-center justify-center rounded-[16px] ${
        isActive ? 'bg-white' : 'bg-transparent'
      }`}>
      <Text
        className={`text-base font-extrabold tracking-normal ${
          isActive ? 'text-diplomatic-primary' : 'text-[#707684]'
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
        <Text className="text-sm font-extrabold tracking-normal text-[#202124]">{label}</Text>
      </View>

      <View className="h-14 flex-row items-center rounded-[20px] border border-[#E2E2E6] bg-[#FAFAFB] px-4">
        <TextInput
          {...props}
          secureTextEntry={secureTextEntry}
          placeholderTextColor="#A1A6B1"
          className="min-w-0 flex-1 text-base font-semibold tracking-normal text-[#202124] outline-none"
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
      className="h-14 items-center justify-center rounded-[22px] bg-diplomatic-primary active:opacity-80 disabled:opacity-60">
      {isLoading ? (
        <CustomLoading size={28} />
      ) : (
        <Text className="text-base font-extrabold tracking-normal text-white">{label}</Text>
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
      <Text className="text-center text-sm font-semibold tracking-normal text-[#707684]">
        {text} <Text className="text-diplomatic-primary">{action}</Text>
      </Text>
    </Pressable>
  );
}
