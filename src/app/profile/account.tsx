import { useClerk, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

import { ConfirmSheet } from "@/components/ui/confirm-sheet";
import { FadeInView } from "@/components/ui/fade-in-view";
import { ListGroup, ListRow } from "@/components/ui/list-group";
import { StackScreen } from "@/components/ui/stack-screen";
import { useAuthAccess } from "@/features/auth/access";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { clearCachedAuthSnapshot } from "@/lib/local-storage";
import { showErrorToast } from "@/lib/toast";

export default function ProfileAccountScreen() {
  return (
    <PremiumGuard>
      <ProfileAccountContent />
    </PremiumGuard>
  );
}

function ProfileAccountContent() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { profile, hasPremiumAccess } = useAuthAccess();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const email = profile?.email ?? user?.primaryEmailAddress?.emailAddress ?? "—";

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      clearCachedAuthSnapshot();
      await signOut();
      setIsConfirmOpen(false);
    } catch (error) {
      console.warn("Unable to sign out", error);
      showErrorToast("Couldn’t sign out", "Please try again in a moment.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <StackScreen title="Account" subtitle="Manage your profile, security and session.">
      <FadeInView index={0}>
        <ListGroup title="Details">
          <ListRow icon="mail-outline" tone="neutral" title="Email" subtitle={email} />
          <ListRow
            icon="sparkles-outline"
            tone="gold"
            title="Plan"
            value={hasPremiumAccess ? "Premium" : "Free"}
          />
        </ListGroup>
      </FadeInView>

      <FadeInView index={1} style={styles.group}>
        <ListGroup title="Manage">
          <ListRow
            icon="create-outline"
            title="Edit profile"
            subtitle="Update your first and last name"
            onPress={() => router.push("/profile/edit")}
          />
          <ListRow
            icon="lock-closed-outline"
            title="Change password"
            subtitle="Keep your account secure"
            onPress={() => router.push("/profile/change-password")}
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
        onConfirm={handleSignOut}
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
