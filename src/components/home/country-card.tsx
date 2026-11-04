import Ionicons from "@expo/vector-icons/Ionicons";
import { memo, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

import { countryDetails, type CountryName } from "@/components/home/country-data";
import { Badge } from "@/components/ui/badge";
import { FlagImage } from "@/components/ui/flag-image";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Elevation, Motion, Palette, Radii, Type } from "@/constants/theme";
import { haptics } from "@/lib/haptics";

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
      scaleTo={0.975}
      style={[styles.card, Elevation.card]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${country} guide`}
    >
      <View style={styles.flagTile}>
        <FlagImage country={country} width={36} radius={5} />
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {country}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {details.summary}
        </Text>
        <Badge label={details.demand} dot style={styles.tag} />
      </View>

      {canSave ? (
        <SaveButton country={country} isSaved={isSaved} isSaving={isSaving} onToggle={onToggleSave} />
      ) : (
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={17} color={Palette.subtle} />
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
    // Celebrate a fresh save only, never the initial render of a saved country.
    if (isSaved && !wasSaved.current) {
      pop.value = withSequence(withSpring(1.3, Motion.snappy), withSpring(1, Motion.spring));
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
        haptics.selection();
        onToggle(country);
      }}
      disabled={isSaving}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityState={{ selected: isSaved, busy: isSaving }}
      accessibilityLabel={isSaved ? `Remove ${country} from saved` : `Save ${country}`}
      style={[styles.save, isSaved && styles.saveActive, isSaving && styles.saving]}
    >
      <Animated.View style={iconStyle}>
        <Ionicons
          name={isSaved ? "bookmark" : "bookmark-outline"}
          size={18}
          color={isSaved ? Palette.white : Palette.inkSoft}
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
    padding: 14,
    paddingRight: 16,
    borderRadius: Radii.xl,
    backgroundColor: Palette.card,
  },
  flagTile: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.cardMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.hairline,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...Type.title3,
    fontSize: 17,
    color: Palette.ink,
  },
  summary: {
    ...Type.footnote,
    marginTop: 2,
    color: Palette.muted,
  },
  tag: {
    marginTop: 8,
  },
  save: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.well,
  },
  saveActive: {
    backgroundColor: Palette.primary,
  },
  saving: {
    opacity: 0.55,
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.cardMuted,
  },
});
