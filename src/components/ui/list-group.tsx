import Ionicons from "@expo/vector-icons/Ionicons";
import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { PressableScale } from "@/components/ui/pressable-scale";
import { Elevation, Palette, Radii, Type } from "@/constants/theme";

type ListGroupProps = {
  title?: string;
  footer?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Inset grouped list, the native "settings" pattern with soft hairline separators. */
export function ListGroup({ title, footer, children, style }: ListGroupProps) {
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <View style={style}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <View style={[styles.card, Elevation.card]}>
        {rows.map((row, index) => (
          <Fragment key={row.key ?? index}>
            {row}
            {index < rows.length - 1 ? <View style={styles.separator} /> : null}
          </Fragment>
        ))}
      </View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

type RowTone = "primary" | "gold" | "success" | "danger" | "neutral";

const toneColors: Record<RowTone, { bg: string; fg: string }> = {
  primary: { bg: Palette.tint, fg: Palette.primary },
  gold: { bg: Palette.goldSoft, fg: Palette.goldInk },
  success: { bg: Palette.successTint, fg: Palette.success },
  danger: { bg: Palette.dangerTint, fg: Palette.danger },
  neutral: { bg: Palette.well, fg: Palette.inkSoft },
};

type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: RowTone;
  value?: string;
  destructive?: boolean;
  trailing?: ReactNode;
  showChevron?: boolean;
  external?: boolean;
  onPress?: () => void;
  accessibilityHint?: string;
};

export function ListRow({
  title,
  subtitle,
  icon,
  tone = "primary",
  value,
  destructive = false,
  trailing,
  showChevron,
  external = false,
  onPress,
  accessibilityHint,
}: ListRowProps) {
  const colors = toneColors[destructive ? "danger" : tone];
  const hasChevron = showChevron ?? Boolean(onPress && !trailing);

  const content = (
    <>
      {icon ? (
        <View style={[styles.iconTile, { backgroundColor: colors.bg }]}>
          <Ionicons name={icon} size={19} color={colors.fg} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text
          style={[styles.title, destructive && { color: Palette.danger }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {trailing}
      {hasChevron ? (
        <Ionicons
          name={external ? "open-outline" : "chevron-forward"}
          size={external ? 16 : 18}
          color={destructive ? Palette.danger : Palette.faint}
        />
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.row} accessible accessibilityLabel={`${title}${value ? `, ${value}` : ""}`}>
        {content}
      </View>
    );
  }

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.985}
      dimOnPress
      haptic="selection"
      style={styles.row}
      accessibilityRole={external ? "link" : "button"}
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
    >
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  groupTitle: {
    ...Type.overline,
    marginBottom: 10,
    marginLeft: 6,
    color: Palette.muted,
  },
  card: {
    paddingVertical: 4,
    borderRadius: Radii.xl,
    backgroundColor: Palette.card,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 70,
    marginRight: 16,
    backgroundColor: "rgba(10,16,36,0.09)",
  },
  footer: {
    ...Type.caption,
    marginTop: 10,
    marginHorizontal: 6,
    color: Palette.muted,
  },
  row: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...Type.headline,
    color: Palette.ink,
  },
  subtitle: {
    ...Type.footnote,
    marginTop: 2,
    color: Palette.muted,
  },
  value: {
    ...Type.callout,
    maxWidth: "45%",
    color: Palette.muted,
  },
});
