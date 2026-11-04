import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FadeInView } from "@/components/ui/fade-in-view";
import { Palette, Type } from "@/constants/theme";

type ScreenHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  accessory?: ReactNode;
};

/** Large editorial page title used at the top of tab screens. */
export function ScreenHeader({ eyebrow, title, subtitle, accessory }: ScreenHeaderProps) {
  return (
    <FadeInView style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.text}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
        </View>
        {accessory}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </FadeInView>
  );
}

type SectionHeaderProps = {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  count?: number;
};

/** Section heading with an optional overline, count pill and trailing action. */
export function SectionHeader({ title, eyebrow, action, count }: SectionHeaderProps) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.text}>
        {eyebrow ? <Text style={styles.sectionEyebrow}>{eyebrow}</Text> : null}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            {title}
          </Text>
          {typeof count === "number" ? (
            <View style={styles.count}>
              <Text style={styles.countText}>{count}</Text>
            </View>
          ) : null}
        </View>
      </View>
      {action}
    </View>
  );
}

/** @deprecated kept for older imports. */
export const SectionLabel = SectionHeader;

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 14,
    paddingBottom: 22,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    ...Type.overline,
    color: Palette.primary,
  },
  title: {
    ...Type.display,
    marginTop: 6,
    color: Palette.ink,
  },
  subtitle: {
    ...Type.body,
    marginTop: 8,
    maxWidth: 340,
    color: Palette.muted,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  sectionEyebrow: {
    ...Type.overline,
    marginBottom: 4,
    color: Palette.primary,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    ...Type.title2,
    color: Palette.ink,
  },
  count: {
    minWidth: 26,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.tint,
  },
  countText: {
    ...Type.caption,
    fontFamily: Type.overline.fontFamily,
    color: Palette.primary,
  },
});
