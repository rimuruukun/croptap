export function bytesToBase64(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error("bytes must be a Uint8Array.");
  }

  let binary = "";
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return btoa(binary);
}

export function base64ToBytes(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("base64 value is required.");
  }

  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
