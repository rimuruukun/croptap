# src/sync/gateway

Student-friendly guide for this folder.

## What this folder is for
Gateway for local canonical reads/writes, signing, and remote apply behavior.

## Files in this folder
- writeGateway.js: This is a JavaScript file in src/sync/gateway. Its main purpose is this: Primary local persistence entry point and remote-apply boundary with signing/encryption. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
## Student tips
- Start from this README, then open the files listed above in order.
- If you change responsibilities in this folder, update this README in the same commit.
- Prefer small, focused edits so behavior stays easy to reason about.



