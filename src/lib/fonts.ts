import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_800ExtraBold,
  PlayfairDisplay_900Black,
} from "@expo-google-fonts/playfair-display";

export const FontFamily = {
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  bodyExtraBold: "Inter_800ExtraBold",
  headingSemiBold: "PlayfairDisplay_600SemiBold",
  headingBold: "PlayfairDisplay_700Bold",
  headingExtraBold: "PlayfairDisplay_800ExtraBold",
  headingBlack: "PlayfairDisplay_900Black",
} as const;

export const appFonts = {
  [FontFamily.body]: Inter_400Regular,
  [FontFamily.bodyMedium]: Inter_500Medium,
  [FontFamily.bodySemiBold]: Inter_600SemiBold,
  [FontFamily.bodyBold]: Inter_700Bold,
  [FontFamily.bodyExtraBold]: Inter_800ExtraBold,
  [FontFamily.headingSemiBold]: PlayfairDisplay_600SemiBold,
  [FontFamily.headingBold]: PlayfairDisplay_700Bold,
  [FontFamily.headingExtraBold]: PlayfairDisplay_800ExtraBold,
  [FontFamily.headingBlack]: PlayfairDisplay_900Black,
};
