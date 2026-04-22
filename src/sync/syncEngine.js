import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  getNextQueueReadyBatch,
  incrementQueueOperationRetry,
  markQueueOperationConflict,
  markQueueOperationSynced,
  requireOwnerUid,
} from "../db";
import {
  firebaseAuth,
  firebaseDb,
} from "../lib/firebase/authentication/config/firebaseAuth";
import {
  FIRESTORE_GAME_DATA_COLLECTION,
  FIRESTORE_GAME_STATE_DOC_ID,
  FIRESTORE_USERS_COLLECTION,
  SYNC_MAX_RETRIES,
  SYNC_OPERATION_TYPES,
  SYNC_RETRY_BASE_DELAY_MS,
} from "./constants";
import {
  getRawLocalGameStateRecord,
  markLocalGameStateConflict,
  markLocalGameStateSynced,
} from "./writeGateway";

const ownerSyncLocks = new Set();

class SyncConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "SyncConflictError";
  }
}

function getErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return typeof error === "string" && error.trim()
    ? error.trim()
    : "sync_failed";
}

function calculateRetryDelay(retryCount) {
  const safeRetryCount = Math.max(1, retryCount);
  const exponential = SYNC_RETRY_BASE_DELAY_MS * 2 ** (safeRetryCount - 1);
  return Math.min(exponential, 60000);
}

function getGameStateDocRef(ownerUid) {
  return doc(
    firebaseDb,
    FIRESTORE_USERS_COLLECTION,
    ownerUid,
    FIRESTORE_GAME_DATA_COLLECTION,
    FIRESTORE_GAME_STATE_DOC_ID,
  );
}

function getUserProfileDocRef(ownerUid) {
  return doc(firebaseDb, FIRESTORE_USERS_COLLECTION, ownerUid);
}

async function upsertGameState(ownerUid) {
  const localRecord = await getRawLocalGameStateRecord(ownerUid);

  if (!localRecord) {
    return;
  }

  const gameStateDocRef = getGameStateDocRef(ownerUid);
  const serverSnapshot = await getDoc(gameStateDocRef);
  const serverUpdatedAt = Number(serverSnapshot.data()?.updatedAt ?? 0);
  const localUpdatedAt = Number(localRecord._updatedAt ?? 0);

  if (serverSnapshot.exists() && serverUpdatedAt > localUpdatedAt) {
    throw new SyncConflictError(
      "Server copy is newer than local copy. Record marked as conflict.",
    );
  }

  await setDoc(
    gameStateDocRef,
    {
      ownerUid,
      payload: localRecord.payload,
      sig: localRecord._sig,
      schemaVersion: localRecord._version,
      updatedAt: localUpdatedAt,
      updatedBy: ownerUid,
      deleted: Boolean(localRecord._deleted),
      serverWrittenAt: serverTimestamp(),
    },
    { merge: true },
  );

  const playerPayload = localRecord.payload?.player ?? {};

  await setDoc(
    getUserProfileDocRef(ownerUid),
    {
      ownerUid,
      profile: {
        mode: playerPayload.mode || "credentials",
        nameCiphertext: playerPayload.name || "",
        emailCiphertext: playerPayload.email || "",
      },
      updatedAt: localUpdatedAt,
      updatedBy: ownerUid,
      serverWrittenAt: serverTimestamp(),
    },
    { merge: true },
  );

  await markLocalGameStateSynced(ownerUid, localUpdatedAt);
}

async function deleteGameState(ownerUid) {
  const gameStateDocRef = getGameStateDocRef(ownerUid);
  await deleteDoc(gameStateDocRef);

  await setDoc(
    getUserProfileDocRef(ownerUid),
    {
      ownerUid,
      updatedAt: Date.now(),
      updatedBy: ownerUid,
      gameStateDeletedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

function ensureSyncPreconditions(ownerUid, isOnline) {
  const currentUser = firebaseAuth.currentUser;

  if (!isOnline) {
    return {
      allowed: false,
      reason: "offline",
    };
  }

  if (!currentUser || currentUser.uid !== ownerUid) {
    return {
      allowed: false,
      reason: "unauthenticated",
    };
  }

  return {
    allowed: true,
    reason: "ok",
  };
}

async function processQueueEntry(ownerUid, queueEntry) {
  switch (queueEntry.operation) {
    case SYNC_OPERATION_TYPES.UPSERT_GAME_STATE:
      await upsertGameState(ownerUid);
      return;
    case SYNC_OPERATION_TYPES.DELETE_GAME_STATE:
      await deleteGameState(ownerUid);
      return;
    default:
      return;
  }
}

export async function processSyncQueue({
  ownerUid,
  isOnline = typeof navigator === "undefined" ? true : navigator.onLine,
  limit = 20,
} = {}) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);

  if (ownerSyncLocks.has(normalizedOwnerUid)) {
    return {
      skipped: true,
      reason: "in_progress",
      processed: 0,
      conflicts: 0,
      failed: 0,
    };
  }

  const preconditions = ensureSyncPreconditions(normalizedOwnerUid, isOnline);

  if (!preconditions.allowed) {
    return {
      skipped: true,
      reason: preconditions.reason,
      processed: 0,
      conflicts: 0,
      failed: 0,
    };
  }

  ownerSyncLocks.add(normalizedOwnerUid);

  let processed = 0;
  let conflicts = 0;
  let failed = 0;

  try {
    const queueEntries = await getNextQueueReadyBatch(
      normalizedOwnerUid,
      limit,
    );

    for (const queueEntry of queueEntries) {
      try {
        await processQueueEntry(normalizedOwnerUid, queueEntry);
        await markQueueOperationSynced(queueEntry.queueId);
        processed += 1;
      } catch (error) {
        const errorMessage = getErrorMessage(error);

        if (error instanceof SyncConflictError) {
          conflicts += 1;
          await markQueueOperationConflict(queueEntry.queueId, errorMessage);
          await markLocalGameStateConflict(normalizedOwnerUid, errorMessage);
          continue;
        }

        const nextRetryCount = Number(queueEntry.retryCount ?? 0) + 1;

        if (nextRetryCount >= SYNC_MAX_RETRIES) {
          failed += 1;
          await markQueueOperationConflict(queueEntry.queueId, errorMessage);
          await markLocalGameStateConflict(normalizedOwnerUid, errorMessage);
          continue;
        }

        await incrementQueueOperationRetry({
          queueId: queueEntry.queueId,
          retryCount: nextRetryCount,
          nextRetryAt: Date.now() + calculateRetryDelay(nextRetryCount),
          error: errorMessage,
        });
      }
    }

    return {
      skipped: false,
      reason: "ok",
      processed,
      conflicts,
      failed,
    };
  } finally {
    ownerSyncLocks.delete(normalizedOwnerUid);
  }
}
