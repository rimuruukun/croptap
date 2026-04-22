# Security Layer (Web Crypto)

This folder contains client-side integrity and confidentiality helpers used by local storage and sync.

## Files

- base64.js: Browser-safe base64 encode/decode utilities for bytes.
- canonicalize.js: Deterministic payload canonicalization for signing.
- signing.js: HMAC signing and verification for canonical payloads.
- encryption.js: AES-GCM encryption/decryption helpers for sensitive fields.
- secretManager.js: In-memory per-user secret loading and cache lifecycle.
- index.js: Barrel exports for security modules.
