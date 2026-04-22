# src

Student-friendly guide for this folder.

## What this folder is for
Application source root for gameplay UI, persistence, sync, security, and platform integrations.

## Subfolders and what they do
- db/: Dexie database layer for local canonical records, metadata, and compatibility queue helpers.
- features/: Feature-oriented domain modules for gameplay, crop data, and offline UX behavior.
- lib/: Infrastructure adapters for Firebase, PWA registration, and storage design documentation.
- routes/: Route guards and route mapping helpers for public/protected navigation.
- security/: Client-side cryptographic and canonicalization helpers for payload protection.
- state/: Runtime game snapshot modeling and local persistence hooks.
- styles/: Global and page-scoped style sheets for the web client.
- sync/: Synchronization subsystem that coordinates local canonical state with Firestore.
- ui/: Presentation-focused UI components grouped by app surface area.

## Files in this folder
- App.jsx: This is a React component file in src. Its main purpose is this: Main app the app while it is running and route composition; wires auth, gameplay state, persistence, and save and online update. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
- main.jsx: This is a React component file in src. Its main purpose is this: Application bootstrap entry; mounts React app and top-level providers. It handles the day-to-day tasks for this area, so nearby files can rely on one clear place for this work. Without this file, this part of the app would miss an important step and features here could break or behave in confusing ways.
## Student tips
- Start from this README, then open the files listed above in order.
- If you change responsibilities in this folder, update this README in the same commit.
- Prefer small, focused edits so behavior stays easy to reason about.



