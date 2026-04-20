# Offline Feature Layer

This folder contains user-facing offline behavior helpers.

## Responsibilities

- Track network state for online/offline UI signals.
- Handle PWA install prompt lifecycle and installability status.
- Queue local mutations in append-only order for later reconciliation.

## Files

- localMutationQueue.js: Queue operations built on top of storage APIs.
- useNetworkStatus.js: React hook for browser online/offline changes.
- usePwaInstallPrompt.js: React hook for install prompt and installed state.
