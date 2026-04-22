# src/features/offline

Student-friendly guide for this folder.

## What this folder is for
Hooks for network awareness and PWA installation prompts.

## Files in this folder
- useNetworkStatus.js: This is a JavaScript file in src/features/offline. Its main purpose is this: Hook that exposes online/offline network status. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- usePwaInstallPrompt.js: This is a JavaScript file in src/features/offline. Its main purpose is this: Hook that tracks and triggers browser PWA install prompt behavior. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
## Student tips
- Start from this README, then open the files listed above in order.
- If you change responsibilities in this folder, update this README in the same commit.
- Prefer small, focused edits so behavior stays easy to reason about.



