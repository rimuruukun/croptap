import { base64ToBytes, bytesToBase64 } from "./base64";

const AES_GCM_IV_LENGTH = 12;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const aesKeyCache = new Map();

function getSecretCacheKey(secretBytes) {
  return bytesToBase64(secretBytes);
}

async function getAesKey(secretBytes) {
  const cacheKey = getSecretCacheKey(secretBytes);

  if (!aesKeyCache.has(cacheKey)) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);

    aesKeyCache.set(
      cacheKey,
      crypto.subtle.importKey(
        "raw",
        hashBuffer,
        {
          name: "AES-GCM",
        },
        false,
        ["encrypt", "decrypt"],
      ),
    );
  }

  return aesKeyCache.get(cacheKey);
}

export function isEncryptedString(value) {
  return (
    typeof value === "string" &&
    value.includes(".") &&
    value.split(".").length === 2
  );
}

export async function encryptString(value, secretBytes) {
  const normalizedValue = typeof value === "string" ? value : "";

  if (!normalizedValue) {
    return "";
  }

  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LENGTH));
  const key = await getAesKey(secretBytes);
  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    textEncoder.encode(normalizedValue),
  );

  return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(cipherBuffer))}`;
}

export async function decryptString(value, secretBytes) {
  const normalizedValue = typeof value === "string" ? value : "";

  if (!normalizedValue) {
    return "";
  }

  if (!isEncryptedString(normalizedValue)) {
    return normalizedValue;
  }

  const [ivBase64, cipherBase64] = normalizedValue.split(".");
  const iv = base64ToBytes(ivBase64);
  const cipherBytes = base64ToBytes(cipherBase64);
  const key = await getAesKey(secretBytes);

  const plainBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    cipherBytes,
  );

  return textDecoder.decode(plainBuffer);
}
