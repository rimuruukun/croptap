export function coerceUpdatedAt(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (value && typeof value === "object") {
    // Firestore Timestamp (and some compatible shapes)
    if (typeof value.toMillis === "function") {
      const millis = value.toMillis();
      return Number.isFinite(millis) ? millis : fallback;
    }

    if (typeof value.seconds === "number") {
      const millis = Math.floor(value.seconds * 1000);
      return Number.isFinite(millis) ? millis : fallback;
    }
  }

  return fallback;
}

