export function createInitialSyncStatus() {
  return {
    persistenceEnabled: false,
    cacheType: "unknown",
    cacheSource: "unknown", // "server" | "cache" | "unknown"
    hasPendingWrites: false,
    lastRemoteApplyAt: null,
    lastError: "",
  };
}

