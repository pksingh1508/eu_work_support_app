import { Platform } from 'react-native';

type RequiredPublicEnv = {
  clerkPublishableKey: string;
  supabaseUrl: string;
  supabasePublishableKey: string;
  revenueCatIosApiKey: string;
  revenueCatAndroidApiKey: string;
  oneSignalAppId: string;
};

const requiredEnv = {
  clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabasePublishableKey:
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_KEY,
  revenueCatIosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
  revenueCatAndroidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
  oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
} satisfies Record<keyof RequiredPublicEnv, string | undefined>;

const missingEnv = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnv.length > 0) {
  throw new Error(`Missing required public environment variables: ${missingEnv.join(', ')}`);
}

export const env = requiredEnv as RequiredPublicEnv;

export const revenueCatApiKey = Platform.select({
  ios: env.revenueCatIosApiKey,
  android: env.revenueCatAndroidApiKey,
  default: env.revenueCatIosApiKey,
});

