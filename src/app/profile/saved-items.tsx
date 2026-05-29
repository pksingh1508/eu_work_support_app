import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';
import { PremiumGuard } from "@/features/auth/components/premium-guard";

export default function ProfileSavedItemsScreen() {
  return (
    <PremiumGuard>
      <ProfileSavedItemsContent />
    </PremiumGuard>
  );
}

function ProfileSavedItemsContent() {
  return (
    <ScreenPlaceholder
      eyebrow="Profile"
      title="Saved items"
      description="Profile-level shortcut for saved countries, documents, and recent activity."
    />
  );
}
