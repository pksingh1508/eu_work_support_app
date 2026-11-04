import Ionicons from "@expo/vector-icons/Ionicons";
import { useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/button";
import { FadeInView } from "@/components/ui/fade-in-view";
import { InlineNotice } from "@/components/ui/inline-notice";
import { StackScreen } from "@/components/ui/stack-screen";
import { TextField } from "@/components/ui/text-field";
import { Elevation, Palette, Radii, Type } from "@/constants/theme";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { getAuthErrorMessage } from "@/features/auth/errors";
import { showSuccessToast } from "@/lib/toast";

type PasswordUser = {
  updatePassword: (params: {
    currentPassword: string;
    newPassword: string;
    signOutOfOtherSessions?: boolean;
  }) => Promise<unknown>;
};

export default function ChangePasswordScreen() {
  return (
    <PremiumGuard>
      <ChangePasswordContent />
    </PremiumGuard>
  );
}

function ChangePasswordContent() {
  const router = useRouter();
  const { user } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const updatePassword = async () => {
    if (isSubmitting) {
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    const passwordUser = user as unknown as PasswordUser | null;

    if (!passwordUser?.updatePassword) {
      setError("Unable to update password for this account.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await passwordUser.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions: true,
      });

      showSuccessToast("Password updated", "Your new password is active.");
      router.back();
    } catch (authError) {
      setError(
        getAuthErrorMessage(authError, "Unable to change your password."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StackScreen
      title="Change password"
      subtitle="Choose a strong password you don’t use anywhere else."
      keyboardAware
      footer={
        <Button
          label="Update password"
          icon="shield-checkmark-outline"
          isLoading={isSubmitting}
          disabled={!currentPassword || !newPassword || !confirmPassword}
          onPress={updatePassword}
        />
      }
    >
      {error ? <InlineNotice tone="error" message={error} style={styles.notice} /> : null}

      <FadeInView style={styles.card}>
        <TextField
          label="Current password"
          icon="lock-closed-outline"
          isPassword
          value={currentPassword}
          onChangeText={setCurrentPassword}
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          placeholder="Enter current password"
          returnKeyType="next"
          onSubmitEditing={() => newPasswordRef.current?.focus()}
          submitBehavior="submit"
        />
        <View style={styles.divider} />
        <TextField
          ref={newPasswordRef}
          label="New password"
          icon="key-outline"
          isPassword
          value={newPassword}
          onChangeText={setNewPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="At least 8 characters"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          submitBehavior="submit"
        />
        <PasswordStrength password={newPassword} />
        <TextField
          ref={confirmRef}
          label="Confirm new password"
          icon="key-outline"
          isPassword
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="Repeat new password"
          returnKeyType="done"
          onSubmitEditing={updatePassword}
          error={
            confirmPassword.length > 0 && newPassword !== confirmPassword
              ? "Passwords don’t match yet"
              : null
          }
        />
      </FadeInView>

      <View style={styles.tip}>
        <Ionicons name="information-circle-outline" size={16} color={Palette.muted} />
        <Text style={styles.tipText}>Changing your password signs you out on other devices.</Text>
      </View>
    </StackScreen>
  );
}

function getStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  return Math.min(4, score);
}

const strengthLabels = ["Too short", "Weak", "Fair", "Good", "Strong"];
const strengthColors = [Palette.faint, Palette.danger, Palette.warning, Palette.primary, Palette.success];

function PasswordStrength({ password }: { password: string }) {
  if (!password) {
    return null;
  }

  const score = getStrength(password);

  return (
    <View style={styles.strength} accessibilityLabel={`Password strength: ${strengthLabels[score]}`}>
      <View style={styles.strengthBars}>
        {[1, 2, 3, 4].map((bar) => (
          <View
            key={bar}
            style={[
              styles.strengthBar,
              { backgroundColor: bar <= score ? strengthColors[score] : Palette.well },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color: strengthColors[score] }]}>
        {strengthLabels[score]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    marginBottom: 16,
  },
  card: {
    gap: 18,
    padding: 20,
    borderRadius: Radii.xxl,
    backgroundColor: Palette.card,
    ...Elevation.card,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.hairline,
  },
  strength: {
    marginTop: -8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  strengthBars: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    ...Type.caption,
    fontFamily: Type.label.fontFamily,
  },
  tip: {
    marginTop: 16,
    marginHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tipText: {
    ...Type.footnote,
    flex: 1,
    color: Palette.muted,
  },
});
