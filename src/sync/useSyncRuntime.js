import { useEffect, useRef, useState } from "react";

import { clearUserSyncSecret, loadUserSyncSecret } from "../security";
import { getPendingSyncOperations, markQueueOperationMigrated } from "../db/syncQueueTable";
import { startUserGameStateListener } from "./firestoreListener";
import { scheduleFirestoreGameStateFlush, disposeFirestoreWriteCoordinator } from "./firestoreWriteDispatcher";
import { createInitialSyncStatus } from "./syncStatus";

function createNoop() {
  return () => {};
}

function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function useSyncRuntime({ ownerUid, isHydrated, onRemoteSnapshot }) {
  const [syncError, setSyncError] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [syncStatus, setSyncStatus] = useState(createInitialSyncStatus());
  const triggerRemoteFlushRef = useRef(async () => {});

  useEffect(() => {
    if (!ownerUid || !isHydrated) {
      setSyncError("");
      setLastSyncAt(null);
      setSyncStatus(createInitialSyncStatus());
      triggerRemoteFlushRef.current = async () => {};
      return createNoop();
    }

    let isDisposed = false;
    let unsubscribe = createNoop();

    const handleOnline = () => {
      scheduleFirestoreGameStateFlush(ownerUid, "online_retry");
    };

    const initialize = async () => {
      try {
        await loadUserSyncSecret(ownerUid);
      } catch (error) {
        if (!isDisposed) {
          setSyncError(
            getErrorMessage(error, "Failed to load sync secret for this user."),
          );
        }
        return;
      }

      if (isDisposed) {
        return;
      }

      try {
        unsubscribe = startUserGameStateListener({
          ownerUid,
          onRemoteSnapshot,
          onStatus: setSyncStatus,
          onError: (error) => {
            if (!isDisposed) {
              const message = getErrorMessage(
                error,
                "Realtime sync listener encountered an error.",
              );
              setSyncError(message);
              setSyncStatus((current) => ({
                ...current,
                lastError: message,
              }));
            }
          },
        });
      } catch (error) {
        if (!isDisposed) {
          setSyncError(
            getErrorMessage(error, "Failed to start realtime sync listener."),
          );
        }
      }

      triggerRemoteFlushRef.current = async () => {
        scheduleFirestoreGameStateFlush(ownerUid, "manual_trigger");
      };

      try {
        const pending = await getPendingSyncOperations(ownerUid, 50);
        for (const entry of pending) {
          if (isDisposed) {
            return;
          }

          scheduleFirestoreGameStateFlush(ownerUid, "queue_migration");
          await markQueueOperationMigrated(entry.queueId);
        }
      } catch {
        // Migration is best-effort; keep runtime non-blocking.
      }

      scheduleFirestoreGameStateFlush(ownerUid, "startup_flush");

      window.addEventListener("online", handleOnline);
    };

    void initialize();

    return () => {
      isDisposed = true;
      window.removeEventListener("online", handleOnline);

      unsubscribe();
      disposeFirestoreWriteCoordinator(ownerUid);
      clearUserSyncSecret(ownerUid);
    };
  }, [isHydrated, onRemoteSnapshot, ownerUid]);

  useEffect(() => {
    if (!syncStatus?.lastRemoteApplyAt) {
      return;
    }

    setLastSyncAt(syncStatus.lastRemoteApplyAt);
  }, [syncStatus?.lastRemoteApplyAt]);

  return {
    isSyncing: Boolean(syncStatus?.hasPendingWrites),
    syncError,
    lastSyncAt,
    syncStatus,
    triggerSync: async () => triggerRemoteFlushRef.current(),
  };
}
