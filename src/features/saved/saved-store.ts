import { useMemo } from "react";
import { create } from "zustand";

import {
  fetchSavedItems,
  SavedCountry,
  SavedDocument,
  setCountrySaved,
  setDocumentSaved,
} from "@/lib/saved-items";
import { appStorage, localStorageKeys } from "@/lib/local-storage";

export type SavedStoreStatus = "idle" | "loading" | "ready" | "error";
export type SavedMutationStatus = "saving" | "removing";

export const savedItemsFreshnessTtlMs = 3 * 60 * 1000;

export type SaveCountryPayload = {
  clerkUserId: string;
  countryId: string;
  country?: SavedCountry;
};

export type UnsaveCountryPayload = {
  clerkUserId: string;
  countryId: string;
};

export type SaveDocumentPayload = {
  clerkUserId: string;
  documentId: string;
  document?: SavedDocument;
};

export type UnsaveDocumentPayload = {
  clerkUserId: string;
  documentId: string;
};

type PersistedSavedSnapshot = {
  userId: string;
  countryIds: string[];
  documentIds: string[];
  countries: SavedCountry[];
  documents: SavedDocument[];
  lastFetchedAt: number | null;
};

export type SavedStoreState = {
  userId: string | null;
  countryIds: Set<string>;
  documentIds: Set<string>;
  countries: SavedCountry[];
  documents: SavedDocument[];
  status: SavedStoreStatus;
  lastFetchedAt: number | null;
  pendingMutations: Record<string, SavedMutationStatus>;
  hydrateForUser: (userId: string) => Promise<void>;
  refresh: (userId: string) => Promise<void>;
  saveCountryOptimistic: (payload: SaveCountryPayload) => Promise<void>;
  unsaveCountryOptimistic: (payload: UnsaveCountryPayload) => Promise<void>;
  saveDocumentOptimistic: (payload: SaveDocumentPayload) => Promise<void>;
  unsaveDocumentOptimistic: (payload: UnsaveDocumentPayload) => Promise<void>;
  reset: () => void;
};

const initialState = {
  userId: null,
  countryIds: new Set<string>(),
  documentIds: new Set<string>(),
  countries: [],
  documents: [],
  status: "idle" as const,
  lastFetchedAt: null,
  pendingMutations: {},
};

let activeRefreshUserId: string | null = null;
let activeRefreshPromise: Promise<void> | null = null;

function countryIdsFrom(countries: SavedCountry[]) {
  return new Set(countries.map((country) => country.countryId));
}

function documentIdsFrom(documents: SavedDocument[]) {
  return new Set(documents.map((document) => document.documentId));
}

function mutationKey(type: "country" | "document", id: string) {
  return `${type}:${id}`;
}

function isFresh(lastFetchedAt: number | null) {
  return Boolean(
    lastFetchedAt && Date.now() - lastFetchedAt < savedItemsFreshnessTtlMs,
  );
}

function readPersistedSnapshot() {
  const rawSnapshot = appStorage.getString(localStorageKeys.savedItemsSnapshot);

  if (!rawSnapshot) {
    return null;
  }

  try {
    const snapshot = JSON.parse(rawSnapshot) as Partial<PersistedSavedSnapshot>;

    if (!snapshot.userId) {
      return null;
    }

    return {
      userId: snapshot.userId,
      countryIds: Array.isArray(snapshot.countryIds)
        ? snapshot.countryIds.filter((id): id is string => typeof id === "string")
        : [],
      documentIds: Array.isArray(snapshot.documentIds)
        ? snapshot.documentIds.filter((id): id is string => typeof id === "string")
        : [],
      countries: Array.isArray(snapshot.countries)
        ? (snapshot.countries.filter(Boolean) as SavedCountry[])
        : [],
      documents: Array.isArray(snapshot.documents)
        ? (snapshot.documents.filter(Boolean) as SavedDocument[])
        : [],
      lastFetchedAt:
        typeof snapshot.lastFetchedAt === "number" ? snapshot.lastFetchedAt : null,
    };
  } catch (error) {
    console.warn("Unable to read saved items cache", error);
    appStorage.remove(localStorageKeys.savedItemsSnapshot);
    return null;
  }
}

