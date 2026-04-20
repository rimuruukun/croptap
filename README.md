# Web App (Vite + React)

This folder contains the CropTap.io PWA client.

## Planned Responsibilities
- Gameplay runtime and responsive UI (mobile-first)
- Deterministic local simulation and persistence
- Offline queueing and background synchronization
- Firebase Auth integration
- Firestore sync and leaderboard data integration
- FCM token handling and notification preferences
- PWA manifest and service worker setup

## Core Gameplay Systems
- Crops are primary tap targets.
- Tools define manual click damage growth.
- Farmers provide taps-per-second automation.
- Every 10 stages includes a timed Infested Crop boss gate.
- Rebirth grants Fertilizers for permanent account progression.
- Event bosses and competitions attach to leaderboard loops.

## Key Source Areas
- src/features: game and platform feature modules
- src/components: game-specific and shared UI components
- src/lib: platform adapters (firebase, pwa, storage, sync)
- src/state: global app store and selectors
- src/workers: web worker logic (if needed for timers/sync)

## Layout Guidance
- Follow classic idle clicker spatial structure from provided wireframe.
- Smartphone view prioritizes crop arena and compact upgrade list.
- Tablet/desktop views expand side panels while preserving interaction order.
- Touch targets and text hierarchy must stay clear under high action density.

## Art Assets
- public/assets/crops: crop/enemy sprites and animations.
- public/assets/weapons: tool icons and effect sheets.
- public/assets/farmers: farmer portraits, sprites, and upgrades.
- public/assets/effects: hit effects, particles, and feedback visuals.
- public/assets/ui: HUD panels, buttons, and decorative frame assets.
