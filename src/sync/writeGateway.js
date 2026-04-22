import {
  markGameStateAsConflict,
  markGameStateAsSynced,
  RECORD_SYNC_STATUS,
  SYNC_SCHEMA_VERSION,
  buildGameStateRecordId,
  getGameStateRecord,
  putGameStateRecord,
  quarantineGameStateRecord,
  requireOwnerUid,
} from "../db";
import { decryptString, encryptString } from "../security/encryption";
import { getUserSyncSecret } from "../security/secretManager";
import { signPayload, verifyPayloadSignature } from "../security/signing";
import { normalizeSnapshot } from "../state/offlineGameState";
import { scheduleFirestoreGameStateFlush } from "./firestoreWriteDispatcher";

function cloneSerializable(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildSignablePayload({
  ownerUid,
  payload,
  updatedAt,
  deleted,
  version,
}) {
  return {
    ownerUid,
    payload,
    updatedAt,
    deleted: Boolean(deleted),
    version,
  };
}

async function toStoredPayload(snapshot, secretBytes) {
  const normalizedSnapshot = normalizeSnapshot(snapshot);
  const storedPayload = cloneSerializable(normalizedSnapshot);
  const player = storedPayload.player ?? {};

  storedPayload.player = {
    ...player,
    name: await encryptString(player.name || "", secretBytes),
    email: await encryptString(player.email || "", secretBytes),
    isEncrypted: true,
  };

  return storedPayload;
}

async function toRuntimeSnapshot(storedPayload, secretBytes) {
  const runtimePayload = cloneSerializable(storedPayload);

  if (runtimePayload?.player?.isEncrypted) {
    runtimePayload.player = {
      ...runtimePayload.player,
      name: await decryptString(runtimePayload.player.name || "", secretBytes),
      email: await decryptString(
        runtimePayload.player.email || "",
        secretBytes,
      ),
    };

    delete runtimePayload.player.isEncrypted;
  }

  return normalizeSnapshot(runtimePayload);
}

function getSafeVersion(value) {
  return Number.isFinite(value) ? value : SYNC_SCHEMA_VERSION;
}

export async function writeLocalGameState(ownerUid, snapshot, options = {}) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  const existingRecord = await getGameStateRecord(normalizedOwnerUid);
  const secretBytes = await getUserSyncSecret(normalizedOwnerUid);
  const storedPayload = await toStoredPayload(snapshot, secretBytes);

  const updatedAt = Date.now();
  const version = getSafeVersion(existingRecord?._version);
  const signablePayload = buildSignablePayload({
    ownerUid: normalizedOwnerUid,
    payload: storedPayload,
    updatedAt,
    deleted: false,
    version,
  });

  const signature = await signPayload(signablePayload, secretBytes);
  const nextRecord = {
    id: buildGameStateRecordId(normalizedOwnerUid),
    ownerUid: normalizedOwnerUid,
    payload: storedPayload,
    _syncStatus: RECORD_SYNC_STATUS.PENDING,
    _updatedAt: updatedAt,
    _serverUpdatedAt: existingRecord?._serverUpdatedAt ?? null,
    _sig: signature,
    _version: version,
    _deleted: false,
  };

  await putGameStateRecord(nextRecord);

  if (typeof window !== "undefined") {
    scheduleFirestoreGameStateFlush(
      normalizedOwnerUid,
      options.reason || "local_write",
    );
  }

  return {
    record: nextRecord,
    queueLength: 0,
  };
}

export async function readVerifiedGameState(ownerUid) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  const record = await getGameStateRecord(normalizedOwnerUid);

  if (!record || record._deleted) {
    return null;
  }

  const secretBytes = await getUserSyncSecret(normalizedOwnerUid);
  const version = getSafeVersion(record._version);
  const signablePayload = buildSignablePayload({
    ownerUid: normalizedOwnerUid,
    payload: record.payload,
    updatedAt: Number(record._updatedAt ?? 0),
    deleted: Boolean(record._deleted),
    version,
  });

  const isValid = await verifyPayloadSignature(
    signablePayload,
    record._sig,
    secretBytes,
  );

  if (!isValid) {
    await quarantineGameStateRecord(normalizedOwnerUid, "signature_mismatch");
    return null;
  }

  try {
    const snapshot = await toRuntimeSnapshot(record.payload, secretBytes);

    return {
      snapshot,
      metadata: {
        syncStatus: record._syncStatus,
        updatedAt: record._updatedAt,
        serverUpdatedAt: record._serverUpdatedAt,
        version,
      },
    };
  } catch {
    await quarantineGameStateRecord(normalizedOwnerUid, "decryption_failed");
    return null;
  }
}

export async function deleteLocalGameState(ownerUid, options = {}) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  const existingRecord = await getGameStateRecord(normalizedOwnerUid);

  if (!existingRecord) {
    return;
  }

  const secretBytes = await getUserSyncSecret(normalizedOwnerUid);
  const updatedAt = Date.now();
  const version = getSafeVersion(existingRecord._version);

  const nextRecord = {
    ...existingRecord,
    _syncStatus: RECORD_SYNC_STATUS.DELETED,
    _updatedAt: updatedAt,
    _deleted: true,
  };

  const signablePayload = buildSignablePayload({
    ownerUid: normalizedOwnerUid,
    payload: nextRecord.payload,
    updatedAt,
    deleted: true,
    version,
  });

  nextRecord._sig = await signPayload(signablePayload, secretBytes);
  await putGameStateRecord(nextRecord);

  if (typeof window !== "undefined") {
    scheduleFirestoreGameStateFlush(
      normalizedOwnerUid,
      options.reason || "local_delete",
    );
  }
}

export async function applyServerGameState(ownerUid, serverDocument) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);

  if (!serverDocument || typeof serverDocument !== "object") {
    return null;
  }

  const secretBytes = await getUserSyncSecret(normalizedOwnerUid);
  const payload = cloneSerializable(serverDocument.payload ?? {});
  const updatedAt = Number(serverDocument.updatedAt ?? Date.now());
  const version = getSafeVersion(serverDocument.schemaVersion);
  const isDeleted = Boolean(serverDocument.deleted);

  const signablePayload = buildSignablePayload({
    ownerUid: normalizedOwnerUid,
    payload,
    updatedAt,
    deleted: isDeleted,
    version,
  });

  const localSignature = await signPayload(signablePayload, secretBytes);

  const nextRecord = {
    id: buildGameStateRecordId(normalizedOwnerUid),
    ownerUid: normalizedOwnerUid,
    payload,
    _syncStatus: isDeleted
      ? RECORD_SYNC_STATUS.DELETED
      : RECORD_SYNC_STATUS.SYNCED,
    _updatedAt: updatedAt,
    _serverUpdatedAt: updatedAt,
    _sig: localSignature,
    _version: version,
    _deleted: isDeleted,
  };

  await putGameStateRecord(nextRecord);

  if (isDeleted) {
    return null;
  }

  return toRuntimeSnapshot(payload, secretBytes);
}

export async function getRawLocalGameStateRecord(ownerUid) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  return getGameStateRecord(normalizedOwnerUid);
}

export async function isLocalGameStatePending(ownerUid) {
  const record = await getGameStateRecord(ownerUid);

  if (!record) {
    return false;
  }

  return record._syncStatus === RECORD_SYNC_STATUS.PENDING;
}

export async function markLocalGameStateSynced(ownerUid, serverUpdatedAt) {
  return markGameStateAsSynced(ownerUid, serverUpdatedAt);
}

export async function markLocalGameStateConflict(ownerUid, reason) {
  return markGameStateAsConflict(ownerUid, reason);
}
