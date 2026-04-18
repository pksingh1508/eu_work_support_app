# Supabase Schema And RLS Plan

Last reviewed: 2026-04-18

This document defines the initial Supabase database for the Europe visa and immigration mobile app. It assumes Clerk is the source of authentication and Supabase uses Clerk as a third-party auth provider. User-owned rows use the Clerk user ID stored as `text`, and RLS checks use `auth.jwt()->>'sub'`.

## 1. Design Principles

- Clerk owns authentication.
- Supabase stores application data, public immigration content, saved items, billing mirrors, notification preferences, and support requests.
- Public content is readable by anonymous and authenticated users only when published.
- User data is readable and writable only by the owner.
- Billing/subscription tables are readable by the owner but written only by trusted webhook handlers.
- Service-role key is used only in Supabase Edge Functions or trusted backend jobs.
- All public-schema tables have RLS enabled.

## 2. Extensions, Helpers, And Triggers

```sql
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists unaccent;

create or replace function public.current_clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt()->>'sub', '');
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

## 3. Core User Tables

```sql
create table public.app_users (
  clerk_user_id text primary key default public.current_clerk_user_id(),
  email text,
  first_name text,
  last_name text,
  image_url text,
  nationality_country_code char(2),
  residence_country_code char(2),
  preferred_language text default 'en',
  onboarding_completed boolean not null default false,
  onboarding_completed_at timestamptz,
  preferences jsonb not null default '{}'::jsonb,
  clerk_created_at timestamptz,
  clerk_updated_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger app_users_set_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();

create table public.user_onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.app_users(clerk_user_id) on delete cascade,
  goal text not null check (goal in ('visit', 'work', 'study', 'family', 'business', 'relocate', 'other')),
  nationality_country_code char(2),
  residence_country_code char(2),
  destination_country_ids uuid[] not null default '{}',
  notification_opt_in boolean not null default false,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_onboarding_answers_set_updated_at
before update on public.user_onboarding_answers
for each row execute function public.set_updated_at();

create index user_onboarding_answers_user_idx
on public.user_onboarding_answers(clerk_user_id);
```

## 4. Country And Visa Content Tables

```sql
create table public.countries (
  id uuid primary key default gen_random_uuid(),
  iso2 char(2) not null unique,
  iso3 char(3) not null unique,
  name text not null,
  slug text not null unique,
  flag_emoji text,
  flag_asset_key text,
  region text,
  subregion text,
  is_eu boolean not null default false,
  is_eea boolean not null default false,
  is_schengen boolean not null default false,
  capital text,
  currency_code char(3),
  official_language_codes text[] not null default '{}',
  popularity_rank int,
  short_description text,
  official_immigration_url text,
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  last_reviewed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger countries_set_updated_at
before update on public.countries
for each row execute function public.set_updated_at();

create index countries_status_rank_idx
on public.countries(status, popularity_rank nulls last);

create index countries_name_trgm_idx
on public.countries using gin (name gin_trgm_ops);

create table public.country_aliases (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  alias text not null,
  locale text default 'en',
  created_at timestamptz not null default now()
);

create unique index country_aliases_unique_lower_alias_idx
on public.country_aliases(country_id, lower(alias), coalesce(locale, ''));

create index country_aliases_alias_trgm_idx
on public.country_aliases using gin (alias gin_trgm_ops);

create table public.visa_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

create table public.visa_guides (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  category_id uuid not null references public.visa_categories(id),
  title text not null,
  slug text not null,
  summary text,
  purpose text,
  audience text,
  difficulty text check (difficulty in ('low', 'medium', 'high')),
  is_premium boolean not null default false,
  tags text[] not null default '{}',
  search_text text generated always as (
    lower(coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(purpose, '') || ' ' || array_to_string(tags, ' '))
  ) stored,
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'archived')),
  source_url text,
  last_reviewed_at date,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(country_id, slug)
);

