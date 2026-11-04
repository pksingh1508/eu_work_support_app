import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DocumentSections } from "@/components/document/document-sections";
import { Badge, ProBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { AppSheet } from "@/components/ui/sheet";
import { Palette, Type } from "@/constants/theme";
import type { CountryDocument } from "@/features/countries/country-api";
import { estimateReadingMinutes } from "@/features/documents/content";

type DocumentSheetProps = {
  document: CountryDocument | null;
  onClose: () => void;
  onOpenFullGuide: (document: CountryDocument) => void;
};

const SNAP_POINTS = ["92%"];

/** Reading sheet for a country guide, replacing the old full-screen modal. */
export function DocumentSheet({ document, onClose, onOpenFullGuide }: DocumentSheetProps) {
  // Keep rendering the last document while the sheet animates closed.
  const [displayed, setDisplayed] = useState<CountryDocument | null>(document);

  useEffect(() => {
    if (document) {
      setDisplayed(document);
    }
  }, [document]);

  const readingMinutes = displayed
    ? estimateReadingMinutes(displayed.intro, displayed.contentJson)
    : 0;

  return (
    <AppSheet
      visible={Boolean(document)}
      onClose={onClose}
      snapPoints={SNAP_POINTS}
      scrollable
      header={
        displayed ? (
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.category} numberOfLines={1}>
                  {displayed.categoryName}
                </Text>
                <Text style={styles.title} numberOfLines={3}>
                  {displayed.title}
                </Text>
              </View>
              <IconButton
                icon="close"
                variant="tonal"
                size={38}
                iconSize={19}
                onPress={onClose}
                accessibilityLabel="Close guide"
              />
            </View>
            <View style={styles.meta}>
              <Badge label={`${readingMinutes} min read`} tone="neutral" icon="time-outline" />
              <Badge
                label={`${displayed.contentJson.sections?.length ?? 0} sections`}
                tone="neutral"
                icon="list-outline"
              />
              {displayed.isPremium ? <ProBadge /> : null}
            </View>
          </View>
        ) : null
      }
    >
      {displayed ? (
        <View style={styles.body}>
          <DocumentSections intro={displayed.intro} content={displayed.contentJson} />
          <Button
            label="Open as full page"
            variant="secondary"
            icon="expand-outline"
            onPress={() => onOpenFullGuide(displayed)}
            style={styles.fullButton}
          />
        </View>
      ) : null}
    </AppSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.hairline,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  category: {
    ...Type.overline,
    color: Palette.primary,
  },
  title: {
    ...Type.title1,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 6,
    color: Palette.ink,
  },
  meta: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  body: {
    paddingTop: 18,
  },
  fullButton: {
    marginTop: 22,
  },
});
