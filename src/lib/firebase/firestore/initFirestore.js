import {
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentSingleTabManager,
} from "firebase/firestore";

function buildErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return typeof error === "string" && error.trim()
    ? error.trim()
    : "firestore_persistence_unavailable";
}

let cachedResult;

export function initializeFirestoreWithCache(firebaseApp) {
  if (cachedResult) {
    return cachedResult;
  }

  let firestore;
  let status = {
    persistenceEnabled: false,
    cacheType: "memory",
    error: "",
  };

  try {
    firestore = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager(),
      }),
    });

    status = {
      persistenceEnabled: true,
      cacheType: "persistent_single_tab",
      error: "",
    };
  } catch (error) {
    firestore = initializeFirestore(firebaseApp, {
      localCache: memoryLocalCache(),
    });

    status = {
      persistenceEnabled: false,
      cacheType: "memory",
      error: buildErrorMessage(error),
    };
  }

  cachedResult = { firestore, status };
  return cachedResult;
}

