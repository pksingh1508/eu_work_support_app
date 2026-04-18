# EU Work Support Mobile App Plan

Last reviewed: 2026-04-18

This app is a premium Europe visa and immigration information hub for Android and iOS. The product should help a user discover a country, compare visa routes, understand process steps, save useful guides, manage subscription access, and receive timely reminders or updates.

## 1. Product Scope

### Core Screens

- `Home`: all European countries with flags, popular destinations, visa filters, saved state, and editorial sections.
- `Search`: fast country and visa-route search with filters for country, purpose, processing time, difficulty, cost, eligibility, and Schengen/non-Schengen.
- `Saved`: saved countries, saved visa guides, and recently viewed guides.
- `Billing`: current subscription, entitlement status, plan upgrade/restore flow, receipts/help links.
- `Profile`: account settings, saved items shortcut, help access, notification preferences, legal links, sign out.

### Auth And Onboarding

- `Sign in`: Clerk email/password sign-in.
- `Sign up`: Clerk email/password sign-up.
- `Onboarding`: collect nationality, current residence, travel/work/study goal, target destinations, notification consent, and paywall timing.
- Gate premium visa detail, advanced comparisons, checklists, and alerts behind RevenueCat entitlements.

### Information Architecture

- Country overview.
- Visa categories per country: tourist, work, student, family, business, digital nomad/freelance where applicable, permanent residence, citizenship/naturalization, asylum/humanitarian if included later.
- Per visa guide: eligibility, documents, fees, timeline, process steps, official links, do/don't, FAQs, update date, and disclaimer.
- Saved and reminder flows: save country, save visa guide, save checklist item, receive update alerts.

## 2. Current Project Baseline

- Expo SDK app using `expo-router`.
- Dependencies already present: `@clerk/expo`, `@supabase/supabase-js`, Expo Router, React Navigation, Expo Secure Store.
- Dependencies still needed: RevenueCat React Native SDK, OneSignal Expo/React Native SDK, local storage/query state helpers, forms/validation, analytics/crash reporting if desired.
- Design direction is documented in `DESIGN.md`: "The Diplomatic Atelier", tonal surface hierarchy, no hard divider lines, premium editorial typography, soft-rect flags, gradient primary CTAs, and spacious layouts.

## 3. Recommended App Structure

Use Expo Router route groups:

```text
src/app/
  _layout.tsx
  (auth)/
    sign-in.tsx
    sign-up.tsx
    forgot-password.tsx
  onboarding/
    _layout.tsx
    index.tsx
    goals.tsx
    notifications.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    search.tsx
    saved.tsx
    billing.tsx
    profile.tsx
  country/
    [slug].tsx
  visa/
    [id].tsx
  profile/
    settings.tsx
    saved-items.tsx
    help.tsx
  billing/
    paywall.tsx
    manage.tsx
```

Recommended source folders:

```text
src/
  components/
    country/
    visa/
    billing/
    profile/
    ui/
  constants/
  features/
    auth/
    onboarding/
    countries/
    search/
    saved/
    billing/
    notifications/
  lib/
    clerk.ts
    supabase.ts
    revenuecat.ts
    onesignal.ts
  services/
    countries.ts
    saved.ts
    billing.ts
  types/
  utils/
```

## 4. Step-By-Step Build Plan

### Phase 1: Foundations

