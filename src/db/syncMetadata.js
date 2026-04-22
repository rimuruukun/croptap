export const RECORD_SYNC_STATUS = Object.freeze({
  PENDING: "pending",
  SYNCED: "synced",
  CONFLICT: "conflict",
  DELETED: "deleted",
});

export const QUEUE_STATUS = Object.freeze({
  PENDING: "pending",
  PROCESSING: "processing",
  CONFLICT: "conflict",
  DONE: "done",
});

export const SYNC_SCHEMA_VERSION = 1;

const GAME_STATE_RECORD_SUFFIX = "gameState";

export function requireOwnerUid(ownerUid) {
  const normalizedOwnerUid =
    typeof ownerUid === "string" ? ownerUid.trim() : "";

  if (!normalizedOwnerUid) {
    throw new Error("ownerUid is required.");
  }

  return normalizedOwnerUid;
}

export function buildGameStateRecordId(ownerUid) {
  return `${requireOwnerUid(ownerUid)}::${GAME_STATE_RECORD_SUFFIX}`;
}
