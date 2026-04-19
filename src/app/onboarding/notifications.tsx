import { useAuth, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useAuthProfile } from '@/features/auth/auth-profile';
import { OnboardingScreen } from '@/features/onboarding/components/onboarding-screen';
import { useOnboardingDraft } from '@/features/onboarding/onboarding-context';
import { supabase } from '@/lib/supabase';

function isSupabaseJwtDecodeError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'PGRST301'
  );
}

export default function OnboardingNotificationsScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const { user } = useUser();
  const { draft, updateDraft, resetDraft } = useOnboardingDraft();
  const { markOnboardingCompleted } = useAuthProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeOnboarding = async () => {
    if (!userId || isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await supabase.rpc('ensure_user_profile');

      const nationalityCountryCode = draft.nationalityCountryCode.trim().toUpperCase() || null;
      const residenceCountryCode = draft.residenceCountryCode.trim().toUpperCase() || null;
      const preferredLanguage = draft.preferredLanguage.trim().toLowerCase() || 'en';
      const destinationInterests = draft.destinationInterests
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      const { error: answersError } = await supabase.from('user_onboarding_answers').insert({
        clerk_user_id: userId,
        goal: draft.goal || 'other',
        nationality_country_code: nationalityCountryCode,
        residence_country_code: residenceCountryCode,
        notification_opt_in: draft.notificationOptIn,
        answers: {
          destination_interests: destinationInterests,
          preferred_language: preferredLanguage,
          email: user?.primaryEmailAddress?.emailAddress ?? null,
        },
      });

      if (answersError) {
        throw answersError;
      }

      const { error: profileError } = await supabase
        .from('app_users')
        .update({
          nationality_country_code: nationalityCountryCode,
          residence_country_code: residenceCountryCode,
          preferred_language: preferredLanguage,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          preferences: {
            goal: draft.goal || 'other',
            destination_interests: destinationInterests,
            notification_opt_in: draft.notificationOptIn,
          },
        })
        .eq('clerk_user_id', userId);

      if (profileError) {
        throw profileError;
      }

      markOnboardingCompleted();
      resetDraft();
      router.replace('/');
    } catch (submitError) {
      console.warn('Unable to complete onboarding', submitError);
      setError(
        isSupabaseJwtDecodeError(submitError)
          ? 'Supabase cannot verify the Clerk session yet. Enable Clerk under Supabase Auth > Third-Party Auth, then sign out and sign in again.'
          : 'We could not save onboarding yet. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingScreen
      eyebrow="Onboarding"
      title="Stay updated"
      description="Get useful reminders for saved documents and major guide updates. You can change this later."
      onBack={() => router.back()}>
      <Pressable
        onPress={() => updateDraft({ notificationOptIn: !draft.notificationOptIn })}
        className={`rounded-interactive px-4 py-4 ${
          draft.notificationOptIn ? 'bg-diplomatic-surfaceHigh' : 'bg-white'
        }`}>
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text className="text-base font-bold tracking-normal text-diplomatic-ink">
              Saved guide updates
            </Text>
            <Text className="mt-1 text-sm font-medium tracking-normal text-diplomatic-secondaryText">
              Notify me when important saved country documents change.
            </Text>
          </View>
          <Text className="text-base font-bold tracking-normal text-diplomatic-primary">
            {draft.notificationOptIn ? 'On' : 'Off'}
          </Text>
        </View>
      </Pressable>

      {error ? (
        <View className="rounded-interactive bg-[#FFEDEA] px-4 py-3">
          <Text className="text-sm font-semibold tracking-normal text-[#BA1A1A]">{error}</Text>
        </View>
      ) : null}

      <PrimaryButton
        label="Finish Setup"
        isLoading={isSubmitting}
        onPress={completeOnboarding}
      />
      <Pressable onPress={completeOnboarding} disabled={isSubmitting} className="items-center">
        <Text className="text-sm font-bold tracking-normal text-diplomatic-primary">
          Skip for now
        </Text>
      </Pressable>
    </OnboardingScreen>
  );
}
