# Canonical User Game Data Table (v1)

This document is the source-of-truth mapping for CropTap local IndexedDB and remote Firestore storage.

## Scope

- One canonical per-user business document: `gameState`.
- Supporting profile fields live in `users/{uid}`.
- Local-only queue table: `syncQueue`.

## Required Local Sync Metadata (All Business Records)

Every business record persisted in local IndexedDB must include:

- `_syncStatus`: `pending` | `synced` | `conflict` | `deleted`
- `_updatedAt`: local unix epoch milliseconds
- `_serverUpdatedAt`: latest known server unix epoch milliseconds (nullable)
- `_sig`: HMAC signature over canonical non-internal fields
- `_version`: schema version number

## Canonical Entities

| Entity                   | Purpose                                                                                            | Local (Dexie)                                               | Firestore                             | Owner (`uid`)       | Conflict Rule                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------- | ------------------- | ------------------------------------------------------------------------------------ |
| `gameState`              | Authoritative per-user gameplay snapshot (currencies, progression, inventory, settings, sync/meta) | table: `gameState`, key: `id=uid::gameState`                | doc: `users/{uid}/gameData/gameState` | required, immutable | LWW by `_updatedAt` vs server `updatedAt`; local force-push only when local is newer |
| `userProfile`            | Display-only profile metadata used by client and rules checks                                      | denormalized in `gameState.player` and optional local cache | doc: `users/{uid}`                    | required, immutable | server-wins for profile fields; local cache updated by listener                      |
| `syncQueue` (local-only) | Ordered outbox of pending writes/deletes                                                           | table: `syncQueue`, key: auto increment `queueId`           | none                                  | required per row    | retry in created-at order; mark `conflict` after max retries                         |

## Canonical GameState Shape

| Field Path                 | Type          | PII | Local Protection                         | Firestore Protection            | Notes                          |
| -------------------------- | ------------- | --- | ---------------------------------------- | ------------------------------- | ------------------------------ |
| `ownerUid`                 | string        | no  | signed                                   | rules + signed                  | Must match authenticated uid   |
| `version`                  | number        | no  | signed                                   | signed                          | Document schema version        |
| `player.name`              | string        | yes | encrypted + signed                       | encrypted + signed              | Decrypted for runtime only     |
| `player.email`             | string        | yes | encrypted + signed                       | encrypted + signed              | Decrypted for runtime only     |
| `player.mode`              | string        | no  | signed                                   | signed                          | `credentials` or `offline`     |
| `currencies.coins`         | number        | no  | signed                                   | signed                          | Non-negative integer           |
| `currencies.fertilizer`    | number        | no  | signed                                   | signed                          | Non-negative integer           |
| `progression.currentStage` | number        | no  | signed                                   | signed                          | Minimum 1                      |
| `progression.bossHP`       | number        | no  | signed                                   | signed                          | Clamped to maxHP               |
| `progression.maxHP`        | number        | no  | signed                                   | signed                          | Minimum 1                      |
| `inventory.tapUpgrades[]`  | array         | no  | signed                                   | signed                          | Deterministic order by id      |
| `inventory.farmers[]`      | array         | no  | signed                                   | signed                          | Deterministic order by id      |
| `settings.buyQuantity`     | number/string | no  | signed                                   | signed                          | 1/10/100/max                   |
| `settings.activeItem`      | string        | no  | signed                                   | signed                          | Section id                     |
| `settings.managementTab`   | string        | no  | signed                                   | signed                          | tools/farmers                  |
| `sync.localRevision`       | number        | no  | signed                                   | signed                          | Client revision counter        |
| `sync.lastMutationAt`      | number\|null  | no  | signed                                   | signed                          | Last local mutation timestamp  |
| `sync.lastSyncedAt`        | number\|null  | no  | signed                                   | signed                          | Last successful sync timestamp |
| `meta.savedAt`             | number\|null  | no  | signed                                   | signed                          | Last local save timestamp      |
| `_syncStatus`              | string        | no  | internal-only (not signed payload field) | derived                         | local metadata                 |
| `_updatedAt`               | number        | no  | internal-only                            | mirrored to `updatedAt`         | local write timestamp          |
| `_serverUpdatedAt`         | number\|null  | no  | internal-only                            | from server snapshot            | sync metadata                  |
| `_sig`                     | string        | no  | internal-only                            | optional mirror `sig`           | integrity proof                |
| `_version`                 | number        | no  | internal-only                            | optional mirror `schemaVersion` | local schema marker            |

## Path Mapping Matrix

| Local Table/Path                       | Firestore Document/Path          | Ownership          | Sync Direction | Conflict Rule            |
| -------------------------------------- | -------------------------------- | ------------------ | -------------- | ------------------------ |
| `gameState[id=uid::gameState].payload` | `users/{uid}/gameData/gameState` | `ownerUid === uid` | bi-directional | LWW by timestamps        |
| `gameState[id=uid::gameState].player`  | `users/{uid}` subset mirror      | `ownerUid === uid` | pull-preferred | server-wins              |
| `syncQueue[queueId].operation`         | none (transport only)            | `ownerUid === uid` | push-only      | ordered retries with cap |

## Notes

- Client-side signing/tamper checks are best effort; server-side rules and function validation are authoritative.
- `syncQueue` is never mirrored to Firestore.
- Canonical table version must be bumped for schema/rules changes.
