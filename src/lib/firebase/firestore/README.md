# src/lib/firebase/firestore

Student-friendly guide for this folder.

## What this folder is for

Firestore initialization helpers and runtime options.

## Files in this folder

- initFirestore.js: This is a JavaScript setup file in src/lib/firebase/firestore. Its main purpose is this: it prepares the online database connection when the app starts. It handles the startup steps that make database use safe and consistent for the rest of the app. Without this file, screens that save or load cloud data could fail because the database connection might not be ready.

## Student tips

- Start from this README, then open the files listed above in order.
- If you change responsibilities in this folder, update this README in the same commit.
- Prefer small, focused edits so behavior stays easy to reason about.
