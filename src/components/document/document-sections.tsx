import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { useArticleStyles } from "@/components/document/article-theme";
import { DocumentFaq } from "@/components/document/document-faq";
import { DocumentTable } from "@/components/document/document-table";
import { RichText } from "@/components/document/rich-text";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Palette, Radii, Type } from "@/constants/theme";
import type { Article, ArticleBlock, CalloutTone } from "@/features/documents/article";
import { getUrlHost } from "@/features/documents/content";
import { FontFamily } from "@/lib/fonts";
import { openExternal } from "@/lib/open-external";

type DocumentArticleProps = {
  article: Article;
  /** Reports each titled section's y offset (relative to the article) for the contents jump list. */
  onSectionLayout?: (id: string, y: number) => void;
};

const COLLAPSED_ITEM_LIMIT = 12;

/** Renders a guide as one continuous, editorial reading flow. */
export function DocumentArticle({ article, onSectionLayout }: DocumentArticleProps) {
  const styles = useArticleStyles();

  return (
    <View>
      {article.headline ? (
        <Text selectable style={[styles.headline, layout.headline]} accessibilityRole="header">
          {article.headline}
        </Text>
      ) : null}
      {article.lead ? <RichText text={article.lead} style={styles.lead} emphasize={false} /> : null}

      {article.sections.map((section, index) => (
        <View
          key={section.id}
          style={index === 0 && !section.title ? layout.firstSection : layout.section}
          onLayout={
            section.title && onSectionLayout
              ? (event: LayoutChangeEvent) => onSectionLayout(section.id, event.nativeEvent.layout.y)
              : undefined
          }
        >
          {section.title ? (
            <View style={layout.h2Row}>
              <View style={layout.h2Bar} />
              <Text style={[styles.h2, layout.h2Text]} accessibilityRole="header">
                {section.title}
              </Text>
            </View>
          ) : null}
          <Blocks blocks={section.blocks} />
        </View>
      ))}
    </View>
  );
}

function blockSpacing(block: ArticleBlock, previous: ArticleBlock | undefined) {
  if (!previous) {
    return 0;
  }

  switch (block.kind) {
    case "paragraph":
      return previous.kind === "subheading" ? 6 : 14;
    case "list":
      return previous.kind === "paragraph" ? 10 : 14;
    case "subheading":
      return 24;
    case "step":
      return previous.kind === "step" ? 0 : 20;
    default:
      return 20;
  }
}

function Blocks({ blocks, tone }: { blocks: ArticleBlock[]; tone?: "callout" }) {
  return (
    <>
      {blocks.map((block, index) => (
        <View key={index} style={{ marginTop: blockSpacing(block, blocks[index - 1]) }}>
          <Block block={block} tone={tone} />
        </View>
      ))}
    </>
  );
}

function Block({ block, tone }: { block: ArticleBlock; tone?: "callout" }) {
  const styles = useArticleStyles();
  const bodyStyle = tone === "callout" ? [styles.body, { color: Palette.inkSoft }] : styles.body;

  switch (block.kind) {
    case "paragraph":
      return <RichText text={block.text} style={bodyStyle} />;
    case "subheading":
      return (
        <Text selectable style={styles.h3} accessibilityRole="header">
          {block.text}
        </Text>
      );
    case "list":
      return <ItemList items={block.items} variant={block.variant} />;
    case "steps":
      return <NumberedSteps items={block.items} />;
    case "step":
      return <StepBlock block={block} />;
    case "callout":
      return <Callout tone={block.tone} title={block.title} blocks={block.blocks} />;
    case "table":
      return <DocumentTable title={block.title} columns={block.columns} rows={block.rows} />;
    case "faq":
      return <DocumentFaq items={block.items} />;
    case "sources":
      return <SourceLinks items={block.items} />;
  }
}

function ItemList({ items, variant }: { items: string[]; variant: "check" | "dot" }) {
  const styles = useArticleStyles();
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = items.length > COLLAPSED_ITEM_LIMIT + 3;
  const visibleItems = isLong && !isExpanded ? items.slice(0, COLLAPSED_ITEM_LIMIT) : items;
  const lineHeight = styles.body.lineHeight ?? 26;

  return (
    <View style={layout.items}>
      {visibleItems.map((item, index) => (
        <View key={`${item}-${index}`} style={layout.itemRow}>
          {variant === "check" ? (
            <View style={[layout.checkIcon, { marginTop: (lineHeight - 20) / 2 }]}>
              <Ionicons name="checkmark" size={12} color={Palette.white} />
            </View>
          ) : (
            <View style={[layout.dot, { marginTop: (lineHeight - 6) / 2 }]} />
          )}
          <RichText text={item} style={[styles.body, layout.itemText]} />
        </View>
      ))}
      {isLong ? (
        <PressableScale
          onPress={() => setIsExpanded((current) => !current)}
          haptic="selection"
          style={layout.expand}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? "Show fewer items" : `Show all ${items.length} items`}
        >
          <Text style={layout.expandText}>{isExpanded ? "Show less" : `Show all ${items.length}`}</Text>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={15} color={Palette.primary} />
        </PressableScale>
      ) : null}
    </View>
  );
}

