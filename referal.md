# Referral System Implementation Plan

Last reviewed: 2026-04-18

This document explains how to implement a referral system for the Expo mobile app using Clerk, Supabase, RevenueCat, and trusted server-side webhook logic.

The requested business rule:

- User A downloads the app and buys a subscription.
- User A generates a referral code and shares it with User B.
- User B downloads the app, signs up with that referral code, and buys a subscription.
- User A receives a `$5` referral bonus.
- User A can withdraw only when the available referral balance reaches at least `$20`.
- One referral code is single-use.
- Every referral code generated is different.

## 1. How The Referral System Works

### Short Version

1. User A must be signed in.
2. User A must have an active subscription if you want to restrict referrals to paid users.
3. User A taps "Generate referral code".
4. The backend creates a unique one-time code, such as `EU-8K4P-22QX`.
5. User A shares the code or a deep link.
6. User B enters the referral code during sign-up or onboarding.
7. The backend reserves the code for User B.
8. User B buys a subscription.
9. RevenueCat sends a webhook for the successful purchase.
10. The backend verifies that User B has a valid pending referral.
11. The backend marks the referral as qualified.
12. The backend creates a `$5` reward for User A.
13. When User A has at least `$20` available, they can request withdrawal.

### Important Rule

Referral rewards must never be created from the mobile app directly. The app can request actions, but only the backend can:

- create referral codes
- redeem referral codes
- confirm subscription purchases
- create rewards
- approve withdrawals

This prevents users from giving themselves fake rewards by editing app traffic.

## 2. Recommended Referral Flow

### Referrer Flow: User A

1. User A opens `Profile -> Referrals`.
2. App fetches referral summary from Supabase:
   - total referred users
   - pending rewards
   - available rewards
   - paid rewards
   - withdrawal eligibility
3. User A taps "Generate Code".
4. App calls a Supabase Edge Function:

```text
POST /functions/v1/referral-create-code
```

5. Backend checks:
   - user is authenticated
   - user is not deleted
   - optional: user has active subscription
   - optional: user has not exceeded daily code generation limit
6. Backend inserts a new row in `referral_codes`.
7. App displays:
   - one-time code
   - share button
   - optional deep link

Example deep link:

```text
euworksupport://signup?ref=EU-8K4P-22QX
```

### Referred User Flow: User B

1. User B opens the app from a referral link or enters the code manually.
2. App stores the code temporarily in local state until sign-up completes.
3. After Clerk sign-up and Supabase profile creation, app calls:

```text
POST /functions/v1/referral-redeem-code
```

4. Backend checks:
   - code exists
   - code is active
   - code is not expired
   - code is not already used
   - User B is not the owner of the code
   - User B has not already redeemed another referral
5. Backend marks code as reserved/used by User B.
6. Backend creates a `referrals` row with `status = 'pending_purchase'`.
7. User B buys subscription through RevenueCat.
8. RevenueCat webhook confirms purchase.
9. Backend marks referral as `qualified`.
10. Backend creates User A's `$5` reward.

## 3. Key Product Rules

### Code Rules

- Each code belongs to one referrer.
- Each code can be redeemed by only one referred user.
- A referrer can generate many different codes.
- A referred user can redeem only one referral code.
- Codes should be random and hard to guess.
- Codes should be case-insensitive in the app, but stored normalized as uppercase.
- Optional: codes expire after 30 or 90 days.

### Reward Rules

- Reward amount: `$5`.
- Reward currency: `USD`.
- Reward is created only after User B successfully buys a subscription.
- Reward starts as `pending`.
- Reward becomes `available` after an optional safety window, for example 7 or 14 days.
- Available rewards count toward withdrawal balance.
- Withdrawal minimum: `$20`.
- Paid or cancelled rewards do not count toward available balance.

### Payout Rules

For the first release, use manual payout review. It is simpler and safer.

1. User requests withdrawal after balance reaches `$20`.
2. Backend creates a withdrawal request.
3. Admin reviews fraud checks.
4. Admin pays via your chosen payout method.
5. Admin marks withdrawal as paid.

Later, automate payouts with Stripe Connect, PayPal Payouts, Wise, or another payout provider.

## 4. Supabase Tables

Add these tables to Supabase.

