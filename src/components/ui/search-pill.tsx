import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Colors, Spacing } from "@/constants/theme";

interface SearchPillBaseProps {
  accessibilityLabel?: string;
  placeholder?: string;
}

interface SearchPillButtonProps extends SearchPillBaseProps {
  onPress: () => void;
  value?: never;
  onChangeText?: never;
  onSubmit?: never;
}

interface SearchPillInputProps extends SearchPillBaseProps {
  onPress?: never;
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
}

type SearchPillProps = SearchPillButtonProps | SearchPillInputProps;

const defaultPlaceholder = "Search countries, visas & more";

export function SearchPill({
  accessibilityLabel = "Search countries, visas, and topics",
  placeholder = defaultPlaceholder,
  ...props
}: SearchPillProps) {
  const leadingIcon = (
    <View className="h-10 w-10 items-center justify-center rounded-full bg-[#EDF4FF]">
      <Ionicons name="search" size={21} color={Colors.light.primary} />
    </View>
  );

  const trailingIcon = (
    <View className="h-9 w-9 items-center justify-center rounded-full bg-diplomatic-primary">
      <Ionicons name="arrow-forward" size={17} color={Colors.light.onPrimary} />
    </View>
  );

  if ("onPress" in props && props.onPress) {
    return (
      <Pressable
        onPress={props.onPress}
        style={styles.shadow}
        className="h-[68px] w-full flex-row items-center rounded-[24px] border border-white bg-white/95 px-4 active:opacity-90"
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {leadingIcon}
        <Text
          numberOfLines={1}
          className="ml-3 min-w-0 flex-1 text-[15px] font-semibold tracking-normal text-[#7A8495]"
        >
          {placeholder}
        </Text>
        {trailingIcon}
      </Pressable>
    );
  }

  return (
    <View
      style={styles.shadow}
      className="h-[68px] w-full flex-row items-center rounded-[24px] border border-white bg-white/95 px-4"
    >
      {leadingIcon}
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        onSubmitEditing={props.onSubmit}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={placeholder}
        placeholderTextColor="#7A8495"
        className="ml-3 min-w-0 flex-1 p-0 text-[15px] font-semibold tracking-normal text-diplomatic-ink"
        accessibilityLabel={accessibilityLabel}
      />
      <Pressable
        onPress={props.onSubmit}
        hitSlop={Spacing.one}
        className="active:opacity-90"
        accessibilityRole="button"
        accessibilityLabel="Submit search"
      >
        {trailingIcon}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: Platform.select({
    web: {
      boxShadow: "0 12px 24px rgba(18, 60, 115, 0.12)",
    },
    default: {
      elevation: 6,
      shadowColor: "#123C73",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
  }),
});
