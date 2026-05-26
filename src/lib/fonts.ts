import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import {
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from "@expo-google-fonts/poppins";

export const FontFamily = {
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  bodyExtraBold: "Inter_800ExtraBold",
  headingSemiBold: "Poppins_600SemiBold",
  headingBold: "Poppins_700Bold",
  headingExtraBold: "Poppins_800ExtraBold",
  headingBlack: "Poppins_900Black",
} as const;

export const appFonts = {
  [FontFamily.body]: Inter_400Regular,
  [FontFamily.bodyMedium]: Inter_500Medium,
  [FontFamily.bodySemiBold]: Inter_600SemiBold,
  [FontFamily.bodyBold]: Inter_700Bold,
  [FontFamily.bodyExtraBold]: Inter_800ExtraBold,
  [FontFamily.headingSemiBold]: Poppins_600SemiBold,
  [FontFamily.headingBold]: Poppins_700Bold,
  [FontFamily.headingExtraBold]: Poppins_800ExtraBold,
  [FontFamily.headingBlack]: Poppins_900Black,
};
