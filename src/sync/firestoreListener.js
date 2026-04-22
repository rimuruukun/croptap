import { doc, onSnapshot } from "firebase/firestore";

import { getGameStateRecord, requireOwnerUid, RECORD_SYNC_STATUS } from "../db";
import {
  firebaseAuth,
  firebaseDb,
  firestoreCacheStatus,
} from "../lib/firebase/authentication/config/firebaseAuth";
import {
  FIRESTORE_GAME_DATA_COLLECTION,
  FIRESTORE_GAME_STATE_DOC_ID,
  FIRESTORE_USERS_COLLECTION,
} from "./constants";
import { applyServerGameState } from "./writeGateway";

export function startUserGameStateListener({
  ownerUid,
  onRemoteSnapshot,
  onStatus,
  onError,
}) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  const currentUser = firebaseAuth.currentUser;

  if (!currentUser || currentUser.uid !== normalizedOwnerUid) {
    throw new Error(
      "Cannot start listener without matching authenticated user.",
    );
  }

  const gameStateDocRef = doc(
    firebaseDb,
    FIRESTORE_USERS_COLLECTION,
    normalizedOwnerUid,
    FIRESTORE_GAME_DATA_COLLECTION,
    FIRESTORE_GAME_STATE_DOC_ID,
  );

  if (typeof onStatus === "function") {
    onStatus((current) => ({
      ...(current ?? {}),
      persistenceEnabled: Boolean(firestoreCacheStatus?.persistenceEnabled),
      cacheType: firestoreCacheStatus?.cacheType || "unknown",
      cacheSource: "unknown",
      hasPendingWrites: false,
      lastRemoteApplyAt: null,
      lastError: firestoreCacheStatus?.error || "",
    }));
  }

  return onSnapshot(
    gameStateDocRef,
    { includeMetadataChanges: true },
    async (snapshot) => {
      const metadata = snapshot.metadata;
      const cacheSource = metadata?.fromCache ? "cache" : "server";
      const hasPendingWrites = Boolean(metadata?.hasPendingWrites);

      if (typeof onStatus === "function") {
        onStatus((current) => ({
          ...(current ?? {}),
          persistenceEnabled: Boolean(
            firestoreCacheStatus?.persistenceEnabled,
          ),
          cacheType: firestoreCacheStatus?.cacheType || "unknown",
          cacheSource,
          hasPendingWrites,
          lastError: firestoreCacheStatus?.error || "",
        }));
      }

      if (!snapshot.exists()) {
        return;
      }

      try {
        const localRecord = await getGameStateRecord(normalizedOwnerUid);

        if (hasPendingWrites) {
          return;
        }

        if (localRecord?._syncStatus === RECORD_SYNC_STATUS.PENDING) {
          const localUpdatedAt = Number(localRecord?._updatedAt ?? 0);
          const serverUpdatedAt = Number(snapshot.data()?.updatedAt ?? 0);

          if (localUpdatedAt > serverUpdatedAt) {
            return;
          }

          return;
        }

        const runtimeSnapshot = await applyServerGameState(
          normalizedOwnerUid,
          snapshot.data(),
        );

        if (runtimeSnapshot && typeof onRemoteSnapshot === "function") {
          onRemoteSnapshot(runtimeSnapshot);
        }

        if (typeof onStatus === "function") {
          onStatus((current) => ({
            ...(current ?? {}),
            lastRemoteApplyAt: Date.now(),
          }));
        }
      } catch (error) {
        if (typeof onError === "function") {
          onError(error);
        }

        if (typeof onStatus === "function") {
          onStatus((current) => ({
            ...(current ?? {}),
            lastError:
              error instanceof Error && error.message
                ? error.message
                : "listener_error",
          }));
        }
      }
    },
    (error) => {
      if (typeof onError === "function") {
        onError(error);
      }

      if (typeof onStatus === "function") {
        onStatus((current) => ({
          ...(current ?? {}),
          lastError:
            error instanceof Error && error.message
              ? error.message
              : "listener_error",
        }));
      }
    },
  );
}
