import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

import { env } from '@/lib/env';

type ClerkAccessTokenGetter = () => Promise<string | null>;

let clerkAccessTokenGetter: ClerkAccessTokenGetter = async () => null;

export function setSupabaseAccessTokenGetter(getter: ClerkAccessTokenGetter) {
  clerkAccessTokenGetter = getter;
}

export const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey, {
  accessToken: async () => clerkAccessTokenGetter(),
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
