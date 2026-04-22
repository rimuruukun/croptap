import { doc, onSnapshot } from "firebase/firestore";

import {
  getGameStateRecord,
  requireOwnerUid,
  RECORD_SYNC_STATUS,
} from "../../db";
import {
  firebaseAuth,
  firebaseDb,
  firestoreCacheStatus,
} from "../../lib/firebase/authentication/config/firebaseAuth";
import {
  FIRESTORE_GAME_DATA_COLLECTION,
  FIRESTORE_GAME_STATE_DOC_ID,
  FIRESTORE_USERS_COLLECTION,
} from "../constants";
import { coerceUpdatedAt } from "../utils/coerceUpdatedAt";
import {
  applyServerGameState,
  markLocalGameStateSynced,
} from "../gateway/writeGateway";

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
      const serverUpdatedAt = coerceUpdatedAt(snapshot.data()?.updatedAt, 0);

      if (typeof onStatus === "function") {
        onStatus((current) => ({
          ...(current ?? {}),
          persistenceEnabled: Boolean(firestoreCacheStatus?.persistenceEnabled),
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
        const localUpdatedAt = coerceUpdatedAt(localRecord?._updatedAt, 0);
        const localServerUpdatedAt = coerceUpdatedAt(
          localRecord?._serverUpdatedAt,
          0,
        );

        if (hasPendingWrites) {
          return;
        }

        // If local has unsynced changes newer than the server copy, don't rollback.
        if (
          localRecord?._syncStatus === RECORD_SYNC_STATUS.PENDING &&
          localUpdatedAt > serverUpdatedAt
        ) {
          return;
        }

        // If this server snapshot matches our latest local write, mark it as synced
        // even if the user stays on the same value.
        if (
          localRecord?._syncStatus === RECORD_SYNC_STATUS.PENDING &&
          serverUpdatedAt === localUpdatedAt
        ) {
          await markLocalGameStateSynced(normalizedOwnerUid, serverUpdatedAt);
          return;
        }

        // If we already applied this (or a newer) server snapshot, don't re-apply.
        if (serverUpdatedAt <= Math.max(localServerUpdatedAt, localUpdatedAt)) {
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
