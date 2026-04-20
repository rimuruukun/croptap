# Storage Layer

This folder contains browser persistence adapters for local game data.

## Responsibilities

- Persist and load the authoritative game snapshot in IndexedDB.
- Persist and load the local mutation queue used for future sync.
- Provide reset and queue utilities through a small storage API boundary.

## UID-Scoped Records

- Snapshot records use keys in the format snapshot::<firebaseUid>.
- Mutation queue records use keys in the format queue::<firebaseUid>.
- All storage APIs require ownerUid and only operate on that user's keys.
- Writes use IndexedDB put, so each uid updates its existing snapshot/queue entry in place.

## Legacy Global Records

- Legacy non-UID keys are intentionally ignored.
- No migration is performed from historical global records.

## Files

- indexedDbGameStore.js: IndexedDB-backed load/save/reset and queue operations.
