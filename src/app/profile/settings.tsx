import { useClerk } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Switch } from "react-native";

import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { FadeInView } from "@/components/ui/fade-in-view";
import { ListGroup, ListRow } from "@/components/ui/list-group";
import { StackScreen } from "@/components/ui/stack-screen";
import { Palette } from "@/constants/theme";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { haptics } from "@/lib/haptics";
import { clearCachedAuthSnapshot } from "@/lib/local-storage";

export default function ProfileSettingsScreen() {
  return (
    <PremiumGuard>
      <ProfileSettingsContent />
    </PremiumGuard>
  );
}

function ProfileSettingsContent() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      clearCachedAuthSnapshot();
      await signOut();
      setIsConfirmOpen(false);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <StackScreen title="Settings">
      <FadeInView>
        <ListGroup title="Preferences">
          <ListRow icon="language-outline" title="Language" value="English" />
          <ListRow
            icon="notifications-outline"
            tone="gold"
            title="Notifications"
            subtitle="Visa updates and reminders"
            trailing={
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => {
                  haptics.selection();
                  setNotificationsEnabled(value);
                }}
                trackColor={{ false: Palette.faint, true: Palette.primary }}
                thumbColor={Palette.white}
              />
            }
          />
        </ListGroup>
      </FadeInView>

      <FadeInView index={1} style={styles.group}>
        <ListGroup title="About">
          <ListRow
            icon="document-text-outline"
            title="Terms and conditions"
            onPress={() => router.push("/profile/legal/terms-and-conditions")}
          />
          <ListRow
            icon="help-buoy-outline"
            tone="success"
            title="Help centre"
            onPress={() => router.push("/profile/help")}
          />
        </ListGroup>
      </FadeInView>

      <FadeInView index={2} style={styles.group}>
        <ListGroup>
          <ListRow
            icon="log-out-outline"
            title="Sign out"
            destructive
            showChevron={false}
            onPress={() => setIsConfirmOpen(true)}
          />
        </ListGroup>
      </FadeInView>

      <ConfirmSheet
        visible={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleLogout}
        isLoading={isSigningOut}
        icon="log-out-outline"
        title="Sign out?"
        message="You’ll need to login again to access your saved guides."
        confirmLabel="Sign out"
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  group: {
    marginTop: 26,
  },
});
