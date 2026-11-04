import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { DocumentFaq } from "@/components/document/document-faq";
import { DocumentTable } from "@/components/document/document-table";
import { GradientFill } from "@/components/ui/gradient-fill";
import { PressableScale } from "@/components/ui/pressable-scale";
import { NavyGradient, Palette, Radii, Type } from "@/constants/theme";
import {
  getUrlHost,
  stringifyValue,
  type ContentJson,
  type ContentSection,
} from "@/features/documents/content";
import { FontFamily } from "@/lib/fonts";
import { openExternal } from "@/lib/open-external";

type DocumentSectionsProps = {
  intro?: string | null;
  content: ContentJson;
};

const COLLAPSED_ITEM_LIMIT = 12;

/** Renders a guide's structured `content_json` as an editorial reading layout. */
export function DocumentSections({ intro, content }: DocumentSectionsProps) {
  const sections = content.sections ?? [];

  return (
    <View style={styles.stack}>
      {intro ? <Text style={styles.lead}>{intro}</Text> : null}
      {sections.map((section, index) => (
        <SectionView key={`${section.type ?? "section"}-${index}`} section={section} />
      ))}
    </View>
  );
}

function SectionView({ section }: { section: ContentSection }) {
  switch (section.type) {
    case "table":
      return <DocumentTable section={section} />;
    case "faq":
      return <DocumentFaq section={section} />;
    case "source_links":
      return <SourceLinks section={section} />;
    case "numbered_steps":
      return <Steps section={section} />;
    case "hero":
      return <HeroSection section={section} />;
    case "warning":
    case "callout":
    case "quick_answer":
      return <Callout section={section} />;
    default:
      return <TextSection section={section} />;
  }
}

function SectionTitle({ title, color = Palette.ink }: { title?: string; color?: string }) {
  if (!title) {
    return null;
  }

  return <Text style={[styles.sectionTitle, { color }]}>{title}</Text>;
}

function TextSection({ section }: { section: ContentSection }) {
  const items = Array.isArray(section.items) ? section.items : [];
  const isChecklist = section.type === "checklist";

  return (
    <View style={styles.card}>
      <SectionTitle title={section.title} />
      {section.content ? <Text style={styles.body}>{section.content}</Text> : null}
      {items.length > 0 ? <ItemList items={items} variant={isChecklist ? "check" : "dot"} /> : null}
    </View>
  );
}

function ItemList({
  items,
  variant,
  light = false,
}: {
  items: unknown[];
  variant: "check" | "dot";
  light?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = items.length > COLLAPSED_ITEM_LIMIT + 3;
  const visibleItems = isLong && !isExpanded ? items.slice(0, COLLAPSED_ITEM_LIMIT) : items;

  return (
    <Animated.View layout={LinearTransition.duration(220)} style={styles.items}>
      {visibleItems.map((item, index) => (
        <View key={`${stringifyValue(item)}-${index}`} style={styles.itemRow}>
          {variant === "check" ? (
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark" size={12} color={Palette.white} />
            </View>
          ) : (
            <View style={[styles.dot, light && { backgroundColor: Palette.gold }]} />
          )}
          <Text style={[styles.itemText, light && styles.lightText]}>{stringifyValue(item)}</Text>
        </View>
      ))}
      {isLong ? (
        <PressableScale
          onPress={() => setIsExpanded((current) => !current)}
          haptic="selection"
          style={styles.expand}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? "Show fewer items" : `Show all ${items.length} items`}
        >
          <Text style={styles.expandText}>
            {isExpanded ? "Show less" : `Show all ${items.length}`}
          </Text>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={15} color={Palette.primary} />
        </PressableScale>
      ) : null}
    </Animated.View>
  );
}

