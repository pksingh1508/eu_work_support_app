import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/ui/sheet";
import { Palette, Type } from "@/constants/theme";

type ConfirmSheetProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: "danger" | "primary";
  isLoading?: boolean;
};

/** Action-sheet style confirmation, replacing native alert dialogs. */
export function ConfirmSheet({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  icon = "alert-circle-outline",
  tone = "danger",
  isLoading = false,
}: ConfirmSheetProps) {
  const isDanger = tone === "danger";

  return (
    <AppSheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <View style={[styles.iconHalo, isDanger ? styles.haloDanger : styles.haloPrimary]}>
          <View style={[styles.iconInner, isDanger ? styles.innerDanger : styles.innerPrimary]}>
            <Ionicons name={icon} size={26} color={isDanger ? Palette.danger : Palette.primary} />
          </View>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <View style={styles.actions}>
        <Button
          label={confirmLabel}
          variant={isDanger ? "danger" : "primary"}
          isLoading={isLoading}
          onPress={onConfirm}
        />
        <Button label={cancelLabel} variant="outline" disabled={isLoading} onPress={onClose} />
      </View>
    </AppSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    paddingTop: 14,
    paddingHorizontal: 8,
  },
  iconHalo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  haloDanger: {
    backgroundColor: Palette.dangerTint,
  },
  haloPrimary: {
    backgroundColor: Palette.tint,
  },
  iconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  innerDanger: {
    backgroundColor: "#FFD9DC",
  },
  innerPrimary: {
    backgroundColor: Palette.tintStrong,
  },
  title: {
    ...Type.title2,
    marginTop: 18,
    textAlign: "center",
    color: Palette.ink,
  },
  message: {
    ...Type.body,
    marginTop: 8,
    textAlign: "center",
    color: Palette.muted,
  },
  actions: {
    marginTop: 28,
    gap: 10,
  },
});
