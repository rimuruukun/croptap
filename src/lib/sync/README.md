# Sync Envelope Layer

This folder contains sync-ready mutation envelope primitives.

## Responsibilities

- Define the local mutation envelope shape and versioning.
- Generate stable mutation identifiers for queued local changes.
- Keep mutation structure decoupled from transport details.

## Files

- mutationEnvelope.js: Factory for append-only local mutation entries.