function Steps({ section }: { section: ContentSection }) {
  const items = Array.isArray(section.items) ? section.items : [];

  return (
    <View style={styles.card}>
      <SectionTitle title={section.title} />
      {section.content ? <Text style={styles.body}>{section.content}</Text> : null}
      <View style={styles.steps}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <View key={`${stringifyValue(item)}-${index}`} style={styles.stepRow}>
              <View style={styles.stepRail}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                {!isLast ? <View style={styles.stepLine} /> : null}
              </View>
              <Text style={[styles.itemText, styles.stepText, !isLast && styles.stepTextGap]}>
                {stringifyValue(item)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const calloutTones = {
  quick_answer: {
    bg: Palette.tint,
    accent: Palette.primary,
    icon: "flash" as const,
    label: "Quick answer",
  },
  callout: {
    bg: Palette.tint,
    accent: Palette.primary,
    icon: "bulb" as const,
    label: "Good to know",
  },
  warning: {
    bg: Palette.warningTint,
    accent: Palette.warning,
    icon: "warning" as const,
    label: "Important",
  },
};

function Callout({ section }: { section: ContentSection }) {
  const tone = calloutTones[(section.type as keyof typeof calloutTones) ?? "callout"] ?? calloutTones.callout;
  const items = Array.isArray(section.items) ? section.items : [];

  return (
    <View style={[styles.callout, { backgroundColor: tone.bg }]}>
      <View style={styles.calloutHeader}>
        <View style={[styles.calloutIcon, { backgroundColor: tone.accent }]}>
          <Ionicons name={tone.icon} size={13} color={Palette.white} />
        </View>
        <Text style={[styles.calloutLabel, { color: tone.accent }]}>{tone.label}</Text>
      </View>
      <SectionTitle title={section.title} />
      {section.content ? <Text style={[styles.body, styles.calloutBody]}>{section.content}</Text> : null}
      {items.length > 0 ? <ItemList items={items} variant="dot" /> : null}
    </View>
  );
}

function HeroSection({ section }: { section: ContentSection }) {
  const items = Array.isArray(section.items) ? section.items : [];

  return (
    <View style={styles.hero}>
      <GradientFill colors={NavyGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <SectionTitle title={section.title} color={Palette.white} />
      {section.content ? <Text style={[styles.body, styles.lightText]}>{section.content}</Text> : null}
      {items.length > 0 ? <ItemList items={items} variant="dot" light /> : null}
    </View>
  );
}

function SourceLinks({ section }: { section: ContentSection }) {
  const items = Array.isArray(section.items) ? section.items : [];

  return (
    <View style={styles.card}>
      <SectionTitle title={section.title ?? "Official sources"} />
      <View style={styles.links}>
        {items.map((item, index) => {
          const source = item as { label?: unknown; url?: unknown };
          const url = stringifyValue(source.url);
          const label = stringifyValue(source.label) || url;

          return (
            <PressableScale
              key={`${url}-${index}`}
              onPress={() => {
                if (url) {
                  void openExternal(url);
                }
              }}
              haptic="selection"
              scaleTo={0.98}
              style={styles.link}
              accessibilityRole="link"
              accessibilityLabel={`Open ${label}`}
            >
              <View style={styles.linkIcon}>
                <Ionicons name="globe-outline" size={17} color={Palette.primary} />
              </View>
              <View style={styles.linkText}>
                <Text style={styles.linkLabel} numberOfLines={2}>
                  {label}
                </Text>
                {url ? (
                  <Text style={styles.linkHost} numberOfLines={1}>
                    {getUrlHost(url)}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="open-outline" size={16} color={Palette.subtle} />
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
  lead: {
    fontFamily: FontFamily.body,
    fontSize: 17,
    lineHeight: 27,
    color: Palette.inkSoft,
    marginBottom: 6,
  },
  card: {
    padding: 18,
    borderRadius: Radii.xl,
    backgroundColor: Palette.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.hairline,
  },
  sectionTitle: {
    ...Type.title3,
    marginBottom: 8,
  },
  body: {
    ...Type.body,
    color: "#3B4459",
  },
  items: {
    marginTop: 10,
    gap: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  dot: {
    width: 6,
    height: 6,
    marginTop: 9,
    marginLeft: 4,
    borderRadius: 3,
    backgroundColor: Palette.primary,
  },
  checkIcon: {
    width: 20,
    height: 20,
    marginTop: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.success,
  },
  itemText: {
    ...Type.body,
    flex: 1,
    color: "#3B4459",
  },
  lightText: {
    color: "rgba(255,255,255,0.84)",
  },
  expand: {
    marginTop: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Palette.tint,
  },
  expandText: {
    ...Type.label,
    color: Palette.primary,
  },
  steps: {
    marginTop: 12,
  },
  stepRow: {
    flexDirection: "row",
    gap: 14,
  },
  stepRail: {
    alignItems: "center",
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.primary,
  },
  stepNumberText: {
    fontFamily: FontFamily.displayBold,
    fontSize: 13,
    color: Palette.white,
  },
  stepLine: {
    flex: 1,
    width: 2,
    marginVertical: 4,
    borderRadius: 1,
    backgroundColor: Palette.tintStrong,
  },
  stepText: {
    paddingTop: 2,
  },
  stepTextGap: {
    paddingBottom: 18,
  },
  callout: {
    padding: 18,
    borderRadius: Radii.xl,
  },
  calloutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  calloutIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  calloutLabel: {
    ...Type.overline,
  },
  calloutBody: {
    color: Palette.inkSoft,
  },
  hero: {
    overflow: "hidden",
    padding: 20,
    borderRadius: Radii.xl,
    backgroundColor: Palette.navy,
  },
  links: {
    marginTop: 4,
    gap: 8,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: Radii.md,
    backgroundColor: Palette.cardMuted,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.tint,
  },
  linkText: {
    flex: 1,
    minWidth: 0,
  },
  linkLabel: {
    ...Type.label,
    color: Palette.ink,
  },
  linkHost: {
    ...Type.caption,
    marginTop: 2,
    color: Palette.muted,
  },
});
