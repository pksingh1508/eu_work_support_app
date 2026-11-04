import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { countryDetails, type CountryName } from "@/components/home/country-data";
import { Palette } from "@/constants/theme";

const codeByName = new Map(
  Object.entries(countryDetails).map(([name, details]) => [name.toLowerCase(), details.code]),
);

export function getFlagCodeByName(name: string | null | undefined) {
  return name ? (codeByName.get(name.toLowerCase()) ?? null) : null;
}

export function getFlagUrlByName(name: string | null | undefined, width: 160 | 320 | 640 = 160) {
  const code = getFlagCodeByName(name);
  return code ? `https://flagcdn.com/w${width}/${code}.png` : null;
}

type FlagImageProps = {
  country: string | CountryName | null | undefined;
  emoji?: string | null;
  width?: number;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Crisp flag artwork with an inner hairline so white flags never melt into cards. */
export function FlagImage({
  country,
  emoji,
  width = 32,
  height = Math.round(width * 0.68),
  radius = 5,
  style,
}: FlagImageProps) {
  const url = getFlagUrlByName(country ?? null, width > 60 ? 320 : 160);

  if (!url) {
    return (
      <View style={[styles.fallback, { width, height, borderRadius: radius }, style]}>
        {emoji ? (
          <Text style={{ fontSize: height * 0.9, lineHeight: height * 1.1 }}>{emoji}</Text>
        ) : (
          <Ionicons name="flag" size={height * 0.7} color={Palette.subtle} />
        )}
      </View>
    );
  }

  return (
    <View style={[{ width, height, borderRadius: radius }, styles.frame, style]}>
      <Image
        source={{ uri: url }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={250}
        cachePolicy="memory-disk"
        accessibilityLabel={`${country} flag`}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.innerBorder, { borderRadius: radius }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    backgroundColor: Palette.well,
  },
  innerBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,16,36,0.12)",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.well,
  },
});
