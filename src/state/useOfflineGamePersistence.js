import { useCallback, useEffect, useRef, useState } from "react";

import {
  readVerifiedGameState,
  writeLocalGameState,
} from "../sync/gateway/writeGateway";
import { createDefaultSnapshot, normalizeSnapshot } from "./offlineGameState";

const DEFAULT_AUTOSAVE_DELAY_MS = 800;
const HYDRATION_LOAD_TIMEOUT_MS = 4500;
const HYDRATION_WATCHDOG_TIMEOUT_MS = 12000;
const SAVE_TIMEOUT_MS = 5000;

function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

export function useOfflineGamePersistence({
  snapshot,
  onHydrate,
  ownerUid = "",
  enabled = true,
  autosaveDelayMs = DEFAULT_AUTOSAVE_DELAY_MS,
}) {
  const [isHydrating, setIsHydrating] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [hydrationError, setHydrationError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isHydrationWatchdogTriggered, setIsHydrationWatchdogTriggered] =
    useState(false);

  const skipNextAutosaveRef = useRef(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    skipNextAutosaveRef.current = true;
    setIsSaving(false);
    setHasUnsavedChanges(false);
    setLastSavedAt(null);
    setHydrationError("");
    setSaveError("");
    setIsHydrationWatchdogTriggered(false);
    setIsHydrating(true);
    setIsHydrated(false);
  }, [enabled, ownerUid]);

  useEffect(() => {
    let isCancelled = false;
    let isHydrationSettled = false;

    async function hydrateFromStorage() {
      const canPersist = enabled && Boolean(ownerUid);

      if (!canPersist) {
        if (!isCancelled && isMountedRef.current) {
          onHydrate(createDefaultSnapshot());
          setIsHydrationWatchdogTriggered(false);
          setHydrationError("");
          setLastSavedAt(null);
          setIsHydrating(false);
          setIsHydrated(true);
        }

        return;
      }

      setIsHydrating(true);
      setHydrationError("");
      setIsHydrationWatchdogTriggered(false);

      const finalizeHydration = () => {
        if (isHydrationSettled || isCancelled || !isMountedRef.current) {
          return;
        }

        isHydrationSettled = true;
        setIsHydrating(false);
        setIsHydrated(true);
      };

      const triggerFallback = (message) => {
        if (isHydrationSettled || isCancelled || !isMountedRef.current) {
          return;
        }

        onHydrate(createDefaultSnapshot());
        setHydrationError(message);
        setIsHydrationWatchdogTriggered(true);
        setLastSavedAt(null);
        finalizeHydration();
      };

      const watchdogId = window.setTimeout(() => {
        triggerFallback(
          "Hydration took too long. Started with default local progress.",
        );
      }, HYDRATION_WATCHDOG_TIMEOUT_MS);

      try {
        const storedSnapshot = await withTimeout(
          readVerifiedGameState(ownerUid),
          HYDRATION_LOAD_TIMEOUT_MS,
          "Local save hydration timed out. Continuing with default progress.",
        );

        if (isHydrationSettled || isCancelled || !isMountedRef.current) {
          return;
        }

        const normalized = normalizeSnapshot(
          storedSnapshot?.snapshot ?? createDefaultSnapshot(),
        );

        onHydrate(normalized);

        if (!isCancelled && isMountedRef.current) {
          setLastSavedAt(normalized.meta.savedAt);
        }
      } catch (error) {
        if (isHydrationSettled || isCancelled || !isMountedRef.current) {
          return;
        }

        onHydrate(createDefaultSnapshot());

        setHydrationError(
          getErrorMessage(error, "Failed to load local save data."),
        );
      } finally {
        window.clearTimeout(watchdogId);

        if (!isHydrationSettled) {
          finalizeHydration();
        }
      }
    }

    hydrateFromStorage();

    return () => {
      isCancelled = true;
    };
  }, [enabled, onHydrate, ownerUid]);

  const persistSnapshotNow = useCallback(
    async (nextSnapshot) => {
      if (!enabled || !ownerUid || !nextSnapshot) {
        return false;
      }

      const savedAt = Date.now();
      const snapshotToSave = {
        ...nextSnapshot,
        meta: {
          ...(nextSnapshot.meta ?? {}),
          savedAt,
        },
      };

      setIsSaving(true);
      setSaveError("");

      try {
        await withTimeout(
          writeLocalGameState(ownerUid, snapshotToSave, {
            reason: "autosave_snapshot",
          }),
          SAVE_TIMEOUT_MS,
          "Local save write timed out. Progress will retry on next autosave.",
        );

        if (!isMountedRef.current) {
          return false;
        }

        setLastSavedAt(savedAt);
        setHasUnsavedChanges(false);
        return true;
      } catch (error) {
        if (!isMountedRef.current) {
          return false;
        }

        setSaveError(getErrorMessage(error, "Failed to save local progress."));
        return false;
      } finally {
        if (isMountedRef.current) {
          setIsSaving(false);
        }
      }
    },
    [enabled, ownerUid],
  );

  const forceHydrationFallback = () => {
    if (!isMountedRef.current) {
      return;
    }

    onHydrate(createDefaultSnapshot());
    setHydrationError(
      "Hydration was skipped manually. Running with default local progress.",
    );
    setIsHydrationWatchdogTriggered(true);
    setLastSavedAt(null);
    setIsHydrating(false);
    setIsHydrated(true);
  };

  useEffect(() => {
    if (!enabled || !ownerUid || !isHydrated || !snapshot) {
      return undefined;
    }

    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return undefined;
    }

    setHasUnsavedChanges(true);
    setSaveError("");

    const timeoutId = window.setTimeout(async () => {
      await persistSnapshotNow(snapshot);
    }, autosaveDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    autosaveDelayMs,
    enabled,
    isHydrated,
    ownerUid,
    persistSnapshotNow,
    snapshot,
  ]);

  return {
    isHydrating,
    isHydrated,
    isSaving,
    hasUnsavedChanges,
    lastSavedAt,
    hydrationError,
    saveError,
    isHydrationWatchdogTriggered,
    forceHydrationFallback,
    persistSnapshotNow,
  };
}
