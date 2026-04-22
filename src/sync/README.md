# Sync Layer

This folder contains local write gateway, queue processor, and Firestore listener wiring.

## Files

- constants.js: Sync operation constants, retry policy, and Firestore path constants.
- writeGateway.js: `writeLocal`/`deleteLocal` behavior for game state with signing, encryption, and queue enqueueing.
- syncEngine.js: Queue processing, Firestore upsert/delete operations, retries, and conflict handling.
- firestoreListener.js: User-scoped Firestore pull listener and local apply logic.
- useSyncRuntime.js: React runtime hook for secret load, listener startup, online triggers, and periodic sync.
- index.js: Barrel exports for sync modules.
