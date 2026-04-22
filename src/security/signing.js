import { base64ToBytes, bytesToBase64 } from "./base64";
import { canonicalizeForSigning } from "./canonicalize";

const textEncoder = new TextEncoder();
const hmacKeyCache = new Map();

function getSecretCacheKey(secretBytes) {
  return bytesToBase64(secretBytes);
}

async function getHmacKey(secretBytes) {
  const cacheKey = getSecretCacheKey(secretBytes);

  if (!hmacKeyCache.has(cacheKey)) {
    hmacKeyCache.set(
      cacheKey,
      crypto.subtle.importKey(
        "raw",
        secretBytes,
        {
          name: "HMAC",
          hash: "SHA-256",
        },
        false,
        ["sign", "verify"],
      ),
    );
  }

  return hmacKeyCache.get(cacheKey);
}

export async function signPayload(payload, secretBytes) {
  if (!(secretBytes instanceof Uint8Array)) {
    throw new Error("secretBytes must be a Uint8Array.");
  }

  const canonicalPayload = canonicalizeForSigning(payload);
  const encodedPayload = textEncoder.encode(canonicalPayload);
  const hmacKey = await getHmacKey(secretBytes);
  const signature = await crypto.subtle.sign("HMAC", hmacKey, encodedPayload);

  return bytesToBase64(new Uint8Array(signature));
}

export async function verifyPayloadSignature(payload, signature, secretBytes) {
  if (!signature || typeof signature !== "string") {
    return false;
  }

  if (!(secretBytes instanceof Uint8Array)) {
    return false;
  }

  try {
    const canonicalPayload = canonicalizeForSigning(payload);
    const encodedPayload = textEncoder.encode(canonicalPayload);
    const hmacKey = await getHmacKey(secretBytes);
    const signatureBytes = base64ToBytes(signature);

    return crypto.subtle.verify(
      "HMAC",
      hmacKey,
      signatureBytes,
      encodedPayload,
    );
  } catch {
    return false;
  }
}
