import { StyleSheet, Text, View } from "react-native";

import { FadeInView } from "@/components/ui/fade-in-view";
import { Palette } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

type ScreenHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

/** Large editorial page title used at the top of tab screens. */
export function ScreenHeader({ eyebrow, title, subtitle }: ScreenHeaderProps) {
  return (
    <FadeInView style={styles.wrapper}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </FadeInView>
  );
}

export function SectionLabel({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  eyebrow: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 11,
    letterSpacing: 1.4,
    color: Palette.primary,
  },
  title: {
    marginTop: 4,
    fontFamily: FontFamily.headingBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: Palette.ink,
  },
  subtitle: {
    marginTop: 6,
    maxWidth: 320,
    fontFamily: FontFamily.body,
    fontSize: 15,
    lineHeight: 22,
    color: Palette.muted,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 17,
    color: Palette.ink,
  },
});
