import {
  firebaseAuth,
  firebaseProjectId,
} from "../lib/firebase/authentication/config/firebaseAuth";

const secretCache = new Map();
const inFlightLoads = new Map();

function requireOwnerUid(ownerUid) {
  const normalizedOwnerUid =
    typeof ownerUid === "string" ? ownerUid.trim() : "";

  if (!normalizedOwnerUid) {
    throw new Error("ownerUid is required to load sync secret.");
  }

  return normalizedOwnerUid;
}

async function deriveDevelopmentSecret(ownerUid) {
  const material = `${ownerUid}:${firebaseProjectId || "croptap"}:dev-sync-secret`;
  const digestBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(material),
  );

  return new Uint8Array(digestBuffer);
}

export function getCachedUserSyncSecret(ownerUid) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  return secretCache.get(normalizedOwnerUid) ?? null;
}

export async function loadUserSyncSecret(ownerUid) {
  const normalizedOwnerUid = requireOwnerUid(ownerUid);

  if (secretCache.has(normalizedOwnerUid)) {
    return secretCache.get(normalizedOwnerUid);
  }

  if (inFlightLoads.has(normalizedOwnerUid)) {
    return inFlightLoads.get(normalizedOwnerUid);
  }

  const loadPromise = (async () => {
    const currentUser = firebaseAuth.currentUser;

    if (!currentUser || currentUser.uid !== normalizedOwnerUid) {
      throw new Error("Authenticated user does not match ownerUid.");
    }

    await currentUser.getIdToken();
    const secretBytes = await deriveDevelopmentSecret(normalizedOwnerUid);

    secretCache.set(normalizedOwnerUid, secretBytes);
    return secretBytes;
  })()
    .finally(() => {
      inFlightLoads.delete(normalizedOwnerUid);
    })
    .catch((error) => {
      throw error;
    });

  inFlightLoads.set(normalizedOwnerUid, loadPromise);
  return loadPromise;
}

export async function getUserSyncSecret(ownerUid) {
  const cachedSecret = getCachedUserSyncSecret(ownerUid);

  if (cachedSecret) {
    return cachedSecret;
  }

  return loadUserSyncSecret(ownerUid);
}

export function clearUserSyncSecret(ownerUid) {
  if (!ownerUid) {
    secretCache.clear();
    inFlightLoads.clear();
    return;
  }

  const normalizedOwnerUid = requireOwnerUid(ownerUid);
  secretCache.delete(normalizedOwnerUid);
  inFlightLoads.delete(normalizedOwnerUid);
}
