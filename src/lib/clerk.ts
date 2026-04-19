import { tokenCache } from '@clerk/expo/token-cache';

import { env } from '@/lib/env';

export const clerkPublishableKey = env.clerkPublishableKey;
export const clerkTokenCache = tokenCache;