create trigger visa_guides_set_updated_at
before update on public.visa_guides
for each row execute function public.set_updated_at();

create index visa_guides_country_status_idx
on public.visa_guides(country_id, status);

create index visa_guides_category_idx
on public.visa_guides(category_id);

create index visa_guides_search_trgm_idx
on public.visa_guides using gin (search_text gin_trgm_ops);

create index visa_guides_tags_idx
on public.visa_guides using gin (tags);

create table public.visa_guide_sections (
  id uuid primary key default gen_random_uuid(),
  visa_guide_id uuid not null references public.visa_guides(id) on delete cascade,
  section_key text not null,
  title text not null,
  body text not null,
  sort_order int not null default 100,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(visa_guide_id, section_key)
);

create trigger visa_guide_sections_set_updated_at
before update on public.visa_guide_sections
for each row execute function public.set_updated_at();

create index visa_guide_sections_guide_idx
on public.visa_guide_sections(visa_guide_id, sort_order);

create table public.visa_process_steps (
  id uuid primary key default gen_random_uuid(),
  visa_guide_id uuid not null references public.visa_guides(id) on delete cascade,
  step_number int not null,
  title text not null,
  description text not null,
  estimated_duration text,
  official_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(visa_guide_id, step_number)
);

create trigger visa_process_steps_set_updated_at
before update on public.visa_process_steps
for each row execute function public.set_updated_at();

