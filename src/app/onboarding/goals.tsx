import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { OnboardingScreen } from '@/features/onboarding/components/onboarding-screen';
import {
  OnboardingGoal,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding-context';

const goals: Array<{ value: OnboardingGoal; label: string; description: string }> = [
  { value: 'visit', label: 'Visit', description: 'Tourist and short stay routes' },
  { value: 'work', label: 'Work', description: 'Work visas and job documents' },
  { value: 'study', label: 'Study', description: 'Student visas and universities' },
  { value: 'family', label: 'Family', description: 'Family joining and residence' },
  { value: 'business', label: 'Business', description: 'Business visits and permits' },
  { value: 'relocate', label: 'Relocate', description: 'Long-term move planning' },
];

export default function OnboardingGoalsScreen() {
  const router = useRouter();
  const { draft, updateDraft } = useOnboardingDraft();

  return (
    <OnboardingScreen
      eyebrow="Onboarding"
      title="Choose your goal"
      description="This controls what appears first on Home and Search. You can change it later."
      onBack={() => router.back()}>
      <View className="gap-3">
        {goals.map((goal) => {
          const selected = draft.goal === goal.value;

          return (
            <Pressable
              key={goal.value}
              onPress={() => updateDraft({ goal: goal.value })}
              className={`rounded-interactive px-4 py-4 ${
                selected ? 'bg-diplomatic-surfaceHigh' : 'bg-white'
              }`}>
              <Text className="text-base font-bold tracking-normal text-diplomatic-ink">
                {goal.label}
              </Text>
              <Text className="mt-1 text-sm font-medium tracking-normal text-diplomatic-secondaryText">
                {goal.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton
        label="Continue"
        disabled={!draft.goal}
        onPress={() => router.push('/onboarding/notifications')}
      />
    </OnboardingScreen>
  );
}
