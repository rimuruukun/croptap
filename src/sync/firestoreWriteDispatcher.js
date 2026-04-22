import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { firebaseAuth, firebaseDb } from "../lib/firebase/authentication/config/firebaseAuth";
import {
  FIRESTORE_GAME_DATA_COLLECTION,
  FIRESTORE_GAME_STATE_DOC_ID,
  FIRESTORE_USERS_COLLECTION,
} from "./constants";
import { getRawLocalGameStateRecord } from "./writeGateway";

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

const ownerCoordinator = new Map();

function getCoordinatorState(ownerUid) {
  if (!ownerCoordinator.has(ownerUid)) {
    ownerCoordinator.set(ownerUid, {
      timerId: 0,
      isFlushing: false,
      pendingReason: "local_write",
      lastScheduledAt: 0,
    });
  }

  return ownerCoordinator.get(ownerUid);
}

async function flushOwner(ownerUid) {
  const state = getCoordinatorState(ownerUid);

  if (state.isFlushing) {
    return;
  }

  state.isFlushing = true;

  try {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser || currentUser.uid !== ownerUid) {
      return;
    }

    const localRecord = await getRawLocalGameStateRecord(ownerUid);
    if (!localRecord) {
      return;
    }

    const updatedAt = Number(localRecord._updatedAt ?? Date.now());

    await setDoc(
      getGameStateDocRef(ownerUid),
      {
        ownerUid,
        payload: localRecord.payload ?? {},
        sig: localRecord._sig || "",
        schemaVersion: localRecord._version ?? 1,
        updatedAt,
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
        updatedAt,
        updatedBy: ownerUid,
        serverWrittenAt: serverTimestamp(),
      },
      { merge: true },
    );
  } finally {
    state.isFlushing = false;
  }
}

export function scheduleFirestoreGameStateFlush(ownerUid, reason = "local_write") {
  const state = getCoordinatorState(ownerUid);
  state.pendingReason = reason || state.pendingReason;
  state.lastScheduledAt = Date.now();

  if (state.timerId) {
    window.clearTimeout(state.timerId);
  }

  state.timerId = window.setTimeout(() => {
    state.timerId = 0;
    void flushOwner(ownerUid);
  }, 250);
}

export function disposeFirestoreWriteCoordinator(ownerUid) {
  const state = ownerCoordinator.get(ownerUid);
  if (!state) {
    return;
  }

  if (state.timerId) {
    window.clearTimeout(state.timerId);
  }

  ownerCoordinator.delete(ownerUid);
}