1. Keep the app portrait-first and mobile-first for Android and iOS.
2. Add environment management:
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
   - `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
   - `EXPO_PUBLIC_ONESIGNAL_APP_ID`
3. Never place Clerk secret keys, Supabase service-role keys, RevenueCat secret keys, OneSignal REST API keys, or webhook secrets in the app bundle.
4. Configure `ClerkProvider` in `src/app/_layout.tsx` and store Clerk sessions with `expo-secure-store`.
5. Configure Supabase using Clerk session tokens:
   - Activate Clerk as a Supabase third-party auth provider in the Supabase dashboard.
   - Initialize Supabase with `accessToken: () => session?.getToken() ?? null`.
   - Write RLS against `auth.jwt()->>'sub'`, because Clerk user IDs are strings like `user_...`.
6. Add a theme/token layer based on `DESIGN.md`:
   - Manrope for headlines/numbers.
   - Inter for body and labels.
   - Soft neutral surfaces instead of divider lines.
   - Primary gradient for important CTAs.
   - Soft-rect flag treatment with 4px radius.

### Phase 2: Data Model And Content

1. Apply the schema in `supabase.md`.
2. Seed country records for Europe with ISO codes, regions, Schengen status, EU/EEA status, flags, and popularity metadata.
3. Seed visa category records and initial visa guides country by country.
4. Keep content fields structured, not just rich text:
   - Requirements as rows.
   - Process steps as ordered rows.
   - Fees as rows with currency and amount.
   - Official links as rows.
   - FAQs and do/don't as rows.
5. Add `last_reviewed_at`, `source_url`, and `status` fields so outdated guidance can be flagged.
6. Make the app display disclaimers clearly: information is guidance, not legal advice; users must verify with official government websites.

### Phase 3: Auth And Onboarding

1. Build Clerk sign-in and sign-up screens.
2. After successful sign-up, route users to onboarding if `app_users.onboarding_completed = false`.
3. Collect onboarding data:
   - nationality
   - residence country
   - destination interests
   - goal: visit, work, study, family, business, relocate
   - preferred language
   - push notification preference
4. Store onboarding answers in Supabase under the Clerk user ID.
5. Allow users to skip non-critical onboarding, but keep destination/goal prompts early because they personalize Home and Search.

### Phase 4: Main Tabs

1. Home:
   - Featured country carousel/list.
   - Popular destinations.
   - Filter chips for Schengen, EU, work, student, digital nomad, fast processing, low fee.
   - Country cards with flag, country name, region, popular visa routes, saved state.
   - Editorial "Guide" cards for urgent or high-value process topics.
2. Search:
   - Debounced search against local cache first, then Supabase.
   - Search countries, aliases, visa guide titles, tags, and purpose.
   - Add filter state in URL/search params for shareable navigation.
3. Saved:
   - Saved countries and saved visa guides.
   - Empty state that routes to Search.
   - Offline-friendly cached saved list.
4. Billing:
   - Configure RevenueCat once per app lifecycle.
   - Use Clerk user ID as RevenueCat App User ID after sign-in.
   - Display active entitlement, renewal date, product ID, restore purchases, manage subscription link, and upgrade CTA.
5. Profile:
   - Account settings via Clerk.
   - Saved items shortcut.
   - Help access with support request form.
   - Notification preferences.
   - Privacy, terms, legal disclaimer.

### Phase 5: Country And Visa Detail

1. Country detail:
   - Flag, country facts, EU/Schengen status, official immigration links.
   - Visa categories available for that country.
   - Popular paths based on onboarding goal.
   - Save country action.
2. Visa detail:
   - Eligibility summary.
   - Process timeline.
   - Required documents.
   - Fees.
   - Processing times.
   - Do/don't.
   - FAQs.
   - Official source links.
   - Save guide action.
3. Use stable section anchors so future deep links can open a specific guide section.

### Phase 6: Billing With RevenueCat

1. Install the RevenueCat React Native SDK compatible with the Expo workflow.
2. Create one RevenueCat project with iOS and Android apps.
3. Configure products in App Store Connect and Google Play Console.
4. Create RevenueCat offerings:
   - `default`
   - monthly plan
   - yearly plan
   - optional lifetime if the business model allows it
5. Configure `Purchases` only once:
   - iOS uses the iOS public SDK key.
   - Android uses the Android public SDK key.
   - After Clerk sign-in, call `Purchases.logIn(clerkUserId)`.
   - On sign-out, call `Purchases.logOut()` only after confirming the next session should return to an anonymous RevenueCat user.
6. Use RevenueCat `CustomerInfo` for immediate UI state.
7. Mirror subscription state into Supabase from RevenueCat webhooks for support, backend feature checks, and audit history.
8. Never trust a client-sent "premium" boolean. Premium access is either RevenueCat `CustomerInfo` on-device or server-confirmed entitlement mirror.

### Phase 7: Push Notifications With OneSignal

1. Install OneSignal Expo/React Native SDK and configure native credentials through EAS.
2. Ask for notification permission after onboarding context, not on the first cold open.
3. On sign-in, call `OneSignal.login(clerkUserId)` so the OneSignal External ID is the Clerk user ID.
4. On sign-out, call `OneSignal.logout()`.
5. Store OneSignal user/subscription IDs in `user_devices` when available.
6. Add tags carefully:
   - `goal`
   - `preferred_destination`
   - `subscription_status`
7. Avoid storing sensitive immigration status or private legal details as notification tags.
8. Send notifications for saved guide updates, subscription events, and reminders only after explicit user consent.

### Phase 8: Admin And Content Operations

1. Do not edit immigration content directly from the mobile app.
2. Use Supabase dashboard, a private admin panel, or migration scripts for content publishing.
3. Require every visa guide to have:
   - at least one official source URL
   - `last_reviewed_at`
   - `status = published`
   - country and category links
4. Add an editorial review workflow later:
   - draft
   - review
   - published
   - archived
5. Log content changes in `content_change_logs`.

### Phase 9: Security

1. Enable RLS on every table in the public API schema.
2. Use `auth.jwt()->>'sub'` for Clerk-owned user rows.
3. Public content tables allow read-only access to published content.
4. User tables allow users to select/update/insert only their own rows.
5. Billing tables allow user read-only access; writes come only from RevenueCat webhook handlers using the Supabase service-role key server-side.
6. Webhook endpoints must verify signatures:
   - Clerk: verify Svix signature with `CLERK_WEBHOOK_SIGNING_SECRET`.
   - RevenueCat: verify authorization header or webhook secret.
7. Rate-limit public support/contact endpoints.
8. Keep all service-role actions in Supabase Edge Functions or another trusted backend.
9. Use EAS secrets for build-time sensitive values and platform credentials.
10. Avoid logging PII, webhook payloads with full emails, or payment metadata in production logs.
11. Add account deletion handling:
   - Clerk `user.deleted` webhook marks Supabase user as deleted or purges user-private records.
   - Keep billing event rows only when legally needed and detach unnecessary PII.

### Phase 10: Performance

1. Cache public content with a stale-while-revalidate strategy.
2. Paginate countries/visa lists even if the first version is small.
3. Use list virtualization for country and search screens.
4. Keep images optimized:
   - Use static or CDN-hosted flag assets.
   - Use `expo-image` for caching.
5. Precompute search fields in Supabase:
   - searchable text columns.
   - trigram indexes for fuzzy search.
   - tags arrays for filters.
6. Avoid large JSON blobs for content that needs filtering.
7. Keep onboarding and profile writes small and explicit.
8. Defer RevenueCat and OneSignal initialization until after the auth/session state is known where possible.
9. Use skeleton loading and cached data for main tabs.
10. Bundle-analyze before release and remove starter assets/screens.

### Phase 11: Testing

1. Unit tests:
   - query helpers
   - entitlement parsing
   - search filters
   - date formatting
2. Integration tests:
   - Supabase RLS with two Clerk users
   - save/unsave country
   - onboarding completion
   - RevenueCat webhook processing
   - Clerk webhook user sync
3. Manual QA:
   - iOS simulator
   - Android emulator
   - physical Android
   - physical iPhone if possible
4. Release checks:
   - sign-up, sign-in, sign-out
   - onboarding redirect
   - Home/Search/Saved/Billing/Profile tabs
   - purchase, restore purchase, expired subscription
   - push permission and logout behavior
   - offline saved screen

### Phase 12: Release

1. Configure EAS Build.
2. Set app identifiers:
   - iOS bundle identifier
   - Android package name
3. Configure associated domains/deep links if needed.
4. Configure store subscription products.
5. Add privacy policy, terms, and immigration-information disclaimer.
6. Submit internal builds through TestFlight and Google Play Internal Testing.
7. Run content accuracy review before public launch.

## 5. Clerk To Supabase Webhook Setup

The Clerk and Supabase integration authenticates Supabase requests, but it does not automatically create a row in your own `app_users` table. Use a backend webhook for that.

Recommended implementation: Supabase Edge Function named `clerk-webhook`.

### Events To Subscribe

- `user.created`: insert or upsert `app_users`.
- `user.updated`: update email/name/avatar fields you choose to mirror.
- `user.deleted`: soft-delete or anonymize user data.

### Dashboard Steps

1. In Clerk Dashboard, open Webhooks.
2. Add endpoint:
   - Local testing: `https://<ngrok-domain>/functions/v1/clerk-webhook`
   - Production: `https://<project-ref>.functions.supabase.co/clerk-webhook`
