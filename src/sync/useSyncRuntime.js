import { useEffect, useRef, useState } from "react";
import { doc, getDocFromServer } from "firebase/firestore";

import { clearUserSyncSecret, loadUserSyncSecret } from "../security";
import { getPendingSyncOperations, markQueueOperationMigrated } from "../db/syncQueueTable";
import { getGameStateRecord } from "../db/gameStateTable";
import { firebaseAuth, firebaseDb } from "../lib/firebase/authentication/config/firebaseAuth";
import { startUserGameStateListener } from "./firestoreListener";
import { scheduleFirestoreGameStateFlush, disposeFirestoreWriteCoordinator } from "./firestoreWriteDispatcher";
import { createInitialSyncStatus } from "./syncStatus";
import {
  FIRESTORE_GAME_DATA_COLLECTION,
  FIRESTORE_GAME_STATE_DOC_ID,
  FIRESTORE_USERS_COLLECTION,
} from "./constants";
import { coerceUpdatedAt } from "./coerceUpdatedAt";
import { applyServerGameState } from "./writeGateway";

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

      try {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser && currentUser.uid === ownerUid) {
          const gameStateDocRef = doc(
            firebaseDb,
            FIRESTORE_USERS_COLLECTION,
            ownerUid,
            FIRESTORE_GAME_DATA_COLLECTION,
            FIRESTORE_GAME_STATE_DOC_ID,
          );

          const serverSnapshot = await getDocFromServer(gameStateDocRef);

          if (!isDisposed && serverSnapshot.exists()) {
            const localRecord = await getGameStateRecord(ownerUid);
            const localUpdatedAt = coerceUpdatedAt(localRecord?._updatedAt, 0);
            const localServerUpdatedAt = coerceUpdatedAt(
              localRecord?._serverUpdatedAt,
              0,
            );
            const serverUpdatedAt = coerceUpdatedAt(
              serverSnapshot.data()?.updatedAt,
              0,
            );

            if (serverUpdatedAt > Math.max(localUpdatedAt, localServerUpdatedAt)) {
              const runtime = await applyServerGameState(
                ownerUid,
                serverSnapshot.data(),
              );

              if (runtime && typeof onRemoteSnapshot === "function") {
                onRemoteSnapshot(runtime);
              }
            }
          }
        }
      } catch (error) {
        if (!isDisposed) {
          const message = getErrorMessage(
            error,
            "Failed to fetch latest save from server.",
          );
          setSyncError(message);
          setSyncStatus((current) => ({
            ...current,
            lastError: message,
          }));
        }
      } finally {
        if (!isDisposed) {
          setSyncStatus((current) => ({
            ...current,
            initialFetchComplete: true,
          }));
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
