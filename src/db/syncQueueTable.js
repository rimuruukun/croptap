import Dexie from "dexie";

import { gameDatabase, initializeGameDatabase } from "./gameDatabase";
import { QUEUE_STATUS, requireOwnerUid } from "./syncMetadata";

function buildErrorMessage(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return typeof error === "string" && error.trim()
    ? error.trim()
    : "sync_operation_failed";
}

function sortByCreatedAt(entries) {
  return [...entries].sort((left, right) => {
    const leftCreatedAt = Number(left?.createdAt ?? 0);
    const rightCreatedAt = Number(right?.createdAt ?? 0);

    if (leftCreatedAt === rightCreatedAt) {
      return Number(left?.queueId ?? 0) - Number(right?.queueId ?? 0);
    }

    return leftCreatedAt - rightCreatedAt;
  });
}

export async function enqueueSyncOperation({
  ownerUid,
  operation,
  recordId,
  payload = {},
}) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);

  if (!operation || typeof operation !== "string") {
    throw new Error("operation is required.");
  }

  if (!recordId || typeof recordId !== "string") {
    throw new Error("recordId is required.");
  }

  await initializeGameDatabase();

  const existingPending = await gameDatabase.syncQueue
    .where("[ownerUid+recordId+status]")
    .equals([normalizedOwnerUid, recordId, QUEUE_STATUS.PENDING])
    .and((entry) => entry.operation === operation)
    .first();

  const now = Date.now();

  if (existingPending) {
    await gameDatabase.syncQueue.update(existingPending.queueId, {
      payload,
      createdAt: now,
      retryCount: 0,
      nextRetryAt: null,
      lastError: "",
      status: QUEUE_STATUS.PENDING,
    });

    return existingPending.queueId;
  }

  return gameDatabase.syncQueue.add({
    ownerUid: normalizedOwnerUid,
    operation,
    recordId,
    payload,
    status: QUEUE_STATUS.PENDING,
    retryCount: 0,
    lastError: "",
    nextRetryAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

export async function getPendingSyncOperations(ownerUid, limit = 25) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  await initializeGameDatabase();

  const pending = await gameDatabase.syncQueue
    .where("[ownerUid+status]")
    .equals([normalizedOwnerUid, QUEUE_STATUS.PENDING])
    .toArray();

  return sortByCreatedAt(pending).slice(0, Math.max(1, limit));
}

export async function markQueueOperationSynced(queueId) {
  await initializeGameDatabase();

  await gameDatabase.syncQueue.update(queueId, {
    status: QUEUE_STATUS.DONE,
    updatedAt: Date.now(),
    lastError: "",
    retryCount: 0,
    nextRetryAt: null,
  });

  await gameDatabase.syncQueue.delete(queueId);
}

export async function markQueueOperationMigrated(queueId) {
  await initializeGameDatabase();

  await gameDatabase.syncQueue.update(queueId, {
    status: QUEUE_STATUS.DONE,
    updatedAt: Date.now(),
    lastError: "",
    retryCount: 0,
    nextRetryAt: null,
    migratedAt: Date.now(),
  });
}

export async function markQueueOperationConflict(queueId, error) {
  await initializeGameDatabase();

  await gameDatabase.syncQueue.update(queueId, {
    status: QUEUE_STATUS.CONFLICT,
    updatedAt: Date.now(),
    lastError: buildErrorMessage(error),
  });
}

export async function incrementQueueOperationRetry({
  queueId,
  retryCount,
  nextRetryAt,
  error,
}) {
  await initializeGameDatabase();

  await gameDatabase.syncQueue.update(queueId, {
    status: QUEUE_STATUS.PENDING,
    updatedAt: Date.now(),
    retryCount,
    nextRetryAt,
    lastError: buildErrorMessage(error),
  });
}

export async function removeQueueOperation(queueId) {
  await initializeGameDatabase();
  await gameDatabase.syncQueue.delete(queueId);
}

export async function clearSyncQueue(ownerUid) {
  await initializeGameDatabase();

  if (!ownerUid) {
    await gameDatabase.syncQueue.clear();
    return;
  }

  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  await gameDatabase.syncQueue
    .where("ownerUid")
    .equals(normalizedOwnerUid)
    .delete();
}

export async function getSyncQueueCount(ownerUid) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  await initializeGameDatabase();

  return gameDatabase.syncQueue
    .where("[ownerUid+status]")
    .equals([normalizedOwnerUid, QUEUE_STATUS.PENDING])
    .count();
}

export async function getNextQueueReadyBatch(ownerUid, limit = 25) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  const now = Date.now();
  const pending = await getPendingSyncOperations(normalizedOwnerUid, limit * 2);

  const filtered = pending.filter((entry) => {
    const nextRetryAt = Number(entry?.nextRetryAt ?? 0);
    return !nextRetryAt || nextRetryAt <= now;
  });

  return filtered.slice(0, Math.max(1, limit));
}

export function getQueueStatusValues() {
  return { ...QUEUE_STATUS };
}

export function getDexieKeyBounds() {
  return {
    min: Dexie.minKey,
    max: Dexie.maxKey,
  };
}
