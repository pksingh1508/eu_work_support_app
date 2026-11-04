import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Palette, Radii, Type } from "@/constants/theme";
import { stringifyValue, type ContentSection } from "@/features/documents/content";

const WIDE_COLUMN = 168;

/** Data table: fits the card for 1–2 columns, scrolls horizontally beyond that. */
export function DocumentTable({ section }: { section: ContentSection }) {
  const columns = Array.isArray(section.columns) ? section.columns : [];
  const rows = Array.isArray(section.rows) ? section.rows : [];
  const columnCount = Math.max(columns.length, ...rows.map((row) => row?.length ?? 0), 1);
  const isWide = columnCount > 2;
  const cellWidth = isWide ? WIDE_COLUMN : undefined;

  const table = (
    <View style={[styles.table, isWide && { width: WIDE_COLUMN * columnCount }]}>
      {columns.length > 0 ? (
        <View style={[styles.row, styles.headerRow]}>
          {columns.map((column, index) => (
            <Text
              key={`${column}-${index}`}
              style={[styles.headerCell, cellWidth ? { width: cellWidth } : styles.flexCell]}
            >
              {column}
            </Text>
          ))}
        </View>
      ) : null}
      {rows.map((row, rowIndex) => (
        <View
          key={`${section.title ?? "table"}-${rowIndex}`}
          style={[styles.row, rowIndex < rows.length - 1 && styles.rowDivider]}
        >
          {(Array.isArray(row) ? row : []).map((cell, cellIndex) => (
            <Text
              key={`${rowIndex}-${cellIndex}`}
              style={[
                styles.cell,
                cellIndex === 0 && styles.firstCell,
                cellWidth ? { width: cellWidth } : styles.flexCell,
              ]}
            >
              {stringifyValue(cell)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.card}>
      {section.title ? <Text style={styles.title}>{section.title}</Text> : null}
      {isWide ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroller}>
          {table}
        </ScrollView>
      ) : (
        table
      )}
      {isWide ? <Text style={styles.hint}>Swipe to see more columns</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: Radii.xl,
    backgroundColor: Palette.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.hairline,
  },
  title: {
    ...Type.title3,
    marginBottom: 12,
    color: Palette.ink,
  },
  scroller: {
    marginHorizontal: -2,
  },
  table: {
    overflow: "hidden",
    borderRadius: Radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,16,36,0.1)",
  },
  row: {
    flexDirection: "row",
  },
  headerRow: {
    backgroundColor: Palette.cardMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(10,16,36,0.1)",
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.divider,
  },
  flexCell: {
    flex: 1,
  },
  headerCell: {
    ...Type.overline,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: Palette.muted,
  },
  cell: {
    ...Type.callout,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#3B4459",
  },
  firstCell: {
    fontFamily: Type.label.fontFamily,
    color: Palette.ink,
  },
  hint: {
    ...Type.caption,
    marginTop: 10,
    color: Palette.subtle,
  },
});
