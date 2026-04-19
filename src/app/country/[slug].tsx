import { useLocalSearchParams } from 'expo-router';

import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function CountryDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  return (
    <ScreenPlaceholder
      eyebrow="Country"
      title={`Country: ${slug ?? 'details'}`}
      description="Country overview, flags, facts, document categories, and saved country actions will live here."
    />
  );
}
