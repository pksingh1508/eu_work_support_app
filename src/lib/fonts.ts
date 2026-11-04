// Per-weight imports: the package barrels would bundle every weight and italic.
import { InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif/400Regular";
import { InstrumentSerif_400Regular_Italic } from "@expo-google-fonts/instrument-serif/400Regular_Italic";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import { PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans/800ExtraBold";

/**
 * Type system
 * - Display / headings / UI labels: Plus Jakarta Sans (geometric, premium, great numerals)
 * - Body copy: Inter (best-in-class legibility at small sizes)
 * - Editorial accents: Instrument Serif Italic (used sparingly for a single word)
 */
export const FontFamily = {
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  displayMedium: "PlusJakartaSans_500Medium",
  displaySemiBold: "PlusJakartaSans_600SemiBold",
  displayBold: "PlusJakartaSans_700Bold",
  displayExtraBold: "PlusJakartaSans_800ExtraBold",
  serif: "InstrumentSerif_400Regular",
  serifItalic: "InstrumentSerif_400Regular_Italic",
  /** Legacy aliases, kept so older call-sites resolve to the new display face. */
  headingSemiBold: "PlusJakartaSans_600SemiBold",
  headingBold: "PlusJakartaSans_700Bold",
  headingExtraBold: "PlusJakartaSans_800ExtraBold",
} as const;

export const appFonts = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
};
