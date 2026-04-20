# State Layer

This folder contains shared state modeling and persistence orchestration.

## Responsibilities

- Define the durable game snapshot model and normalization rules.
- Convert runtime state to and from persisted snapshot form.
- Hydrate app state from storage and autosave with dirty tracking.

## Files

- offlineGameState.js: Data model defaults, sanitization, and mapping helpers.
- useOfflineGamePersistence.js: Hydration and debounced autosave hook.
