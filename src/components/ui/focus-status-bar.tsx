import { useIsFocused } from "@react-navigation/native";
import { StatusBar, type StatusBarStyle } from "expo-status-bar";

type FocusStatusBarProps = {
  style: StatusBarStyle;
};

/** Status bar that only applies while its screen is focused (tabs stay mounted). */
export function FocusStatusBar({ style }: FocusStatusBarProps) {
  const isFocused = useIsFocused();

  return isFocused ? <StatusBar style={style} /> : null;
}
