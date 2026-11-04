import Ionicons from "@expo/vector-icons/Ionicons";
import { useClerk, useUser } from "@clerk/expo";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { FadeInView } from "@/components/ui/fade-in-view";
import { StackScreen } from "@/components/ui/stack-screen";
import { Palette, Radii, Type } from "@/constants/theme";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { clearCachedAuthSnapshot } from "@/lib/local-storage";
import { showErrorToast } from "@/lib/toast";

type DeletableUser = {
  delete: () => Promise<unknown>;
};

const consequences = [
  "Your profile and sign-in will be removed",
  "Saved countries and guides will be deleted",
  "This can’t be undone",
];

export default function DangerZoneScreen() {
  return (
    <PremiumGuard>
      <DangerZoneContent />
    </PremiumGuard>
  );
}

function DangerZoneContent() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAccount = async () => {
    const deletableUser = user as unknown as DeletableUser | null;

    if (!deletableUser?.delete) {
      setIsConfirmOpen(false);
      showErrorToast("Unable to delete account", "Please contact support to delete this account.");
      return;
    }

    setIsDeleting(true);

    try {
      await deletableUser.delete();
      clearCachedAuthSnapshot();
      await signOut();
      setIsConfirmOpen(false);
    } catch (error) {
      console.warn("Unable to delete account", error);
      showErrorToast("Unable to delete account", "Please try again or contact support.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <StackScreen title="Danger zone" subtitle="Irreversible actions for your account.">
      <FadeInView index={0} style={styles.card}>
        <View style={styles.iconHalo}>
          <Ionicons name="trash-outline" size={24} color={Palette.danger} />
        </View>
        <Text style={styles.title}>Delete account</Text>
        <Text style={styles.body}>
          Permanently remove your EU Work Support account and everything associated with it.
        </Text>

        <View style={styles.list}>
          {consequences.map((item) => (
            <View key={item} style={styles.listRow}>
              <Ionicons name="close-circle" size={17} color={Palette.danger} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        <Button
          label="Delete my account"
          variant="danger"
          icon="trash-outline"
          onPress={() => setIsConfirmOpen(true)}
          style={styles.button}
        />
      </FadeInView>

      <ConfirmSheet
        visible={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={deleteAccount}
        isLoading={isDeleting}
        icon="trash-outline"
        title="Delete your account?"
        message="This permanently deletes your account and saved guides. This action can’t be undone."
        confirmLabel="Delete permanently"
        cancelLabel="Keep my account"
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: Radii.xxl,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: "#FFD3D6",
  },
  iconHalo: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.dangerTint,
  },
  title: {
    ...Type.title2,
    marginTop: 16,
    color: Palette.ink,
  },
  body: {
    ...Type.body,
    marginTop: 6,
    color: Palette.muted,
  },
  list: {
    marginTop: 18,
    gap: 10,
    padding: 14,
    borderRadius: Radii.md,
    backgroundColor: Palette.cardMuted,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  listText: {
    ...Type.callout,
    flex: 1,
    color: Palette.inkSoft,
  },
  button: {
    marginTop: 22,
  },
});
