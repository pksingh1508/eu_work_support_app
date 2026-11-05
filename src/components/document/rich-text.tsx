import { memo, useMemo } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";

import { useArticleStyles } from "@/components/document/article-theme";
import { parseInline } from "@/features/documents/article";
import { openExternal, openMail } from "@/lib/open-external";

type RichTextProps = {
  text: string;
  style?: StyleProp<TextStyle>;
  /** Bold money amounts and deadlines so they stand out while scanning. */
  emphasize?: boolean;
};

/**
 * Body text with tappable links / e-mail addresses and emphasised amounts and
 * time limits. Selectable, so addresses and reference numbers can be copied.
 */
function RichTextBase({ text, style, emphasize = true }: RichTextProps) {
  const styles = useArticleStyles();
  const segments = useMemo(() => parseInline(text), [text]);

  return (
    <Text selectable style={style}>
      {segments.map((segment, index) => {
        if (segment.kind === "link") {
          const isMail = segment.url.startsWith("mailto:");
          return (
            <Text
              key={index}
              style={styles.link}
              accessibilityRole="link"
              onPress={() =>
                isMail
                  ? void openMail(segment.url.replace("mailto:", ""), "")
                  : void openExternal(segment.url)
              }
            >
              {segment.text}
            </Text>
          );
        }

        if (segment.kind === "strong" && emphasize) {
          return (
            <Text key={index} style={styles.bodyStrong}>
              {segment.text}
            </Text>
          );
        }

        return segment.text;
      })}
    </Text>
  );
}

export const RichText = memo(RichTextBase);
