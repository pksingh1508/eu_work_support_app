import { createMMKV } from 'react-native-mmkv';

type StorageValue = boolean | string | number | ArrayBuffer;

type LocalStorage = {
  set: (key: string, value: StorageValue) => void;
  getBoolean: (key: string) => boolean | undefined;
  getString: (key: string) => string | undefined;
  getNumber: (key: string) => number | undefined;
  remove: (key: string) => boolean;
};

export type ThemePreference = 'system' | 'light' | 'dark';

export type CachedAuthSnapshot = {
  lastSignedIn: boolean;
  userId: string | null;
  onboardingCompleted: boolean | null;
};

export const localStorageKeys = {
  authLastSignedIn: 'auth.lastSignedIn',
  authLastUserId: 'auth.lastUserId',
  authOnboardingCompleted: 'auth.onboardingCompleted',
  themePreference: 'settings.themePreference',
} as const;

const memoryStore = new Map<string, StorageValue>();

function createMemoryStorage(): LocalStorage {
  return {
    set: (key, value) => {
      memoryStore.set(key, value);
    },
    getBoolean: (key) => {
      const value = memoryStore.get(key);
      return typeof value === 'boolean' ? value : undefined;
    },
    getString: (key) => {
      const value = memoryStore.get(key);
      return typeof value === 'string' ? value : undefined;
    },
    getNumber: (key) => {
      const value = memoryStore.get(key);
      return typeof value === 'number' ? value : undefined;
    },
    remove: (key) => memoryStore.delete(key),
  };
}

function createAppStorage(): LocalStorage {
  try {
    return createMMKV({ id: 'eu-work-support.app' });
  } catch (error) {
    console.warn('MMKV is unavailable, falling back to in-memory storage.', error);
    return createMemoryStorage();
  }
}

export const appStorage = createAppStorage();

export function getCachedAuthSnapshot(): CachedAuthSnapshot {
  return {
    lastSignedIn: appStorage.getBoolean(localStorageKeys.authLastSignedIn) ?? false,
    userId: appStorage.getString(localStorageKeys.authLastUserId) ?? null,
    onboardingCompleted: appStorage.getBoolean(localStorageKeys.authOnboardingCompleted) ?? null,
  };
}

export function setCachedAuthSnapshot(snapshot: CachedAuthSnapshot) {
  appStorage.set(localStorageKeys.authLastSignedIn, snapshot.lastSignedIn);

  if (snapshot.userId) {
    appStorage.set(localStorageKeys.authLastUserId, snapshot.userId);
  } else {
    appStorage.remove(localStorageKeys.authLastUserId);
  }

  if (typeof snapshot.onboardingCompleted === 'boolean') {
    appStorage.set(localStorageKeys.authOnboardingCompleted, snapshot.onboardingCompleted);
  } else {
    appStorage.remove(localStorageKeys.authOnboardingCompleted);
  }
}

export function clearCachedAuthSnapshot() {
  setCachedAuthSnapshot({
    lastSignedIn: false,
    userId: null,
    onboardingCompleted: null,
  });
}

export function getThemePreference(): ThemePreference {
  const value = appStorage.getString(localStorageKeys.themePreference);

  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }

  appStorage.set(localStorageKeys.themePreference, 'system');
  return 'system';
}

export function setThemePreference(preference: ThemePreference) {
  appStorage.set(localStorageKeys.themePreference, preference);
}
