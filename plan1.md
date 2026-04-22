## Plan: Firestore Persistent Offline Re-Architecture

Re-architect sync so Firestore handles offline network buffering through persistent cache, while Dexie remains the canonical encrypted local store. Replace interval-based outbox processing with Firestore-driven write/listen flows, preserve existing local progress, and keep current LWW conflict behavior using updatedAt.

**Steps**

1. Phase 1 - Firestore foundation (blocking): Introduce a dedicated Firestore initialization layer that uses persistent single-tab cache, reports persistence capability status, and falls back safely when persistence is unavailable.
2. Phase 1 - Firestore wiring (depends on 1): Refactor Firebase config exports so all modules use the new initialized Firestore instance instead of direct getFirestore creation.
3. Phase 1 - Runtime status contract (depends on 1): Define shared sync status shape for UI/runtime (persistence enabled, cache source, pending writes, last remote apply, last error).
4. Phase 2 - Write path redesign (depends on 1-3): Keep writeLocalGameState as canonical Dexie write + signing/encryption, but replace queue enqueue with direct Firestore write dispatch that works online/offline via SDK persistence.
5. Phase 2 - Remote write coordinator (depends on 4): Add per-owner in-memory write coordinator to coalesce rapid updates and avoid write storms while preserving latest snapshot semantics.
6. Phase 2 - Delete/tombstone parity (depends on 4): Route deleteLocalGameState through the same Firestore-backed dispatcher with consistent tombstone behavior.
7. Phase 3 - Listener/reconciliation redesign (depends on 1-6): Rebuild Firestore listener to use metadata-aware snapshots, ignore local echo updates, and apply LWW reconciliation against Dexie \_updatedAt.
8. Phase 3 - Sync runtime simplification (depends on 7): Remove interval polling/processSyncQueue orchestration and replace with listener lifecycle + online retry hooks + lightweight sync state updates.
9. Phase 3 - UI status migration (depends on 8): Replace queue-count based sync indicators with status derived from Firestore pending writes and runtime sync state.
10. Phase 4 - Data-preserving migration (depends on 4-9): Add one-time migration that reads existing pending syncQueue entries and emits equivalent Firestore writes from latest local canonical state, then marks queue rows migrated.
11. Phase 4 - Compatibility window (depends on 10): Keep syncQueue schema/table for one release cycle but stop writing new queue entries to allow safe rollback and observability.
12. Phase 5 - Rule/documentation alignment (depends on 7-11): Update Firestore rules for monotonic updatedAt behavior (while preserving owner constraints) and refresh storage/sync documentation to reflect new architecture.
13. Phase 5 - Legacy cleanup (depends on 12): Decommission obsolete queue-processing code paths after migration verification passes.

**Relevant files**

- c:/Users/rizam/Desktop/ProgramProjects/CropTap/croptap/src/lib/firebase/authentication/config/firebaseAuth.js - Replace direct Firestore creation with initialized persistent cache variant.
- c:/Users/rizam/Desktop/ProgramProjects/CropTap/croptap/src/lib/firebase/authentication/services/emailPasswordAuthService.js - Ensure auth lifecycle triggers new sync runtime initialization semantics.
- c:/Users/rizam/Desktop/ProgramProjects/CropTap/croptap/src/sync/useSyncRuntime.js - Replace polling sync loop with listener-driven runtime.
- c:/Users/rizam/Desktop/ProgramProjects/CropTap/croptap/src/sync/firestoreListener.js - Implement metadata-aware reconciliation and local-echo handling.
- c:/Users/rizam/Desktop/ProgramProjects/CropTap/croptap/src/sync/writeGateway.js - Keep Dexie canonical writes, switch remote dispatch strategy.
- c:/Users/rizam/Desktop/ProgramProjects/CropTap/croptap/src/sync/syncEngine.js - Decommission or reduce to compatibility fallback during migration.
- c:/Users/rizam/Desktop/ProgramProjects/CropTap/croptap/src/db/syncQueueTable.js - Read-only migration source; stop new enqueues after cutover.
- c:/Users/rizam/Desktop/ProgramProjects/CropTap/croptap/src/db/gameStateTable.js - Continue canonical local state ownership and sync metadata updates.
- c:/Users/rizam/Desktop/ProgramProjects/CropTap/croptap/src/state/useOfflineGamePersistence.js - Keep hydration/autosave contract while integrating new sync status outputs.
- c:/Users/rizam/Desktop/ProgramProjects/CropTap/croptap/src/App.jsx - Update pending/sync status wiring and remove queue-count assumptions.
- c:/Users/rizam/Desktop/ProgramProjects/CropTap/croptap/src/sync/constants.js - Update constants for new runtime/sync cadence semantics.
- c:/Users/rizam/Desktop/ProgramProjects/CropTap/croptap/firestore.rules - Align rules with monotonic updatedAt and preserved owner checks.
- c:/Users/rizam/Desktop/ProgramProjects/CropTap/croptap/src/sync/README.md - Update architecture documentation.
- c:/Users/rizam/Desktop/ProgramProjects/CropTap/croptap/src/lib/storage/CANONICAL_DATA_TABLE.md - Update canonical mapping and responsibility split.

**Verification**

1. Build validation: run npm.cmd run build and confirm no compile errors.
2. Offline write buffering: start online, make mutations, go offline, make more mutations, reload app, confirm local progress remains and pending writes flush after reconnect.
3. Cold-start offline hydration: hard reload while offline and confirm hydration uses preserved Dexie data without queue-based sync engine.
4. Conflict behavior: simulate two clients with divergent edits and verify LWW by updatedAt is enforced and conflict markers surface as designed.
5. Auth transitions: sign in, sign out, and sign in again with same user; verify listener lifecycle and sync status resets correctly.
6. Migration safety: upgrade from pre-cutover local DB containing pending syncQueue rows and confirm rows are migrated with no progress loss.
7. Persistence fallback: test unsupported/blocked IndexedDB scenario and verify fallback mode is explicit and non-destructive.

**Decisions**

- Selected: full re-architecture now.
- Selected: Dexie remains canonical local source of truth.
- Selected: single-tab Firestore persistent cache.
- Selected: retain current LWW updatedAt conflict behavior.
- Selected: preserve all existing local progress (no destructive reset).
- Included scope: Firestore initialization redesign, sync runtime redesign, queue migration, rules/docs alignment.
- Excluded scope: multi-tab cache support, Cloud Functions-based conflict arbitration, manual conflict-resolution UI.

**Further Considerations**

1. Persistence failure handling recommendation: continue app in fallback mode with clear sync warning rather than blocking gameplay.
2. Rollout recommendation: guard cutover with a feature flag so legacy queue sync can be re-enabled quickly if migration regressions appear.
3. Observability recommendation: record key sync lifecycle events in lightweight logs to diagnose edge-case offline failures during rollout.