create table public.visa_requirements (
  id uuid primary key default gen_random_uuid(),
  visa_guide_id uuid not null references public.visa_guides(id) on delete cascade,
  requirement_type text not null check (requirement_type in ('eligibility', 'document', 'financial', 'health', 'language', 'other')),
  title text not null,
  description text,
  is_mandatory boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger visa_requirements_set_updated_at
before update on public.visa_requirements
for each row execute function public.set_updated_at();

create table public.visa_fees (
  id uuid primary key default gen_random_uuid(),
  visa_guide_id uuid not null references public.visa_guides(id) on delete cascade,
  fee_name text not null,
  amount_min numeric(12,2),
  amount_max numeric(12,2),
  currency_code char(3),
  notes text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger visa_fees_set_updated_at
before update on public.visa_fees
for each row execute function public.set_updated_at();

create table public.visa_processing_times (
  id uuid primary key default gen_random_uuid(),
  visa_guide_id uuid not null references public.visa_guides(id) on delete cascade,
  title text not null,
  duration_min_days int,
  duration_max_days int,
  notes text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger visa_processing_times_set_updated_at
before update on public.visa_processing_times
for each row execute function public.set_updated_at();

create table public.visa_faqs (
  id uuid primary key default gen_random_uuid(),
  visa_guide_id uuid not null references public.visa_guides(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger visa_faqs_set_updated_at
before update on public.visa_faqs
for each row execute function public.set_updated_at();

create table public.visa_do_donts (
  id uuid primary key default gen_random_uuid(),
  visa_guide_id uuid not null references public.visa_guides(id) on delete cascade,
  kind text not null check (kind in ('do', 'dont')),
  title text not null,
  description text,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger visa_do_donts_set_updated_at
before update on public.visa_do_donts
for each row execute function public.set_updated_at();

create table public.official_links (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries(id) on delete cascade,
  visa_guide_id uuid references public.visa_guides(id) on delete cascade,
  title text not null,
  url text not null,
  link_type text not null default 'official',
  notes text,
  created_at timestamptz not null default now(),
  check (country_id is not null or visa_guide_id is not null)
);
```

## 5. Saved Items, Search, Feedback, And Support

```sql
create table public.saved_countries (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.app_users(clerk_user_id) on delete cascade,
  country_id uuid not null references public.countries(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(clerk_user_id, country_id)
);

create index saved_countries_user_idx
on public.saved_countries(clerk_user_id, created_at desc);

create table public.saved_visa_guides (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.app_users(clerk_user_id) on delete cascade,
  visa_guide_id uuid not null references public.visa_guides(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(clerk_user_id, visa_guide_id)
);

create trigger saved_visa_guides_set_updated_at
before update on public.saved_visa_guides
for each row execute function public.set_updated_at();

create index saved_visa_guides_user_idx
on public.saved_visa_guides(clerk_user_id, created_at desc);

create table public.recently_viewed_guides (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.app_users(clerk_user_id) on delete cascade,
  visa_guide_id uuid not null references public.visa_guides(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique(clerk_user_id, visa_guide_id)
);

create index recently_viewed_guides_user_idx
on public.recently_viewed_guides(clerk_user_id, viewed_at desc);

create table public.search_history (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.app_users(clerk_user_id) on delete cascade,
  query text not null,
  filters jsonb not null default '{}'::jsonb,
  result_count int,
  created_at timestamptz not null default now()
);

create index search_history_user_idx
on public.search_history(clerk_user_id, created_at desc);

create table public.content_feedback (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text references public.app_users(clerk_user_id) on delete set null,
  country_id uuid references public.countries(id) on delete set null,
  visa_guide_id uuid references public.visa_guides(id) on delete set null,
  feedback_type text not null check (feedback_type in ('correction', 'outdated', 'missing', 'helpful', 'other')),
  message text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger content_feedback_set_updated_at
before update on public.content_feedback
for each row execute function public.set_updated_at();

create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.app_users(clerk_user_id) on delete cascade,
  subject text not null,
  message text not null,
  category text not null default 'general',
  status text not null default 'open' check (status in ('open', 'waiting', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger support_requests_set_updated_at
before update on public.support_requests
for each row execute function public.set_updated_at();

create index support_requests_user_idx
on public.support_requests(clerk_user_id, created_at desc);
```

## 6. Billing Tables

RevenueCat is the source of truth for purchases. Supabase mirrors the latest state for support, profile display, and backend checks.

```sql
create table public.revenuecat_customers (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.app_users(clerk_user_id) on delete cascade,
  revenuecat_app_user_id text not null unique,
  original_app_user_id text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(clerk_user_id)
);

create trigger revenuecat_customers_set_updated_at
before update on public.revenuecat_customers
for each row execute function public.set_updated_at();

create table public.subscription_entitlements (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.app_users(clerk_user_id) on delete cascade,
  revenuecat_app_user_id text not null,
  entitlement_id text not null,
  product_id text,
  store text,
  status text not null check (status in ('active', 'trialing', 'grace_period', 'expired', 'cancelled', 'billing_issue', 'unknown')),
  period_type text,
  latest_purchase_at timestamptz,
  original_purchase_at timestamptz,
  expires_at timestamptz,
  will_renew boolean,
  cancellation_reason text,
  raw_customer_info jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(clerk_user_id, entitlement_id)
);

create trigger subscription_entitlements_set_updated_at
before update on public.subscription_entitlements
for each row execute function public.set_updated_at();

create index subscription_entitlements_user_idx
on public.subscription_entitlements(clerk_user_id, status);

create table public.revenuecat_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  revenuecat_app_user_id text,
  clerk_user_id text references public.app_users(clerk_user_id) on delete set null,
  product_id text,
  entitlement_ids text[] not null default '{}',
  purchased_at timestamptz,
  expiration_at timestamptz,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index revenuecat_events_user_idx
on public.revenuecat_events(clerk_user_id, received_at desc);
```

## 7. Notification Tables

```sql
create table public.notification_preferences (
  clerk_user_id text primary key references public.app_users(clerk_user_id) on delete cascade,
  push_enabled boolean not null default false,
  marketing_enabled boolean not null default false,
  saved_guide_updates_enabled boolean not null default true,
  billing_updates_enabled boolean not null default true,
  preferred_hour_local int check (preferred_hour_local between 0 and 23),
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

create table public.user_devices (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.app_users(clerk_user_id) on delete cascade,
  onesignal_user_id text,
  onesignal_subscription_id text,
  platform text not null check (platform in ('ios', 'android', 'web')),
  device_model text,
  app_version text,
  push_permission_status text,
  push_enabled boolean not null default false,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(onesignal_subscription_id)
);

create trigger user_devices_set_updated_at
before update on public.user_devices
for each row execute function public.set_updated_at();

create index user_devices_user_idx
on public.user_devices(clerk_user_id, last_seen_at desc);
```

## 8. Content Change Logs

```sql
create table public.content_change_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  row_id uuid not null,
  action text not null check (action in ('created', 'updated', 'published', 'archived', 'deleted')),
  summary text,
  changed_by text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

## 9. Enable RLS

```sql
alter table public.app_users enable row level security;
alter table public.user_onboarding_answers enable row level security;

alter table public.countries enable row level security;
alter table public.country_aliases enable row level security;
alter table public.visa_categories enable row level security;
alter table public.visa_guides enable row level security;
alter table public.visa_guide_sections enable row level security;
alter table public.visa_process_steps enable row level security;
alter table public.visa_requirements enable row level security;
alter table public.visa_fees enable row level security;
alter table public.visa_processing_times enable row level security;
alter table public.visa_faqs enable row level security;
alter table public.visa_do_donts enable row level security;
alter table public.official_links enable row level security;

alter table public.saved_countries enable row level security;
alter table public.saved_visa_guides enable row level security;
alter table public.recently_viewed_guides enable row level security;
alter table public.search_history enable row level security;
alter table public.content_feedback enable row level security;
alter table public.support_requests enable row level security;

alter table public.revenuecat_customers enable row level security;
alter table public.subscription_entitlements enable row level security;
alter table public.revenuecat_events enable row level security;

alter table public.notification_preferences enable row level security;
alter table public.user_devices enable row level security;
alter table public.content_change_logs enable row level security;
```

## 10. RLS Policies: User Profile

```sql
create policy "Users can read own profile"
on public.app_users
for select
to authenticated
using ((select public.current_clerk_user_id()) = clerk_user_id);

create policy "Users can insert own profile"
on public.app_users
for insert
to authenticated
with check ((select public.current_clerk_user_id()) = clerk_user_id);

create policy "Users can update own profile"
on public.app_users
for update
to authenticated
using ((select public.current_clerk_user_id()) = clerk_user_id)
with check ((select public.current_clerk_user_id()) = clerk_user_id);

create policy "Users can manage own onboarding answers"
on public.user_onboarding_answers
for all
to authenticated
using ((select public.current_clerk_user_id()) = clerk_user_id)
with check ((select public.current_clerk_user_id()) = clerk_user_id);
```

## 11. RLS Policies: Public Published Content

```sql
create policy "Anyone can read published countries"
on public.countries
for select
to anon, authenticated
using (status = 'published');

create policy "Anyone can read aliases for published countries"
on public.country_aliases
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.countries c
    where c.id = country_aliases.country_id
      and c.status = 'published'
  )
);

create policy "Anyone can read visa categories"
on public.visa_categories
for select
to anon, authenticated
using (true);

create policy "Anyone can read published visa guides"
on public.visa_guides
for select
to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.countries c
    where c.id = visa_guides.country_id
      and c.status = 'published'
  )
);

create policy "Anyone can read sections for published guides"
on public.visa_guide_sections
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.visa_guides g
    join public.countries c on c.id = g.country_id
    where g.id = visa_guide_sections.visa_guide_id
      and g.status = 'published'
      and c.status = 'published'
  )
);

create policy "Anyone can read process steps for published guides"
on public.visa_process_steps
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.visa_guides g
    join public.countries c on c.id = g.country_id
    where g.id = visa_process_steps.visa_guide_id
      and g.status = 'published'
      and c.status = 'published'
  )
);

create policy "Anyone can read requirements for published guides"
on public.visa_requirements
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.visa_guides g
    join public.countries c on c.id = g.country_id
    where g.id = visa_requirements.visa_guide_id
      and g.status = 'published'
      and c.status = 'published'
  )
);

create policy "Anyone can read fees for published guides"
on public.visa_fees
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.visa_guides g
    join public.countries c on c.id = g.country_id
    where g.id = visa_fees.visa_guide_id
      and g.status = 'published'
      and c.status = 'published'
  )
);

create policy "Anyone can read processing times for published guides"
on public.visa_processing_times
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.visa_guides g
    join public.countries c on c.id = g.country_id
    where g.id = visa_processing_times.visa_guide_id
      and g.status = 'published'
      and c.status = 'published'
  )
);

create policy "Anyone can read FAQs for published guides"
on public.visa_faqs
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.visa_guides g
    join public.countries c on c.id = g.country_id
    where g.id = visa_faqs.visa_guide_id
      and g.status = 'published'
      and c.status = 'published'
  )
);

create policy "Anyone can read do-donts for published guides"
on public.visa_do_donts
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.visa_guides g
    join public.countries c on c.id = g.country_id
    where g.id = visa_do_donts.visa_guide_id
      and g.status = 'published'
      and c.status = 'published'
  )
);

create policy "Anyone can read official links for published content"
on public.official_links
for select
to anon, authenticated
using (
  (
    country_id is not null
    and exists (
      select 1 from public.countries c
      where c.id = official_links.country_id
        and c.status = 'published'
    )
  )
  or
  (
    visa_guide_id is not null
    and exists (
      select 1
      from public.visa_guides g
      join public.countries c on c.id = g.country_id
      where g.id = official_links.visa_guide_id
        and g.status = 'published'
        and c.status = 'published'
    )
  )
);
```

## 12. RLS Policies: Saved Items And Activity

```sql
create policy "Users can manage own saved countries"
on public.saved_countries
for all
to authenticated
using ((select public.current_clerk_user_id()) = clerk_user_id)
with check ((select public.current_clerk_user_id()) = clerk_user_id);

create policy "Users can manage own saved visa guides"
on public.saved_visa_guides
for all
to authenticated
using ((select public.current_clerk_user_id()) = clerk_user_id)
with check ((select public.current_clerk_user_id()) = clerk_user_id);

create policy "Users can manage own recently viewed guides"
on public.recently_viewed_guides
for all
to authenticated
using ((select public.current_clerk_user_id()) = clerk_user_id)
with check ((select public.current_clerk_user_id()) = clerk_user_id);

create policy "Users can manage own search history"
on public.search_history
for all
to authenticated
using ((select public.current_clerk_user_id()) = clerk_user_id)
with check ((select public.current_clerk_user_id()) = clerk_user_id);
```

## 13. RLS Policies: Feedback And Support

```sql
create policy "Authenticated users can create feedback"
on public.content_feedback
for insert
to authenticated
with check ((select public.current_clerk_user_id()) = clerk_user_id);

create policy "Users can read own feedback"
on public.content_feedback
for select
to authenticated
using ((select public.current_clerk_user_id()) = clerk_user_id);

create policy "Users can create own support requests"
on public.support_requests
for insert
to authenticated
with check ((select public.current_clerk_user_id()) = clerk_user_id);

create policy "Users can read own support requests"
on public.support_requests
for select
to authenticated
using ((select public.current_clerk_user_id()) = clerk_user_id);

create policy "Users can update own open support requests"
on public.support_requests
for update
to authenticated
using (
  (select public.current_clerk_user_id()) = clerk_user_id
  and status in ('open', 'waiting')
)
with check ((select public.current_clerk_user_id()) = clerk_user_id);
```

## 14. RLS Policies: Billing

Client apps can read billing mirrors but cannot write them. RevenueCat webhook handlers use the service-role key, which bypasses RLS.

```sql
create policy "Users can read own RevenueCat customer"
on public.revenuecat_customers
for select
to authenticated
using ((select public.current_clerk_user_id()) = clerk_user_id);

create policy "Users can read own entitlements"
on public.subscription_entitlements
for select
to authenticated
using ((select public.current_clerk_user_id()) = clerk_user_id);

create policy "Users can read own billing event summaries"
on public.revenuecat_events
for select
to authenticated
using ((select public.current_clerk_user_id()) = clerk_user_id);
```

## 15. RLS Policies: Notifications

```sql
create policy "Users can manage own notification preferences"
on public.notification_preferences
for all
to authenticated
using ((select public.current_clerk_user_id()) = clerk_user_id)
with check ((select public.current_clerk_user_id()) = clerk_user_id);

create policy "Users can manage own devices"
on public.user_devices
for all
to authenticated
using ((select public.current_clerk_user_id()) = clerk_user_id)
with check ((select public.current_clerk_user_id()) = clerk_user_id);
```

## 16. RLS Policies: Content Change Logs

Content logs should be written by service-role scripts or admin tooling. They are not exposed to regular app users.

```sql
-- No anon/authenticated policies on content_change_logs for the first release.
-- Service role can still insert/select for private admin workflows.
```

## 17. Optional RPC: Ensure User Profile

Because Clerk webhooks are eventually consistent, call this after sign-in to make sure the profile row exists.

```sql
create or replace function public.ensure_user_profile()
returns public.app_users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := public.current_clerk_user_id();
  v_profile public.app_users;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  insert into public.app_users (clerk_user_id)
  values (v_user_id)
  on conflict (clerk_user_id) do nothing;

  select *
  into v_profile
  from public.app_users
  where clerk_user_id = v_user_id;

  return v_profile;
end;
$$;

grant execute on function public.ensure_user_profile() to authenticated;
```

## 18. Useful Queries For The App

### Search Published Visa Guides

```sql
select
  g.id,
  g.title,
  g.slug,
  g.summary,
  g.is_premium,
  c.name as country_name,
  c.slug as country_slug,
  c.flag_emoji,
  vc.name as category_name
from public.visa_guides g
join public.countries c on c.id = g.country_id
join public.visa_categories vc on vc.id = g.category_id
where g.status = 'published'
  and c.status = 'published'
  and (
    g.search_text ilike '%' || lower(:query) || '%'
    or c.name ilike '%' || :query || '%'
  )
order by c.popularity_rank nulls last, g.title
limit 25;
```

### Read Active Entitlement

```sql
select *
from public.subscription_entitlements
where clerk_user_id = public.current_clerk_user_id()
  and entitlement_id = 'premium'
  and status in ('active', 'trialing', 'grace_period')
  and (expires_at is null or expires_at > now())
limit 1;
```

## 19. Webhook Write Responsibilities

### Clerk Webhook

Writes:

- `app_users`

Events:

- `user.created`
- `user.updated`
- `user.deleted`

### RevenueCat Webhook

Writes:

- `revenuecat_customers`
- `subscription_entitlements`
- `revenuecat_events`

Events to handle:

- initial purchase
- renewal
- cancellation
- expiration
- billing issue
- product change
- transfer

### OneSignal

Writes are usually client-driven for:

- `notification_preferences`
- `user_devices`

Server-side notification sends should use OneSignal REST API from a trusted backend only.

## 20. Notes Before Applying In Production

- Review all check constraints against final product copy and business rules.
- Consider whether `search_history` should be disabled by default for privacy.
- Add database backups before importing real content.
- Keep `is_premium` enforcement in the app and backend. RLS alone does not hide premium content rows in this baseline because previews and paywalls may need metadata. If premium body text must be hidden from non-subscribers, split premium content into a separate table with entitlement-aware server access.
- Supabase service-role key must never be used in the Expo app.
