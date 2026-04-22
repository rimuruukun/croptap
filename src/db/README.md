# src/db

Student-friendly guide for this folder.

## What this folder is for
Dexie database layer for local canonical records, metadata, and compatibility queue helpers.

## Files in this folder
- gameDatabase.js: This is a JavaScript file in src/db. Its main purpose is this: local browser storage instance setup, data shape registration, and initialization utilities. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- gameStateTable.js: This is a JavaScript file in src/db. Its main purpose is this: create, read, update, and delete and extra record details patch helpers for main saved game state records. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- index.js: This is a JavaScript file in src/db. Its main purpose is this: shared exports for database modules. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- syncMetadata.js: This is a JavaScript file in src/db. Its main purpose is this: Shared save and online update status constants, data shape version, and owner record ID helpers. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- syncQueueTable.js: This is a JavaScript file in src/db. Its main purpose is this: Compatibility queue table helpers retained for migration-safe workflows. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
## Student tips
- Start from this README, then open the files listed above in order.
- If you change responsibilities in this folder, update this README in the same commit.
- Prefer small, focused edits so behavior stays easy to reason about.