function writePersistedSnapshot({
  userId,
  countryIds,
  documentIds,
  countries,
  documents,
  lastFetchedAt,
}: {
  userId: string | null;
  countryIds: Set<string>;
  documentIds: Set<string>;
  countries: SavedCountry[];
  documents: SavedDocument[];
  lastFetchedAt: number | null;
}) {
  if (!userId) {
    appStorage.remove(localStorageKeys.savedItemsSnapshot);
    return;
  }

  const snapshot: PersistedSavedSnapshot = {
    userId,
    countryIds: Array.from(countryIds),
    documentIds: Array.from(documentIds),
    countries,
    documents,
    lastFetchedAt,
  };

  appStorage.set(
    localStorageKeys.savedItemsSnapshot,
    JSON.stringify(snapshot),
  );
}

function clearMutation(
  pendingMutations: Record<string, SavedMutationStatus>,
  key: string,
) {
  const nextPendingMutations = { ...pendingMutations };
  delete nextPendingMutations[key];
  return nextPendingMutations;
}

export const useSavedStore = create<SavedStoreState>((set, get) => ({
  ...initialState,

  hydrateForUser: async (userId) => {
    const currentState = get();

    if (
      currentState.userId === userId &&
      currentState.status === "ready" &&
      isFresh(currentState.lastFetchedAt)
    ) {
      return;
    }

    const snapshot = readPersistedSnapshot();
    const canUseSnapshot = snapshot?.userId === userId;

    if (canUseSnapshot) {
      const shouldReplaceState =
        currentState.userId !== userId ||
        currentState.lastFetchedAt !== snapshot.lastFetchedAt;

      if (!shouldReplaceState && isFresh(snapshot.lastFetchedAt)) {
        return;
      }

      set({
        userId,
        countryIds: new Set(snapshot.countryIds),
        documentIds: new Set(snapshot.documentIds),
        countries: snapshot.countries,
        documents: snapshot.documents,
        status: "ready",
        lastFetchedAt: snapshot.lastFetchedAt,
        pendingMutations: {},
      });

      if (!isFresh(snapshot.lastFetchedAt)) {
        void get().refresh(userId);
      }

      return;
    } else {
      appStorage.remove(localStorageKeys.savedItemsSnapshot);
      set({
        ...initialState,
        userId,
        status: "loading",
      });
    }

    await get().refresh(userId);
  },

  refresh: async (userId) => {
    if (activeRefreshUserId === userId && activeRefreshPromise) {
      return activeRefreshPromise;
    }

    set((state) => ({
      userId,
      status:
        state.userId === userId &&
        (state.countries.length > 0 || state.documents.length > 0)
          ? "ready"
          : "loading",
    }));

    activeRefreshUserId = userId;
    activeRefreshPromise = (async () => {
      const savedItems = await fetchSavedItems(userId);
      const countryIds = countryIdsFrom(savedItems.countries);
      const documentIds = documentIdsFrom(savedItems.documents);
      const lastFetchedAt = Date.now();

      if (activeRefreshUserId !== userId) {
        return;
      }

      set({
        userId,
        countryIds,
        documentIds,
        countries: savedItems.countries,
        documents: savedItems.documents,
        status: "ready",
        lastFetchedAt,
        pendingMutations: {},
      });

      writePersistedSnapshot({
        userId,
        countryIds,
        documentIds,
        countries: savedItems.countries,
        documents: savedItems.documents,
        lastFetchedAt,
      });
    })()
      .catch((error) => {
        console.warn("Unable to refresh saved items", error);
        set({ status: "error" });
      })
      .finally(() => {
        if (activeRefreshUserId === userId) {
          activeRefreshUserId = null;
          activeRefreshPromise = null;
        }
      });

    return activeRefreshPromise;
  },

  saveCountryOptimistic: async ({ clerkUserId, countryId, country }) => {
    const key = mutationKey("country", countryId);
    const previousState = get();
    const nextCountryIds = new Set(previousState.countryIds).add(countryId);
    const nextCountries =
      country && !previousState.countryIds.has(countryId)
        ? [country, ...previousState.countries]
        : previousState.countries;

    set({
      userId: clerkUserId,
      countryIds: nextCountryIds,
      countries: nextCountries,
      pendingMutations: {
        ...previousState.pendingMutations,
        [key]: "saving",
      },
    });

    writePersistedSnapshot({
      ...get(),
      userId: clerkUserId,
    });

    try {
      await setCountrySaved({ clerkUserId, countryId, shouldSave: true });
    } catch (error) {
      set({
        countryIds: previousState.countryIds,
        countries: previousState.countries,
      });
      writePersistedSnapshot(previousState);
      throw error;
    } finally {
      set((state) => ({
        pendingMutations: clearMutation(state.pendingMutations, key),
      }));
    }
  },

  unsaveCountryOptimistic: async ({ clerkUserId, countryId }) => {
    const key = mutationKey("country", countryId);
    const previousState = get();
    const nextCountryIds = new Set(previousState.countryIds);
    nextCountryIds.delete(countryId);

    const nextCountries = previousState.countries.filter(
      (country) => country.countryId !== countryId,
    );

    set({
      userId: clerkUserId,
      countryIds: nextCountryIds,
      countries: nextCountries,
      pendingMutations: {
        ...previousState.pendingMutations,
        [key]: "removing",
      },
    });

    writePersistedSnapshot({
      ...get(),
      userId: clerkUserId,
    });

    try {
      await setCountrySaved({ clerkUserId, countryId, shouldSave: false });
    } catch (error) {
      set({
        countryIds: previousState.countryIds,
        countries: previousState.countries,
      });
      writePersistedSnapshot(previousState);
      throw error;
    } finally {
      set((state) => ({
        pendingMutations: clearMutation(state.pendingMutations, key),
      }));
    }
  },

  saveDocumentOptimistic: async ({ clerkUserId, documentId, document }) => {
    const key = mutationKey("document", documentId);
    const previousState = get();
    const nextDocumentIds = new Set(previousState.documentIds).add(documentId);
    const nextDocuments =
      document && !previousState.documentIds.has(documentId)
        ? [document, ...previousState.documents]
        : previousState.documents;

    set({
      userId: clerkUserId,
      documentIds: nextDocumentIds,
      documents: nextDocuments,
      pendingMutations: {
        ...previousState.pendingMutations,
        [key]: "saving",
      },
    });

    writePersistedSnapshot({
      ...get(),
      userId: clerkUserId,
    });

    try {
      await setDocumentSaved({ clerkUserId, documentId, shouldSave: true });
    } catch (error) {
      set({
        documentIds: previousState.documentIds,
        documents: previousState.documents,
      });
      writePersistedSnapshot(previousState);
      throw error;
    } finally {
      set((state) => ({
        pendingMutations: clearMutation(state.pendingMutations, key),
      }));
    }
  },

  unsaveDocumentOptimistic: async ({ clerkUserId, documentId }) => {
    const key = mutationKey("document", documentId);
    const previousState = get();
    const nextDocumentIds = new Set(previousState.documentIds);
    nextDocumentIds.delete(documentId);

    const nextDocuments = previousState.documents.filter(
      (document) => document.documentId !== documentId,
    );

    set({
      userId: clerkUserId,
      documentIds: nextDocumentIds,
      documents: nextDocuments,
      pendingMutations: {
        ...previousState.pendingMutations,
        [key]: "removing",
      },
    });

    writePersistedSnapshot({
      ...get(),
      userId: clerkUserId,
    });

    try {
      await setDocumentSaved({ clerkUserId, documentId, shouldSave: false });
    } catch (error) {
      set({
        documentIds: previousState.documentIds,
        documents: previousState.documents,
      });
      writePersistedSnapshot(previousState);
      throw error;
    } finally {
      set((state) => ({
        pendingMutations: clearMutation(state.pendingMutations, key),
      }));
    }
  },

  reset: () => {
    activeRefreshUserId = null;
    activeRefreshPromise = null;
    appStorage.remove(localStorageKeys.savedItemsSnapshot);
    set(initialState);
  },
}));

export function useIsCountrySaved(countryId: string | null | undefined) {
  return useSavedStore((state) =>
    countryId ? state.countryIds.has(countryId) : false,
  );
}

export function useIsDocumentSaved(documentId: string | null | undefined) {
  return useSavedStore((state) =>
    documentId ? state.documentIds.has(documentId) : false,
  );
}

export function useSavedCountrySlugs() {
  const countries = useSavedStore((state) => state.countries);

  return useMemo(
    () => new Set(countries.map((country) => country.slug)),
    [countries],
  );
}
