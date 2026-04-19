import { ActivityIndicator, Pressable, Text } from 'react-native';

type PrimaryButtonProps = {
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function PrimaryButton({ label, isLoading, disabled, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      disabled={disabled || isLoading}
      onPress={onPress}
      className="h-14 items-center justify-center rounded-interactive bg-diplomatic-primary px-5 active:opacity-80 disabled:opacity-50">
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="text-base font-bold tracking-normal text-white">{label}</Text>
      )}
    </Pressable>
  );
}
