# Database Layer (Dexie)

This folder contains local IndexedDB persistence for canonical game records and sync queue state.

## Files

- gameDatabase.js: Dexie database instance, schema definition, hard cutover reset, and initialization helpers.
- syncMetadata.js: Shared sync status constants, schema version, and owner/record id helpers.
- gameStateTable.js: CRUD and metadata patch helpers for canonical `gameState` records.
- syncQueueTable.js: Ordered queue operations, retry metadata, and pending queue scans.
- index.js: Barrel exports for db modules.
