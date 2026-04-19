import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function SavedScreen() {
  return (
    <ScreenPlaceholder
      eyebrow="Saved"
      title="Saved countries and documents"
      description="Keep important countries and process documents close while preparing an application."
      items={['Saved countries', 'Saved country documents', 'Recently viewed documents']}
    />
  );
}