```sql
create table public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  referrer_clerk_user_id text not null references public.app_users(clerk_user_id) on delete cascade,
  code text not null unique,
  status text not null default 'active' check (status in ('active', 'reserved', 'used', 'expired', 'cancelled')),
  reserved_by_clerk_user_id text references public.app_users(clerk_user_id) on delete set null,
  reserved_at timestamptz,
  used_by_clerk_user_id text references public.app_users(clerk_user_id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (upper(code) = code),
  check (referrer_clerk_user_id <> coalesce(used_by_clerk_user_id, ''))
);

create trigger referral_codes_set_updated_at
before update on public.referral_codes
for each row execute function public.set_updated_at();

create index referral_codes_referrer_idx
on public.referral_codes(referrer_clerk_user_id, created_at desc);

create index referral_codes_status_idx
on public.referral_codes(status, expires_at);
```

```sql
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null unique references public.referral_codes(id) on delete restrict,
  referrer_clerk_user_id text not null references public.app_users(clerk_user_id) on delete cascade,
  referred_clerk_user_id text not null unique references public.app_users(clerk_user_id) on delete cascade,
  status text not null default 'pending_purchase' check (
    status in (
      'pending_purchase',
      'qualified',
      'reward_pending',
      'reward_available',
      'reward_paid',
      'rejected',
      'cancelled'
    )
  ),
  qualifying_revenuecat_event_id text,
  qualified_at timestamptz,
  rejected_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (referrer_clerk_user_id <> referred_clerk_user_id)
);

create trigger referrals_set_updated_at
before update on public.referrals
for each row execute function public.set_updated_at();

create index referrals_referrer_idx
on public.referrals(referrer_clerk_user_id, status, created_at desc);

create index referrals_referred_idx
on public.referrals(referred_clerk_user_id);
```

```sql
create table public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null unique references public.referrals(id) on delete restrict,
  referrer_clerk_user_id text not null references public.app_users(clerk_user_id) on delete cascade,
  referred_clerk_user_id text not null references public.app_users(clerk_user_id) on delete cascade,
  amount_cents int not null default 500 check (amount_cents > 0),
  currency char(3) not null default 'USD',
  status text not null default 'pending' check (
    status in ('pending', 'available', 'withdrawal_requested', 'paid', 'cancelled', 'reversed')
  ),
  available_at timestamptz,
  withdrawal_request_id uuid,
  revenuecat_event_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger referral_rewards_set_updated_at
before update on public.referral_rewards
for each row execute function public.set_updated_at();

create index referral_rewards_referrer_idx
on public.referral_rewards(referrer_clerk_user_id, status, created_at desc);
```

```sql
create table public.referral_withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.app_users(clerk_user_id) on delete cascade,
  amount_cents int not null check (amount_cents >= 2000),
  currency char(3) not null default 'USD',
  status text not null default 'requested' check (
    status in ('requested', 'reviewing', 'approved', 'paid', 'rejected', 'cancelled')
  ),
  payout_method text,
  payout_details jsonb not null default '{}'::jsonb,
  admin_notes text,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger referral_withdrawal_requests_set_updated_at
before update on public.referral_withdrawal_requests
for each row execute function public.set_updated_at();

create index referral_withdrawal_requests_user_idx
on public.referral_withdrawal_requests(clerk_user_id, status, requested_at desc);

alter table public.referral_rewards
add constraint referral_rewards_withdrawal_request_fk
foreign key (withdrawal_request_id)
references public.referral_withdrawal_requests(id)
on delete set null;
```

```sql
create table public.referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid references public.referrals(id) on delete set null,
  referral_code_id uuid references public.referral_codes(id) on delete set null,
  actor_clerk_user_id text references public.app_users(clerk_user_id) on delete set null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index referral_events_referral_idx
on public.referral_events(referral_id, created_at desc);

create index referral_events_actor_idx
on public.referral_events(actor_clerk_user_id, created_at desc);
```

## 5. RLS Policies

Enable RLS:

```sql
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.referral_withdrawal_requests enable row level security;
alter table public.referral_events enable row level security;
```

Users can read their own referral codes:

```sql
create policy "Users can read own referral codes"
on public.referral_codes
for select
to authenticated
using ((select public.current_clerk_user_id()) = referrer_clerk_user_id);
```