3. Subscribe to:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy the Clerk signing secret.
5. Store the secret in Supabase Edge Function secrets:

```bash
supabase secrets set CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

### Edge Function Behavior

1. Read raw request body.
2. Verify Svix headers using `CLERK_WEBHOOK_SIGNING_SECRET`.
3. Ignore unsupported event types.
4. For `user.created` and `user.updated`, upsert:
   - `clerk_user_id`
   - primary email
   - first name
   - last name
   - image URL
   - timestamps
5. For `user.deleted`, set:
   - `deleted_at = now()`
   - optional `email = null`
   - optional `first_name = null`
   - optional `last_name = null`
6. Return `200` after successful idempotent processing.
7. Return `400` only for invalid signatures or malformed payloads.

### Example Edge Function Skeleton

```ts
// supabase/functions/clerk-webhook/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { Webhook } from "npm:svix";
import { createClient } from "npm:@supabase/supabase-js";

serve(async (req) => {
  const signingSecret = Deno.env.get("CLERK_WEBHOOK_SIGNING_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!signingSecret || !supabaseUrl || !serviceRoleKey) {
    return new Response("Missing server configuration", { status: 500 });
  }

  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  let event;
  try {
    event = new Webhook(signingSecret).verify(payload, headers) as {
      type: string;
      data: Record<string, any>;
    };
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const user = event.data;
  const primaryEmail = user.email_addresses?.find(
    (email: any) => email.id === user.primary_email_address_id,
  )?.email_address;

  if (event.type === "user.created" || event.type === "user.updated") {
    const { error } = await supabase.from("app_users").upsert({
      clerk_user_id: user.id,
      email: primaryEmail ?? null,
      first_name: user.first_name ?? null,
      last_name: user.last_name ?? null,
      image_url: user.image_url ?? null,
      deleted_at: null,
      clerk_created_at: user.created_at ? new Date(user.created_at).toISOString() : null,
      clerk_updated_at: user.updated_at ? new Date(user.updated_at).toISOString() : null,
      updated_at: new Date().toISOString(),
    });

    if (error) return new Response(error.message, { status: 500 });
  }

  if (event.type === "user.deleted") {
    const { error } = await supabase
      .from("app_users")
      .update({
        email: null,
        first_name: null,
        last_name: null,
        image_url: null,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_user_id", user.id);

    if (error) return new Response(error.message, { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
```

### Important Webhook Notes

- Webhooks are eventually consistent. The app should not block first login waiting for the webhook.
- On first app load after sign-up, run a client-side `ensure_user_profile` RPC or insert guarded by RLS if the webhook has not arrived yet.
- Keep webhook processing idempotent by using `upsert` and unique event IDs where available.
- Do not expose the service-role key to Expo.

## 6. External References

- Clerk Supabase integration: https://clerk.com/docs/guides/development/integrations/databases/supabase
- Clerk webhooks overview: https://clerk.com/docs/guides/development/webhooks/overview
- Clerk data sync with webhooks: https://clerk.com/docs/guides/development/webhooks/syncing
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- RevenueCat customer identity: https://www.revenuecat.com/docs/customers/identifying-customers
- OneSignal Expo setup and External ID: https://documentation.onesignal.com/docs/react-native-expo-sdk-setup
