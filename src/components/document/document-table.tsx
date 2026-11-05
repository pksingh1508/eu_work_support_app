import { StyleSheet, Text, View } from "react-native";

import { useArticleStyles } from "@/components/document/article-theme";
import { RichText } from "@/components/document/rich-text";
import { Palette, Radii } from "@/constants/theme";

type DocumentTableProps = {
  title?: string;
  columns: string[];
  rows: string[][];
};

/**
 * Phone-friendly tables. Two columns read as a label / value list; wider
 * tables become one card per row with every value labelled by its column, so
 * nothing needs horizontal scrolling.
 */
export function DocumentTable({ title, columns, rows }: DocumentTableProps) {
  const styles = useArticleStyles();
  const columnCount = Math.max(columns.length, ...rows.map((row) => row.length));

  return (
    <View style={layout.wrapper}>
      {title ? <Text style={[styles.h3, layout.title]}>{title}</Text> : null}

      {columnCount <= 2 ? (
        <View style={layout.card}>
          {rows.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={[layout.pair, rowIndex < rows.length - 1 && layout.divider]}
            >
              <Text selectable style={styles.cellTitle}>
                {row[0]}
              </Text>
              {row[1] ? <RichText text={row[1]} style={[styles.body, layout.pairValue]} /> : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={layout.stack}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={layout.card}>
              <View style={layout.rowCard}>
                <Text selectable style={styles.cellTitle}>
                  {row[0]}
                </Text>
                {row.slice(1).map((cell, cellIndex) =>
                  cell ? (
                    <View key={cellIndex} style={layout.field}>
                      {columns[cellIndex + 1] ? (
                        <Text style={styles.label}>{columns[cellIndex + 1]}</Text>
                      ) : null}
                      <RichText text={cell} style={styles.body} />
                    </View>
                  ) : null,
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const layout = StyleSheet.create({
  wrapper: {
    marginTop: 8,
  },
  title: {
    marginBottom: 12,
  },
  card: {
    overflow: "hidden",
    borderRadius: Radii.lg,
    backgroundColor: Palette.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,16,36,0.1)",
  },
  pair: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pairValue: {
    marginTop: 4,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.divider,
  },
  stack: {
    gap: 10,
  },
  rowCard: {
    padding: 16,
    gap: 10,
  },
  field: {
    gap: 2,
  },
});
