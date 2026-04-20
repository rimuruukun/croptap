export const LOCAL_MUTATION_VERSION = 1;

function generateMutationId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `mutation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createLocalMutationEnvelope(type, payload = {}, metadata = {}) {
  return {
    id: generateMutationId(),
    version: LOCAL_MUTATION_VERSION,
    type,
    payload,
    metadata,
    status: "pending",
    createdAt: Date.now(),
  };
}
