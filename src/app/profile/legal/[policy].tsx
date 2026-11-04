import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Badge } from "@/components/ui/badge";
import { FadeInView } from "@/components/ui/fade-in-view";
import { StackScreen } from "@/components/ui/stack-screen";
import { dataDeletion } from "@/constants/dataDeletion";
import { openSource } from "@/constants/openSource";
import { privacyPolicy } from "@/constants/privacyPolicy";
import { termsAndCondition } from "@/constants/terms&condition";
import { Elevation, Palette, Radii, Type } from "@/constants/theme";
import { FontFamily } from "@/lib/fonts";

const policies = {
  "privacy-policy": privacyPolicy,
  "terms-and-conditions": termsAndCondition,
  "data-deletion": dataDeletion,
  "open-source": openSource,
} as const;

type PolicyKey = keyof typeof policies;
type PolicyBlock = (typeof policies)[PolicyKey]["blocks"][number];

function isPolicyKey(value: string): value is PolicyKey {
  return value in policies;
}

export default function PolicyDetailScreen() {
  const params = useLocalSearchParams<{ policy?: string }>();
  const policyKey = params.policy && isPolicyKey(params.policy) ? params.policy : "privacy-policy";
  const policy = policies[policyKey];
  const shortTitle = policy.title.replace(/^EU Work Support\s+/, "");

  return (
    <StackScreen title={shortTitle} eyebrow="Legal">
      <FadeInView style={styles.meta}>
        <Badge label={`Last updated ${policy.lastUpdated}`} tone="neutral" icon="calendar-outline" size="md" />
      </FadeInView>

      <FadeInView index={1} style={[styles.card, Elevation.card]}>
        {policy.blocks.map((block, index) => (
          <PolicyBlockRenderer key={`${block.type}-${index}`} block={block} isFirst={index === 0} />
        ))}
      </FadeInView>
    </StackScreen>
  );
}

function PolicyBlockRenderer({ block, isFirst }: { block: PolicyBlock; isFirst: boolean }) {
  switch (block.type) {
    case "heading":
      return (
        <View style={[styles.headingRow, isFirst && styles.noTopMargin]}>
          <View style={styles.headingBar} />
          <Text style={styles.heading} accessibilityRole="header">
            {block.text}
          </Text>
        </View>
      );
    case "subheading":
      return <Text style={styles.subheading}>{block.text}</Text>;
    case "paragraph":
      return <Text style={styles.paragraph}>{block.text}</Text>;
    case "bullets":
      return (
        <View style={styles.bullets}>
          {block.items.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      );
    case "table":
      return (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            {block.headers.map((header) => (
              <Text key={header} style={styles.tableHeaderText}>
                {header}
              </Text>
            ))}
          </View>
          {block.rows.map((row, rowIndex) => (
            <View
              key={`${row[0]}-${rowIndex}`}
              style={[styles.tableRow, rowIndex < block.rows.length - 1 && styles.tableDivider]}
            >
              {row.map((cell, cellIndex) => (
                <Text
                  key={`${row[0]}-${cellIndex}`}
                  style={[styles.tableCell, cellIndex === 0 && styles.tableCellFirst]}
                >
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  meta: {
    marginBottom: 16,
  },
  card: {
    padding: 20,
    borderRadius: Radii.xxl,
    backgroundColor: Palette.card,
  },
  headingRow: {
    marginTop: 24,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  noTopMargin: {
    marginTop: 0,
  },
  headingBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: Palette.primary,
  },
  heading: {
    ...Type.title3,
    flex: 1,
    color: Palette.ink,
  },
  subheading: {
    ...Type.headline,
    marginTop: 12,
    marginBottom: 6,
    color: Palette.ink,
  },
  paragraph: {
    ...Type.body,
    marginBottom: 12,
    color: "#3B4459",
  },
  bullets: {
    marginBottom: 12,
    gap: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bulletDot: {
    width: 6,
    height: 6,
    marginTop: 9,
    marginLeft: 4,
    borderRadius: 3,
    backgroundColor: Palette.primary,
  },
  bulletText: {
    ...Type.body,
    flex: 1,
    color: "#3B4459",
  },
  table: {
    marginTop: 4,
    marginBottom: 14,
    overflow: "hidden",
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,16,36,0.12)",
  },
  tableRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tableHeader: {
    backgroundColor: Palette.cardMuted,
  },
  tableDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.divider,
  },
  tableHeaderText: {
    ...Type.overline,
    flex: 1,
    color: Palette.muted,
  },
  tableCell: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 17,
    color: "#3B4459",
  },
  tableCellFirst: {
    fontFamily: FontFamily.bodySemiBold,
    color: Palette.ink,
  },
});
