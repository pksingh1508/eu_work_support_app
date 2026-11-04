import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ProBadge } from "@/components/ui/badge";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Elevation, Palette, Radii, Type } from "@/constants/theme";
import type { CountryDocument } from "@/features/countries/country-api";
import { getCategoryIcon } from "@/features/documents/content";

type DocumentRowProps = {
  document: CountryDocument;
  isFirst: boolean;
  onPress: (document: CountryDocument) => void;
};

function DocumentRowBase({ document, isFirst, onPress }: DocumentRowProps) {
  return (
    <PressableScale
      onPress={() => onPress(document)}
      scaleTo={0.975}
      style={[styles.card, Elevation.card]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${document.title}`}
      accessibilityHint="Opens the guide in a sheet"
    >
      <View style={[styles.icon, isFirst && styles.iconFeatured]}>
        <Ionicons
          name={isFirst ? "compass" : getCategoryIcon(document.categoryIcon)}
          size={21}
          color={isFirst ? Palette.white : Palette.primary}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {document.title}
          </Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {document.shortDescription ?? document.intro ?? "Complete guide"}
        </Text>
        {document.isPremium ? (
          <View style={styles.badge}>
            <ProBadge />
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={17} color={Palette.faint} />
    </PressableScale>
  );
}

export const DocumentRow = memo(DocumentRowBase);

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
  icon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.tint,
  },
  iconFeatured: {
    backgroundColor: Palette.primary,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    ...Type.headline,
    flex: 1,
    color: Palette.ink,
  },
  description: {
    ...Type.footnote,
    marginTop: 3,
    color: Palette.muted,
  },
  badge: {
    marginTop: 8,
  },
});
