import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function SearchScreen() {
  return (
    <ScreenPlaceholder
      eyebrow="Search"
      title="Find country documents"
      description="Search countries, visa routes, document categories, and country-specific process guides."
      items={['Debounced country search', 'Document category filters', 'Saved and recent result shortcuts']}
    />
  );
}