Users can read referrals where they are referrer or referred user:

```sql
create policy "Users can read own referral relationships"
on public.referrals
for select
to authenticated
using (
  (select public.current_clerk_user_id()) = referrer_clerk_user_id
  or (select public.current_clerk_user_id()) = referred_clerk_user_id
);
```

Users can read their own rewards:

```sql
create policy "Users can read own referral rewards"
on public.referral_rewards
for select
to authenticated
using ((select public.current_clerk_user_id()) = referrer_clerk_user_id);
```

Users can read their own withdrawal requests:

```sql
create policy "Users can read own withdrawal requests"
on public.referral_withdrawal_requests
for select
to authenticated
using ((select public.current_clerk_user_id()) = clerk_user_id);
```

Do not allow direct client inserts for withdrawal requests. The app should call `referral-request-withdrawal`, and that Edge Function should calculate the balance server-side before inserting the request.

Users can read their own referral events:

```sql
create policy "Users can read own referral events"
on public.referral_events
for select
to authenticated
using ((select public.current_clerk_user_id()) = actor_clerk_user_id);
```

Do not add client insert/update policies for:

- `referral_codes`
- `referrals`
- `referral_rewards`
- `referral_events`

Those writes should happen only inside Edge Functions using trusted server-side logic.

## 6. Edge Functions

Use Supabase Edge Functions for all referral write operations.

### Function 1: `referral-create-code`

Purpose: create a one-time referral code for the current user.

Input:

```json
{}
```

Output:

```json
{
  "code": "EU-8K4P-22QX",
  "deepLink": "euworksupport://signup?ref=EU-8K4P-22QX",
  "expiresAt": "2026-07-18T00:00:00.000Z"
}
```

Server checks:

1. Validate Clerk/Supabase auth.
2. Ensure user profile exists.
3. Optional but recommended: check active subscription in `subscription_entitlements`.
4. Rate-limit code generation, for example max 20 active codes per user.
5. Generate a cryptographically random code.
6. Insert into `referral_codes`.
7. Log `referral_code_created` in `referral_events`.

Code generation rule:

```text
EU-XXXX-XXXX
```

Use uppercase letters and digits except confusing characters:

```text
ABCDEFGHJKLMNPQRSTUVWXYZ23456789
```

Avoid codes like `O`, `0`, `I`, `1`.

### Function 2: `referral-redeem-code`

Purpose: bind a referral code to the newly signed-up user.

Input:

```json
{
  "code": "EU-8K4P-22QX"
}
```

Output:

```json
{
  "status": "pending_purchase",
  "message": "Referral code applied. Subscribe to activate the referral bonus."
}
```

Server checks:

1. Validate auth.
2. Normalize code to uppercase.
3. Fetch referral code with row lock.
4. Reject if code does not exist.
5. Reject if code is not `active`.
6. Reject if code is expired.
7. Reject if current user is the referrer.
8. Reject if current user already has a row in `referrals.referred_clerk_user_id`.
9. Update `referral_codes`:
   - `status = 'used'`
   - `used_by_clerk_user_id = current_user`
   - `used_at = now()`
10. Insert `referrals`:
   - `status = 'pending_purchase'`
11. Log `referral_code_redeemed`.

Important: do the update and insert in one transaction.

### Function 3: `referral-summary`

Purpose: return referral dashboard data for the current user.

Output:

```json
{
  "totalReferred": 8,
  "pendingRewardsCents": 1000,
  "availableRewardsCents": 2000,
  "paidRewardsCents": 1000,
  "minimumWithdrawalCents": 2000,
  "canWithdraw": true,
  "activeCodes": [
    {
      "code": "EU-8K4P-22QX",
      "createdAt": "2026-04-18T09:30:00.000Z",
      "expiresAt": "2026-07-18T00:00:00.000Z"
    }
  ]
}
```

This can be implemented as an Edge Function or as a Postgres RPC.

### Function 4: `referral-request-withdrawal`

Purpose: create withdrawal request when user has at least `$20` available.

Input:

```json
{
  "amountCents": 2000,
  "payoutMethod": "manual",
  "payoutDetails": {
    "email": "user@example.com"
  }
}
```

Server checks:

1. Validate auth.
2. Calculate available balance server-side.
3. Reject if available balance is less than `$20`.
4. Reject if requested amount is greater than available balance.
5. Insert `referral_withdrawal_requests`.
6. Update matching `referral_rewards` from `available` to `withdrawal_requested`.
7. Attach `withdrawal_request_id` to those rewards.
8. Log `withdrawal_requested`.

## 7. RevenueCat Webhook Handling

RevenueCat is the source of truth for subscription purchase events. The referral reward should be created from the RevenueCat webhook, not from the client.

Use an existing or new Supabase Edge Function:

```text
POST /functions/v1/revenuecat-webhook
```

When a webhook arrives:

1. Verify the webhook secret or authorization header.
2. Extract RevenueCat App User ID.
3. This should be the Clerk user ID because the app calls `Purchases.logIn(clerkUserId)`.
4. Store the webhook event in `revenuecat_events`.
5. If event type is a qualifying purchase, continue.

Qualifying event examples:

- `INITIAL_PURCHASE`
- `NON_RENEWING_PURCHASE`, if you sell non-renewing access
- possibly `RENEWAL`, only if you decide renewal should qualify, but for this referral rule use first purchase only

Referral qualification logic:

```text
RevenueCat event app_user_id = User B Clerk ID
Find referral where referred_clerk_user_id = User B and status = pending_purchase
If found and no reward exists:
  mark referral qualified
  create $5 reward for User A
```

Recommended SQL behavior:

```sql
-- Pseudocode only. Put this in an Edge Function or RPC transaction.

update public.referrals
set
  status = 'qualified',
  qualifying_revenuecat_event_id = :event_id,
  qualified_at = now()
where referred_clerk_user_id = :app_user_id
  and status = 'pending_purchase'
returning *;
```

Then insert reward:

```sql
insert into public.referral_rewards (
  referral_id,
  referrer_clerk_user_id,
  referred_clerk_user_id,
  amount_cents,
  currency,
  status,
  available_at,
  revenuecat_event_id
)
values (
  :referral_id,
  :referrer_clerk_user_id,
  :referred_clerk_user_id,
  500,
  'USD',
  'pending',
  now() + interval '14 days',
  :event_id
)
on conflict (referral_id) do nothing;
```

Why use a delay before `available`?

- It reduces abuse from immediate purchase/refund cycles.
- It gives time for App Store or Google Play refund/cancellation signals.
- It gives your admin team time to detect suspicious patterns.

## 8. Making Rewards Available

Use a scheduled Supabase cron job or backend scheduled task.

Run every few hours:

```sql
update public.referral_rewards
set status = 'available'
where status = 'pending'
  and available_at <= now();
```

Also update referrals:

```sql
update public.referrals r
set status = 'reward_available'
where status in ('qualified', 'reward_pending')
  and exists (
    select 1
    from public.referral_rewards rr
    where rr.referral_id = r.id
      and rr.status = 'available'
  );
```

If a refund, cancellation, or fraud event happens before `available_at`, mark the reward as `cancelled` or `reversed`.

## 9. Withdrawal Balance Calculation

Available balance:

```sql
select coalesce(sum(amount_cents), 0) as available_cents
from public.referral_rewards
where referrer_clerk_user_id = public.current_clerk_user_id()
  and status = 'available';
```

Pending balance:

```sql
select coalesce(sum(amount_cents), 0) as pending_cents
from public.referral_rewards
where referrer_clerk_user_id = public.current_clerk_user_id()
  and status = 'pending';
```

Paid balance:

```sql
select coalesce(sum(amount_cents), 0) as paid_cents
from public.referral_rewards
where referrer_clerk_user_id = public.current_clerk_user_id()
  and status = 'paid';
```

Withdrawal allowed:

```text
available_cents >= 2000
```

## 10. Mobile App Screens

### Profile Referral Entry

Add a row in Profile:

```text
Refer and Earn
```

Route:

```text
src/app/profile/referrals.tsx
```

### Referrals Screen

Show:

- Available balance
- Pending balance
- Paid balance
- `$20` withdrawal threshold progress
- Generate referral code button
- Active unused codes
- Referred users count
- Withdrawal button

Example copy:

```text
Earn $5 when a friend joins with your code and starts a subscription.
Withdraw when your available rewards reach $20.
```

