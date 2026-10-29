import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { memo, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

import {
  countryDetails,
  getFlagUrl,
  type CountryName,
} from "@/components/home/country-data";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Elevation, Motion, Palette } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

type CountryCardProps = {
  country: CountryName;
  canSave: boolean;
  isSaved: boolean;
  isSaving: boolean;
  onPress: (country: CountryName) => void;
  onToggleSave: (country: CountryName) => void;
};

function CountryCardBase({
  country,
  canSave,
  isSaved,
  isSaving,
  onPress,
  onToggleSave,
}: CountryCardProps) {
  const details = countryDetails[country];

  return (
    <PressableScale
      onPress={() => onPress(country)}
      style={[styles.card, Elevation.card]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${country} guide`}
    >
      <View style={styles.flagFrame}>
        <Image
          source={{ uri: getFlagUrl(country) }}
          style={styles.flag}
          contentFit="cover"
          transition={200}
          accessibilityLabel={`${country} flag`}
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {country}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {details.summary}
        </Text>
        <View style={styles.tag}>
          <View style={styles.tagDot} />
          <Text style={styles.tagText}>{details.demand}</Text>
        </View>
      </View>

      {canSave ? (
        <SaveButton
          country={country}
          isSaved={isSaved}
          isSaving={isSaving}
          onToggle={onToggleSave}
        />
      ) : (
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={18} color={Palette.muted} />
        </View>
      )}
    </PressableScale>
  );
}

function SaveButton({
  country,
  isSaved,
  isSaving,
  onToggle,
}: {
  country: CountryName;
  isSaved: boolean;
  isSaving: boolean;
  onToggle: (country: CountryName) => void;
}) {
  const pop = useSharedValue(1);
  const wasSaved = useRef(isSaved);

  useEffect(() => {
    // Only celebrate a fresh save, not the initial render of a saved country.
    if (isSaved && !wasSaved.current) {
      pop.value = withSequence(
        withSpring(1.25, Motion.spring),
        withSpring(1, Motion.spring),
      );
    }
    wasSaved.current = isSaved;
  }, [isSaved, pop]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value }],
  }));

  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        onToggle(country);
      }}
      disabled={isSaving}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={isSaved ? `Unsave ${country}` : `Save ${country}`}
      style={[styles.save, isSaved && styles.saveActive, isSaving && styles.saving]}
    >
      <Animated.View style={iconStyle}>
        <Ionicons
          name={isSaved ? "bookmark" : "bookmark-outline"}
          size={18}
          color={isSaved ? Palette.card : Palette.inkSoft}
        />
      </Animated.View>
    </Pressable>
  );
}

export const CountryCard = memo(CountryCardBase);

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 24,
    backgroundColor: Palette.card,
  },
  flagFrame: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.canvas,
  },
  flag: {
    width: 34,
    height: 23,
    borderRadius: 4,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 17,
    lineHeight: 22,
    color: Palette.ink,
    letterSpacing: -0.2,
  },
  summary: {
    marginTop: 3,
    fontFamily: FontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    color: Palette.muted,
  },
  tag: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: Palette.tint,
  },
  tagDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Palette.primary,
  },
  tagText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Palette.primary,
  },
  save: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.canvas,
  },
  saveActive: {
    backgroundColor: Palette.primary,
  },
  saving: {
    opacity: 0.6,
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.canvas,
  },
});
