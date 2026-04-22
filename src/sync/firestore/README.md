# src/sync/firestore

Student-friendly guide for this folder.

## What this folder is for
Firestore listener and write-dispatch coordination modules.

## Files in this folder
- firestoreListener.js: This is a JavaScript file in src/sync/firestore. Its main purpose is this: User-scoped the online database watcher that compares and updates remote snapshots with local state. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- firestoreWriteDispatcher.js: This is a JavaScript file in src/sync/firestore. Its main purpose is this: small-delay remote write sender for main saved local game state. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
## Student tips
- Start from this README, then open the files listed above in order.
- If you change responsibilities in this folder, update this README in the same commit.
- Prefer small, focused edits so behavior stays easy to reason about.



