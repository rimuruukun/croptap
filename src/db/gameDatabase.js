import Dexie from "dexie";

const DATABASE_NAME = "croptap-redesign-db";
const DATABASE_VERSION = 1;
const LEGACY_DATABASE_NAME = "croptap-offline-db";
const CUTOVER_FLAG_KEY = "croptap.storage.cutover.v1";

class CropTapGameDatabase extends Dexie {
  constructor() {
    super(DATABASE_NAME);

    this.version(DATABASE_VERSION).stores({
      gameState:
        "&id, ownerUid, _syncStatus, [ownerUid+_syncStatus], _updatedAt, _serverUpdatedAt",
      syncQueue:
        "++queueId, ownerUid, operation, recordId, status, createdAt, [ownerUid+status], [ownerUid+status+createdAt], [ownerUid+recordId+status], retryCount, nextRetryAt",
    });
  }
}

export const gameDatabase = new CropTapGameDatabase();

let initializePromise;

function canUseBrowserApis() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function deleteIndexedDatabase(name) {
  if (!canUseBrowserApis()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(name);

    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

async function runHardCutoverReset() {
  if (!canUseBrowserApis()) {
    return;
  }

  const hasCutoverFlag = window.localStorage.getItem(CUTOVER_FLAG_KEY) === "1";

  if (hasCutoverFlag) {
    return;
  }

  await deleteIndexedDatabase(LEGACY_DATABASE_NAME);
  await gameDatabase.delete().catch(() => {});
  window.localStorage.setItem(CUTOVER_FLAG_KEY, "1");
}

export async function initializeGameDatabase() {
  if (!initializePromise) {
    initializePromise = (async () => {
      await runHardCutoverReset();

      if (!gameDatabase.isOpen()) {
        await gameDatabase.open();
      }
    })().catch((error) => {
      initializePromise = null;
      throw error;
    });
  }

  return initializePromise;
}

export async function clearGameDatabase() {
  await initializeGameDatabase();

  await gameDatabase.transaction(
    "rw",
    gameDatabase.gameState,
    gameDatabase.syncQueue,
    async () => {
      await gameDatabase.gameState.clear();
      await gameDatabase.syncQueue.clear();
    },
  );
}
