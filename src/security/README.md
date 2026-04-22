# src/security

Student-friendly guide for this folder.

## What this folder is for
Client-side cryptographic and canonicalization helpers for payload protection.

## Files in this folder
- base64.js: This is a JavaScript file in src/security. Its main purpose is this: Base64 encode/decode helpers used by security utilities. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- canonicalize.js: This is a JavaScript file in src/security. Its main purpose is this: Deterministic saved data main savedization for stable signing input. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- encryption.js: This is a JavaScript file in src/security. Its main purpose is this: Encryption/decryption helpers for protected user fields. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- index.js: This is a JavaScript file in src/security. Its main purpose is this: shared exports for security modules. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- secretManager.js: This is a JavaScript file in src/security. Its main purpose is this: Per-user secret loading and lifecycle management. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- signing.js: This is a JavaScript file in src/security. Its main purpose is this: saved data signing and signature verification helpers. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
## Student tips
- Start from this README, then open the files listed above in order.
- If you change responsibilities in this folder, update this README in the same commit.
- Prefer small, focused edits so behavior stays easy to reason about.



