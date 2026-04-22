# src/state

Student-friendly guide for this folder.

## What this folder is for
Runtime game snapshot modeling and local persistence hooks.

## Files in this folder
- offlineGameState.js: This is a JavaScript file in src/state. Its main purpose is this: Default snapshot creation, normalization, and the app while it is running/snapshot conversion helpers. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- useOfflineGamePersistence.js: This is a JavaScript file in src/state. Its main purpose is this: startup data loading and autosave hook for local main saved persistence. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
## Student tips
- Start from this README, then open the files listed above in order.
- If you change responsibilities in this folder, update this README in the same commit.
- Prefer small, focused edits so behavior stays easy to reason about.