### Sign-Up / Onboarding Referral Input

Add optional referral field:

```text
Referral code
```

Behavior:

- If user opens a deep link with `?ref=CODE`, prefill the code.
- After Clerk sign-up completes, call `referral-redeem-code`.
- If redeem fails, show a friendly message and continue onboarding.
- Do not block user registration because of invalid referral code.

### Billing Screen

After purchase succeeds:

- Show normal subscription success UI.
- Do not show "referrer got reward" to User B unless you want that product copy.
- User A will see reward status in Referral screen after webhook processing.

## 11. Security And Fraud Prevention

### Must-Have Checks

- User cannot redeem their own code.
- User cannot redeem more than one referral code.
- Referral code can be used by only one user.
- Reward can be created only once per referral.
- Reward is created only from verified RevenueCat webhook.
- Client cannot insert or update referral rewards.
- Client cannot mark withdrawal as paid.

### Recommended Checks

- Referrer must have an active subscription to generate codes.
- Referred user must be a new user.
- Referred user must not share the same device ID as referrer.
- Referred user must not share obvious suspicious metadata with referrer.
- Limit code generation per user per day.
- Delay reward availability by 7 to 14 days.
- Reverse reward if purchase is refunded during safety window.
- Manual review for withdrawals.

### Fraud Signals To Store In `metadata`

- referrer app version
- referred app version
- platform
- country
- device family
- IP hash from Edge Function request, if allowed by your privacy policy
- RevenueCat store
- RevenueCat product ID

Do not store raw IP addresses unless you have a clear legal/privacy reason.

## 12. Admin Workflow

Admin should be able to see:

- Referral code
- Referrer user
- Referred user
- RevenueCat event ID
- Reward status
- Withdrawal requests
- Fraud notes

Manual payout steps:

1. Admin opens withdrawal request.
2. Admin checks available reward rows attached to request.
3. Admin checks suspicious metadata.
4. Admin sends payout manually.
5. Admin updates request:
   - `status = 'paid'`
   - `paid_at = now()`
6. Admin updates related rewards:
   - `status = 'paid'`
7. Admin logs `withdrawal_paid` event.

## 13. Recommended Implementation Order

1. Add Supabase referral tables.
2. Add RLS policies.
3. Create `referral-create-code` Edge Function.
4. Create `referral-redeem-code` Edge Function.
5. Add referral input to sign-up/onboarding.
6. Add Referral screen in Profile.
7. Add RevenueCat webhook referral qualification logic.
8. Add scheduled job to move rewards from `pending` to `available`.
9. Add withdrawal request function.
10. Add admin manual payout workflow.
11. Add fraud monitoring and support tooling.

## 14. Testing Checklist

### Happy Path

1. User A signs up.
2. User A buys subscription.
3. User A generates referral code.
4. User B signs up with that code.
5. User B buys subscription.
6. RevenueCat webhook arrives.
7. Referral becomes qualified.
8. `$5` reward is created for User A.
9. Reward becomes available after delay.
10. After 4 successful referrals, User A has `$20`.
11. User A requests withdrawal.

### Abuse Cases

- User A tries to redeem own code.
- User B tries invalid code.
- User B tries expired code.
- User B tries already used code.
- User B tries to redeem two codes.
- Same RevenueCat event arrives twice.
- User B cancels/refunds before reward availability.
- User A tries to request withdrawal below `$20`.
- User A edits client request amount above available balance.

## 15. Notes And Risks

- Cash referral programs can create tax, accounting, and app-store policy questions. Review this with your accountant/legal advisor before public launch.
- Keep Terms and Conditions clear:
  - reward amount
  - eligibility
  - minimum withdrawal
  - payout method
  - review period
  - fraud cancellation rights
- Do not promise instant payouts if you plan manual review.
- Avoid showing exact fraud rules in public UI.
- Use RevenueCat custom App User ID with Clerk user ID so webhooks can reliably map purchases to Supabase users.

## 16. External References

- RevenueCat customer identity: https://www.revenuecat.com/docs/customers/identifying-customers
- RevenueCat webhooks: https://www.revenuecat.com/integrations/webhooks/
- RevenueCat customers and App User IDs: https://www.revenuecat.com/docs/customers/user-ids
