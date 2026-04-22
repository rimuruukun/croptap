import { buildGameStateRecordId, requireOwnerUid } from "../db/syncMetadata";

export const SYNC_OPERATION_TYPES = Object.freeze({
  UPSERT_GAME_STATE: "upsertGameState",
  DELETE_GAME_STATE: "deleteGameState",
});

export const SYNC_MAX_RETRIES = 5;
export const SYNC_RETRY_BASE_DELAY_MS = 2000;
export const SYNC_INTERVAL_MS = 30000;

export const FIRESTORE_USERS_COLLECTION = "users";
export const FIRESTORE_GAME_DATA_COLLECTION = "gameData";
export const FIRESTORE_GAME_STATE_DOC_ID = "gameState";

export function getGameStateRecordId(ownerUid) {
  return buildGameStateRecordId(ownerUid);
}

export function getGameStateFirestorePath(ownerUid) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  return `${FIRESTORE_USERS_COLLECTION}/${normalizedOwnerUid}/${FIRESTORE_GAME_DATA_COLLECTION}/${FIRESTORE_GAME_STATE_DOC_ID}`;
}

export function getUserProfileFirestorePath(ownerUid) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  return `${FIRESTORE_USERS_COLLECTION}/${normalizedOwnerUid}`;
}
