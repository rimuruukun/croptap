import { gameDatabase, initializeGameDatabase } from "./gameDatabase";
import {
  RECORD_SYNC_STATUS,
  buildGameStateRecordId,
  requireOwnerUid,
} from "./syncMetadata";

function buildTimestamp(value) {
  return Number.isFinite(value) ? value : Date.now();
}

function buildServerTimestamp(value) {
  return Number.isFinite(value) ? value : null;
}

export async function getGameStateRecord(ownerUid) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  await initializeGameDatabase();

  const record = await gameDatabase.gameState.get(
    buildGameStateRecordId(normalizedOwnerUid),
  );

  return record ?? null;
}

export async function putGameStateRecord(record) {
  if (!record || typeof record !== "object") {
    throw new Error("record is required.");
  }

  const normalizedOwnerUid = requireOwnerUid(record.ownerUid);
  const nextRecord = {
    ...record,
    id: buildGameStateRecordId(normalizedOwnerUid),
    ownerUid: normalizedOwnerUid,
    _syncStatus: record._syncStatus || RECORD_SYNC_STATUS.PENDING,
    _updatedAt: buildTimestamp(record._updatedAt),
    _serverUpdatedAt: buildServerTimestamp(record._serverUpdatedAt),
    _version: Number.isFinite(record._version) ? record._version : 1,
    _deleted: Boolean(record._deleted),
  };

  await initializeGameDatabase();
  await gameDatabase.gameState.put(nextRecord);

  return nextRecord;
}

export async function patchGameStateRecord(ownerUid, patch) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  const existingRecord = await getGameStateRecord(normalizedOwnerUid);

  if (!existingRecord) {
    return null;
  }

  const nextRecord = {
    ...existingRecord,
    ...(patch ?? {}),
    ownerUid: normalizedOwnerUid,
    id: buildGameStateRecordId(normalizedOwnerUid),
  };

  await putGameStateRecord(nextRecord);
  return nextRecord;
}

export async function markGameStateAsSynced(ownerUid, serverUpdatedAt) {
  return patchGameStateRecord(ownerUid, {
    _syncStatus: RECORD_SYNC_STATUS.SYNCED,
    _serverUpdatedAt: buildTimestamp(serverUpdatedAt),
  });
}

export async function markGameStateAsConflict(ownerUid, reason) {
  return patchGameStateRecord(ownerUid, {
    _syncStatus: RECORD_SYNC_STATUS.CONFLICT,
    _conflictReason:
      typeof reason === "string" && reason.trim()
        ? reason.trim()
        : "sync_conflict",
    _conflictAt: Date.now(),
  });
}

export async function quarantineGameStateRecord(ownerUid, reason) {
  return patchGameStateRecord(ownerUid, {
    _syncStatus: RECORD_SYNC_STATUS.CONFLICT,
    _isQuarantined: true,
    _quarantinedReason:
      typeof reason === "string" && reason.trim()
        ? reason.trim()
        : "integrity_check_failed",
    _quarantinedAt: Date.now(),
  });
}

export async function markGameStateAsDeleted(ownerUid) {
  return patchGameStateRecord(ownerUid, {
    _syncStatus: RECORD_SYNC_STATUS.DELETED,
    _deleted: true,
    _updatedAt: Date.now(),
  });
}

export async function deleteGameStateRecord(ownerUid) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  await initializeGameDatabase();

  await gameDatabase.gameState.delete(
    buildGameStateRecordId(normalizedOwnerUid),
  );
}
