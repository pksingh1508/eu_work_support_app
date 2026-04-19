import { useLocalSearchParams } from 'expo-router';

import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function VisaDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenPlaceholder
      eyebrow="Document"
      title={`Document: ${id ?? 'details'}`}
      description="Flexible country document rendering from content_json will live here."
    />
  );
}
