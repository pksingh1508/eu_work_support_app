import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function HomeScreen() {
  return (
    <ScreenPlaceholder
      eyebrow="Home"
      title="Europe country hub"
      description="Browse European countries, popular destinations, and country document categories."
      items={[
        'Country cards with flags and active document counts',
        'Popular work, study, tourist, residence, and social security guides',
        'Filters for Schengen, EU, visa type, and saved status',
      ]}
    />
  );
}
