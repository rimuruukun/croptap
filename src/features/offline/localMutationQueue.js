import {
  appendMutation,
  clearMutationQueue,
  loadMutationQueue,
} from "../../lib/storage/indexedDbGameStore";
import { createLocalMutationEnvelope } from "../../lib/sync/mutationEnvelope";

export async function queueLocalMutation(
  ownerUid,
  type,
  payload = {},
  metadata = {},
) {
  const mutation = createLocalMutationEnvelope(type, payload, metadata);
  const queue = await appendMutation(ownerUid, mutation);

  return {
    mutation,
    queueLength: queue.length,
  };
}

export async function getLocalMutationQueue(ownerUid) {
  return loadMutationQueue(ownerUid);
}

export async function getLocalMutationQueueCount(ownerUid) {
  const queue = await loadMutationQueue(ownerUid);
  return queue.length;
}

export async function resetLocalMutationQueue(ownerUid) {
  await clearMutationQueue(ownerUid);
  return 0;
}
