import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { FormSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { FadeInView } from "@/components/ui/fade-in-view";
import { InlineNotice } from "@/components/ui/inline-notice";
import { StackScreen } from "@/components/ui/stack-screen";
import { TextField } from "@/components/ui/text-field";
import { Elevation, Palette, Radii, Type } from "@/constants/theme";
import { useAuthAccess } from "@/features/auth/access";
import { PremiumGuard } from "@/features/auth/components/premium-guard";
import { FontFamily } from "@/lib/fonts";
import { supabase } from "@/lib/supabase";
import { showSuccessToast } from "@/lib/toast";

type EditableProfile = {
  first_name: string | null;
  last_name: string | null;
};

export default function EditProfileScreen() {
  return (
    <PremiumGuard>
      <EditProfileContent />
    </PremiumGuard>
  );
}

function EditProfileContent() {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const { refreshProfile } = useAuthAccess();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastNameRef = useRef<TextInput>(null);
  const previewName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
  const initials = getInitials(firstName, lastName);

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      if (!userId) {
        setIsLoading(false);
        setError("Unable to load your account.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await supabase.rpc("ensure_user_profile");

        const { data, error: profileError } = await supabase
          .from("app_users")
          .select("first_name, last_name")
          .eq("clerk_user_id", userId)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        const profile = data as EditableProfile | null;

        if (isActive) {
          setFirstName(profile?.first_name ?? "");
          setLastName(profile?.last_name ?? "");
        }
      } catch (loadError) {
        console.warn("Unable to load editable profile", loadError);

        if (isActive) {
          setError("Unable to load your profile details.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, [userId]);

  const updateProfile = async () => {
    if (!userId || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const nextFirstName = firstName.trim() || null;
    const nextLastName = lastName.trim() || null;

    try {
      await supabase.rpc("ensure_user_profile");

      const { error: updateError } = await supabase
        .from("app_users")
        .update({
          first_name: nextFirstName,
          last_name: nextLastName,
          email: user?.primaryEmailAddress?.emailAddress ?? null,
        })
        .eq("clerk_user_id", userId);

      if (updateError) {
        throw updateError;
      }

      await refreshProfile();
      showSuccessToast("Profile updated", previewName || undefined);
      router.back();
    } catch (updateError) {
      console.warn("Unable to update profile", updateError);
      setError("Unable to update your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StackScreen
      title="Edit profile"
      subtitle="This is how your name appears across EU Work Support."
      keyboardAware
      footer={
        isLoading ? null : (
          <Button
            label="Save changes"
            icon="checkmark"
            isLoading={isSubmitting}
            onPress={updateProfile}
          />
        )
      }
    >
      {error ? <InlineNotice tone="error" message={error} style={styles.notice} /> : null}

      {isLoading ? (
        <FormSkeleton fields={2} />
      ) : (
        <FadeInView style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              {initials ? (
                <Text style={styles.avatarText}>{initials}</Text>
              ) : (
                <Ionicons name="person" size={24} color={Palette.white} />
              )}
            </View>
            <View style={styles.avatarText2}>
              <Text style={styles.previewName} numberOfLines={1}>
                {previewName || "Your name"}
              </Text>
              <Text style={styles.previewEmail} numberOfLines={1}>
                {user?.primaryEmailAddress?.emailAddress ?? ""}
              </Text>
            </View>
          </View>
          <TextField
            label="First name"
            icon="person-outline"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="given-name"
            textContentType="givenName"
            returnKeyType="next"
            onSubmitEditing={() => lastNameRef.current?.focus()}
            submitBehavior="submit"
          />
          <TextField
            ref={lastNameRef}
            label="Last name"
            icon="person-outline"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="family-name"
            textContentType="familyName"
            returnKeyType="done"
            onSubmitEditing={updateProfile}
          />
        </FadeInView>
      )}
    </StackScreen>
  );
}

function getInitials(first: string, last: string) {
  return `${first.trim().charAt(0)}${last.trim().charAt(0)}`.toUpperCase();
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
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.hairline,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.primary,
  },
  avatarText: {
    fontFamily: FontFamily.displayBold,
    fontSize: 20,
    color: Palette.white,
  },
  avatarText2: {
    flex: 1,
    minWidth: 0,
  },
  previewName: {
    ...Type.title3,
    color: Palette.ink,
  },
  previewEmail: {
    ...Type.footnote,
    marginTop: 2,
    color: Palette.muted,
  },
});
