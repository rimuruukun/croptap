# src/sync

## What this folder is for

Synchronization subsystem that coordinates local canonical state with Firestore.

## Subfolders and what they do

- firestore/: Firestore listener and write-dispatch coordination modules.
- gateway/: Gateway for local canonical reads/writes, signing, and remote apply behavior.
- runtime/: Runtime hook that boots sync lifecycle based on auth and hydration state.
- status/: Sync status model helpers used by UI and runtime.
- utils/: Small sync utility helpers.

## Files in this folder

- constants.js: This is a JavaScript file in src/sync. Its main purpose is this: save and online update constants and the online database path constants used across save and online update modules. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- index.js: This is a JavaScript file in src/sync. Its main purpose is this: shared exports for save and online update modules. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
## Student tips

- Start from this README, then open the files listed above in order.
- If you change responsibilities in this folder, update this README in the same commit.
- Prefer small, focused edits so behavior stays easy to reason about.


