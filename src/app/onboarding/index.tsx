import { useRouter } from 'expo-router';

import { FormField } from '@/components/ui/form-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { OnboardingScreen } from '@/features/onboarding/components/onboarding-screen';
import { useOnboardingDraft } from '@/features/onboarding/onboarding-context';

export default function OnboardingStartScreen() {
  const router = useRouter();
  const { draft, updateDraft } = useOnboardingDraft();

  return (
    <OnboardingScreen
      eyebrow="Onboarding"
      title="Start with your situation"
      description="A little context helps us surface the country documents that matter first.">
      <FormField
        label="Nationality country code"
        helper="Use a 2-letter code for now, for example IN, NP, PK, US."
        value={draft.nationalityCountryCode}
        onChangeText={(value) => updateDraft({ nationalityCountryCode: value.toUpperCase() })}
        autoCapitalize="characters"
        maxLength={2}
        placeholder="IN"
      />
      <FormField
        label="Current residence country code"
        helper="Use a 2-letter code for where you live now."
        value={draft.residenceCountryCode}
        onChangeText={(value) => updateDraft({ residenceCountryCode: value.toUpperCase() })}
        autoCapitalize="characters"
        maxLength={2}
        placeholder="IN"
      />
      <FormField
        label="Destinations you care about"
        helper="Write country names separated by commas."
        value={draft.destinationInterests}
        onChangeText={(value) => updateDraft({ destinationInterests: value })}
        placeholder="Greece, Germany, Portugal"
      />
      <FormField
        label="Preferred language"
        value={draft.preferredLanguage}
        onChangeText={(value) => updateDraft({ preferredLanguage: value.toLowerCase() })}
        autoCapitalize="none"
        maxLength={8}
        placeholder="en"
      />
      <PrimaryButton label="Continue" onPress={() => router.push('/onboarding/goals')} />
    </OnboardingScreen>
  );
}
