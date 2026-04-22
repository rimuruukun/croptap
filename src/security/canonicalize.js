function normalizeForSigning(value) {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeForSigning(entry));
  }

  const normalizedObject = {};
  const sortedKeys = Object.keys(value).sort();

  sortedKeys.forEach((key) => {
    if (key.startsWith("_")) {
      return;
    }

    normalizedObject[key] = normalizeForSigning(value[key]);
  });

  return normalizedObject;
}

export function canonicalizeForSigning(value) {
  return JSON.stringify(normalizeForSigning(value));
}
