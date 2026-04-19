import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function ProfileScreen() {
  return (
    <ScreenPlaceholder
      eyebrow="Profile"
      title="Account and support"
      description="Manage account settings, saved items, help access, referrals, and notification preferences."
      items={['Account settings', 'Saved items', 'Help and support', 'Refer and earn']}
    />
  );
}