function NumberedSteps({ items }: { items: string[] }) {
  const styles = useArticleStyles();

  return (
    <View>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <View key={`${item}-${index}`} style={layout.stepRow}>
            <View style={layout.stepRail}>
              <View style={layout.stepNumber}>
                <Text style={layout.stepNumberText}>{index + 1}</Text>
              </View>
              {!isLast ? <View style={layout.stepLine} /> : null}
            </View>
            <RichText text={item} style={[styles.body, layout.stepBody, !isLast && layout.stepGap]} />
          </View>
        );
      })}
    </View>
  );
}

function StepBlock({ block }: { block: Extract<ArticleBlock, { kind: "step" }> }) {
  const styles = useArticleStyles();

  return (
    <View style={layout.stepRow}>
      <View style={layout.stepRail}>
        <View style={layout.stepNumber}>
          <Text style={layout.stepNumberText}>{block.number}</Text>
        </View>
        {!block.isLast ? <View style={layout.stepLine} /> : null}
      </View>
      <View style={[layout.stepContent, !block.isLast && layout.stepGap]}>
        <Text selectable style={[styles.h3, layout.stepTitle]} accessibilityRole="header">
          {block.title}
        </Text>
        <Blocks blocks={block.blocks} />
      </View>
    </View>
  );
}

const calloutTones: Record<
  CalloutTone,
  { bg: string; accent: string; icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  quick_answer: { bg: Palette.tint, accent: Palette.primary, icon: "flash", label: "Quick answer" },
  callout: { bg: Palette.tint, accent: Palette.primary, icon: "bulb", label: "Good to know" },
  warning: { bg: Palette.warningTint, accent: Palette.warning, icon: "warning", label: "Important" },
};

function Callout({ tone, title, blocks }: { tone: CalloutTone; title?: string; blocks: ArticleBlock[] }) {
  const styles = useArticleStyles();
  const palette = calloutTones[tone];

  return (
    <View style={[layout.callout, { backgroundColor: palette.bg, borderLeftColor: palette.accent }]}>
      <View style={layout.calloutHeader}>
        <Ionicons name={palette.icon} size={15} color={palette.accent} />
        <Text style={[layout.calloutLabel, { color: palette.accent }]}>{palette.label}</Text>
      </View>
      {title ? <Text style={[styles.h3, layout.calloutTitle]}>{title}</Text> : null}
      <Blocks blocks={blocks} tone="callout" />
    </View>
  );
}

function SourceLinks({ items }: { items: { label: string; url: string }[] }) {
  return (
    <View style={layout.links}>
      {items.map((item, index) => (
        <PressableScale
          key={`${item.url}-${index}`}
          onPress={() => void openExternal(item.url)}
          haptic="selection"
          scaleTo={0.98}
          style={layout.link}
          accessibilityRole="link"
          accessibilityLabel={`Open ${item.label}`}
        >
          <View style={layout.linkIcon}>
            <Ionicons name="globe-outline" size={17} color={Palette.primary} />
          </View>
          <View style={layout.linkText}>
            <Text style={layout.linkLabel} numberOfLines={2}>
              {item.label}
            </Text>
            <Text style={layout.linkHost} numberOfLines={1}>
              {getUrlHost(item.url)}
            </Text>
          </View>
          <Ionicons name="open-outline" size={16} color={Palette.muted} />
        </PressableScale>
      ))}
    </View>
  );
}

const layout = StyleSheet.create({
  headline: {
    marginBottom: 12,
  },
  firstSection: {
    marginTop: 20,
  },
  section: {
    marginTop: 40,
  },
  h2Row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  h2Bar: {
    width: 3,
    alignSelf: "stretch",
    maxHeight: 24,
    marginTop: 2,
    borderRadius: 2,
    backgroundColor: Palette.primary,
  },
  h2Text: {
    flex: 1,
  },
  items: {
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
    marginLeft: 4,
    borderRadius: 3,
    backgroundColor: Palette.primary,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.success,
  },
  itemText: {
    flex: 1,
  },
  expand: {
    marginTop: 2,
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
    marginVertical: 6,
    borderRadius: 1,
    backgroundColor: Palette.tintStrong,
  },
  stepBody: {
    flex: 1,
    paddingTop: 1,
  },
  stepContent: {
    flex: 1,
    minWidth: 0,
  },
  stepTitle: {
    paddingTop: 2,
    marginBottom: 6,
  },
  stepGap: {
    paddingBottom: 24,
  },
  callout: {
    padding: 16,
    paddingLeft: 16,
    borderRadius: Radii.md,
    borderLeftWidth: 3,
  },
  calloutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 8,
  },
  calloutLabel: {
    ...Type.overline,
  },
  calloutTitle: {
    marginBottom: 6,
  },
  links: {
    gap: 8,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: Radii.md,
    backgroundColor: Palette.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,16,36,0.1)",
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
