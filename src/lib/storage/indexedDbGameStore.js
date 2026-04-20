import { openDB } from "idb";

const DB_NAME = "croptap-offline-db";
const DB_VERSION = 1;
const STORE_NAME = "croptap-offline";

const SNAPSHOT_KEY_PREFIX = "snapshot::";
const MUTATION_QUEUE_KEY_PREFIX = "queue::";

let dbPromise;

function getDatabase() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME);
        }
      },
    });
  }

  return dbPromise;
}

async function readValue(key, fallbackValue) {
  const database = await getDatabase();
  const value = await database.get(STORE_NAME, key);
  return value ?? fallbackValue;
}

async function writeValue(key, value) {
  const database = await getDatabase();
  await database.put(STORE_NAME, value, key);
  return value;
}

function requireOwnerUid(ownerUid) {
  const normalizedOwnerUid =
    typeof ownerUid === "string" ? ownerUid.trim() : "";

  if (!normalizedOwnerUid) {
    throw new Error("ownerUid is required for offline storage operations.");
  }

  return normalizedOwnerUid;
}

function getSnapshotKey(ownerUid) {
  return `${SNAPSHOT_KEY_PREFIX}${requireOwnerUid(ownerUid)}`;
}

function getMutationQueueKey(ownerUid) {
  return `${MUTATION_QUEUE_KEY_PREFIX}${requireOwnerUid(ownerUid)}`;
}

export async function loadGameSnapshot(ownerUid) {
  return readValue(getSnapshotKey(ownerUid), null);
}

export async function saveGameSnapshot(ownerUid, snapshot) {
  return writeValue(getSnapshotKey(ownerUid), snapshot);
}

export async function resetGameSnapshot(ownerUid) {
  const database = await getDatabase();
  await database.delete(STORE_NAME, getSnapshotKey(ownerUid));
}

export async function loadMutationQueue(ownerUid) {
  return readValue(getMutationQueueKey(ownerUid), []);
}

export async function replaceMutationQueue(ownerUid, queue) {
  const safeQueue = Array.isArray(queue) ? queue : [];
  return writeValue(getMutationQueueKey(ownerUid), safeQueue);
}

export async function appendMutation(ownerUid, mutation) {
  const queue = await loadMutationQueue(ownerUid);
  const nextQueue = [...queue, mutation];
  await replaceMutationQueue(ownerUid, nextQueue);
  return nextQueue;
}

export async function clearMutationQueue(ownerUid) {
  const database = await getDatabase();
  await database.delete(STORE_NAME, getMutationQueueKey(ownerUid));
}

export async function resetOfflineStorage(ownerUid) {
  await Promise.all([
    resetGameSnapshot(ownerUid),
    clearMutationQueue(ownerUid),
  ]);
}
