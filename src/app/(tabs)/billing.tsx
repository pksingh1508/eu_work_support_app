import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

export default function BillingScreen() {
  return (
    <ScreenPlaceholder
      eyebrow="Billing"
      title="Subscription access"
      description="Show the current RevenueCat entitlement, restore purchases, and upgrade options."
      items={['Current plan and renewal status', 'Subscribe or restore purchases', 'Manage subscription']}
    />
  );
}
