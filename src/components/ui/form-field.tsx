import { Text, TextInput, TextInputProps, View } from 'react-native';

type FormFieldProps = TextInputProps & {
  label: string;
  helper?: string;
};

export function FormField({ label, helper, ...props }: FormFieldProps) {
  return (
    <View>
      <Text className="mb-2 text-base font-semibold tracking-normal text-diplomatic-ink">{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#AEB5C4"
        className="h-14 rounded-interactive bg-white px-4 text-base font-semibold tracking-normal text-diplomatic-ink shadow-sm outline-none"
      />
      {helper ? (
        <Text className="mt-2 text-xs font-medium tracking-normal text-diplomatic-secondaryText">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

