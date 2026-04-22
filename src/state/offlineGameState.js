import {
  initialFarmers,
  initialTapUpgrades,
} from "../features/game/config/constants";
import { getCropHP } from "../features/crops/cropsData";

export const GAME_SAVE_VERSION = 1;
export const DEFAULT_FERTILIZER = 4200000;

const VALID_ACTIVE_ITEMS = new Set([
  "battle",
  "tools",
  "events",
  "farmers",
  "leaderboards",
  "settings",
]);
const VALID_MANAGEMENT_TABS = new Set(["tools", "farmers"]);
const VALID_BUY_QUANTITIES = new Set([1, 10, 100, "max"]);

const isFiniteNumber = (value) => Number.isFinite(value);
const sanitizeNumber = (value, fallback = 0) =>
  isFiniteNumber(value) ? value : fallback;
const sanitizeTimestamp = (value) => (isFiniteNumber(value) ? value : null);
const sanitizeStage = (value) =>
  Math.max(1, Math.floor(sanitizeNumber(value, 1)));
const sanitizeActiveItem = (value) =>
  VALID_ACTIVE_ITEMS.has(value) ? value : "battle";
const sanitizeManagementTab = (value) =>
  VALID_MANAGEMENT_TABS.has(value) ? value : "tools";
const sanitizeBuyQuantity = (value) =>
  VALID_BUY_QUANTITIES.has(value) ? value : 1;
const sanitizeBoolean = (value, fallback = false) =>
  typeof value === "boolean" ? value : fallback;
const sanitizeVolume = (value, fallback = 0.5) => {
  const numericValue = sanitizeNumber(value, fallback);

  return Math.max(0, Math.min(1, numericValue));
};
const readSettingWithLegacyFallback = (snapshot, key) =>
  snapshot?.settings?.[key] ?? snapshot?.[key];

function mergeTapUpgrades(savedUpgrades) {
  const savedById = new Map(
    Array.isArray(savedUpgrades)
      ? savedUpgrades
          .filter((entry) => entry && typeof entry.id === "string")
          .map((entry) => [entry.id, entry])
      : [],
  );

  return initialTapUpgrades.map((upgrade) => {
    const saved = savedById.get(upgrade.id);

    return {
      ...upgrade,
      level: Math.max(0, Math.floor(sanitizeNumber(saved?.level, 0))),
      price: Math.max(
        1,
        Math.floor(sanitizeNumber(saved?.price, upgrade.price)),
      ),
    };
  });
}

function mergeFarmers(savedFarmers) {
  const savedById = new Map(
    Array.isArray(savedFarmers)
      ? savedFarmers
          .filter((entry) => entry && typeof entry.id === "string")
          .map((entry) => [entry.id, entry])
      : [],
  );

  return initialFarmers.map((farmer) => {
    const saved = savedById.get(farmer.id);

    return {
      ...farmer,
      owned: Math.max(0, Math.floor(sanitizeNumber(saved?.owned, 0))),
      price: Math.max(
        1,
        Math.floor(sanitizeNumber(saved?.price, farmer.price)),
      ),
    };
  });
}

function compactTapUpgrades(upgrades) {
  if (!Array.isArray(upgrades)) {
    return [];
  }

  return upgrades
    .filter((entry) => entry && typeof entry.id === "string")
    .map((entry) => ({
      id: entry.id,
      level: Math.max(0, Math.floor(sanitizeNumber(entry.level, 0))),
      price: Math.max(1, Math.floor(sanitizeNumber(entry.price, 1))),
    }));
}

function compactFarmers(farmers) {
  if (!Array.isArray(farmers)) {
    return [];
  }

  return farmers
    .filter((entry) => entry && typeof entry.id === "string")
    .map((entry) => ({
      id: entry.id,
      owned: Math.max(0, Math.floor(sanitizeNumber(entry.owned, 0))),
      price: Math.max(1, Math.floor(sanitizeNumber(entry.price, 1))),
    }));
}

export function createDefaultSnapshot() {
  const currentStage = 1;
  const maxHP = getCropHP(currentStage);

  return {
    version: GAME_SAVE_VERSION,
    player: {
      isLoggedIn: false,
      name: "",
      email: "",
      mode: "credentials",
    },
    currencies: {
      coins: 500,
      fertilizer: DEFAULT_FERTILIZER,
    },
    progression: {
      currentStage,
      bossHP: maxHP,
      maxHP,
    },
    inventory: {
      tapUpgrades: mergeTapUpgrades([]),
      farmers: mergeFarmers([]),
    },
    settings: {
      buyQuantity: 1,
      activeItem: "battle",
      managementTab: "tools",
      isSoundMasterMuted: false,
      isBgmEnabled: true,
      isSfxEnabled: true,
      bgmVolume: 0.42,
      sfxVolume: 0.5,
    },
    sync: {
      localRevision: 0,
      lastMutationAt: null,
      lastSyncedAt: null,
    },
    meta: {
      savedAt: null,
    },
  };
}

export function normalizeSnapshot(snapshot) {
  const base = createDefaultSnapshot();

  if (!snapshot || typeof snapshot !== "object") {
    return base;
  }

  const currentStage = sanitizeStage(snapshot.progression?.currentStage);
  const fallbackMaxHP = getCropHP(currentStage);
  const maxHP = Math.max(
    1,
    Math.floor(sanitizeNumber(snapshot.progression?.maxHP, fallbackMaxHP)),
  );
  const bossHP = Math.max(
    0,
    Math.min(
      maxHP,
      Math.floor(sanitizeNumber(snapshot.progression?.bossHP, maxHP)),
    ),
  );

  return {
    version: GAME_SAVE_VERSION,
    player: {
      isLoggedIn: Boolean(snapshot.player?.isLoggedIn),
      name:
        typeof snapshot.player?.name === "string" ? snapshot.player.name : "",
      email:
        typeof snapshot.player?.email === "string" ? snapshot.player.email : "",
      mode: snapshot.player?.mode === "offline" ? "offline" : "credentials",
    },
    currencies: {
      coins: Math.max(
        0,
        Math.floor(
          sanitizeNumber(snapshot.currencies?.coins, base.currencies.coins),
        ),
      ),
      fertilizer: Math.max(
        0,
        Math.floor(
          sanitizeNumber(
            snapshot.currencies?.fertilizer,
            base.currencies.fertilizer,
          ),
        ),
      ),
    },
    progression: {
      currentStage,
      bossHP,
      maxHP,
    },
    inventory: {
      tapUpgrades: mergeTapUpgrades(snapshot.inventory?.tapUpgrades),
      farmers: mergeFarmers(snapshot.inventory?.farmers),
    },
    settings: {
      buyQuantity: sanitizeBuyQuantity(
        readSettingWithLegacyFallback(snapshot, "buyQuantity"),
      ),
      activeItem: sanitizeActiveItem(
        readSettingWithLegacyFallback(snapshot, "activeItem"),
      ),
      managementTab: sanitizeManagementTab(
        readSettingWithLegacyFallback(snapshot, "managementTab"),
      ),
      isSoundMasterMuted: sanitizeBoolean(
        readSettingWithLegacyFallback(snapshot, "isSoundMasterMuted"),
        base.settings.isSoundMasterMuted,
      ),
      isBgmEnabled: sanitizeBoolean(
        readSettingWithLegacyFallback(snapshot, "isBgmEnabled"),
        base.settings.isBgmEnabled,
      ),
      isSfxEnabled: sanitizeBoolean(
        readSettingWithLegacyFallback(snapshot, "isSfxEnabled"),
        base.settings.isSfxEnabled,
      ),
      bgmVolume: sanitizeVolume(
        readSettingWithLegacyFallback(snapshot, "bgmVolume"),
        base.settings.bgmVolume,
      ),
      sfxVolume: sanitizeVolume(
        readSettingWithLegacyFallback(snapshot, "sfxVolume"),
        base.settings.sfxVolume,
      ),
    },
    sync: {
      localRevision: Math.max(
        0,
        Math.floor(sanitizeNumber(snapshot.sync?.localRevision, 0)),
      ),
      lastMutationAt: sanitizeTimestamp(snapshot.sync?.lastMutationAt),
      lastSyncedAt: sanitizeTimestamp(snapshot.sync?.lastSyncedAt),
    },
    meta: {
      savedAt: sanitizeTimestamp(snapshot.meta?.savedAt),
    },
  };
}

export function snapshotToRuntime(snapshot) {
  const normalized = normalizeSnapshot(snapshot);

  return {
    isLoggedIn: normalized.player.isLoggedIn,
    playerName: normalized.player.name,
    playerEmail: normalized.player.email,
    playerMode: normalized.player.mode,
    coins: normalized.currencies.coins,
    fertilizer: normalized.currencies.fertilizer,
    currentStage: normalized.progression.currentStage,
    bossHP: normalized.progression.bossHP,
    maxHP: normalized.progression.maxHP,
    tapUpgrades: normalized.inventory.tapUpgrades,
    farmers: normalized.inventory.farmers,
    buyQuantity: normalized.settings.buyQuantity,
    activeItem: normalized.settings.activeItem,
    managementTab: normalized.settings.managementTab,
    isSoundMasterMuted: normalized.settings.isSoundMasterMuted,
    isBgmEnabled: normalized.settings.isBgmEnabled,
    isSfxEnabled: normalized.settings.isSfxEnabled,
    bgmVolume: normalized.settings.bgmVolume,
    sfxVolume: normalized.settings.sfxVolume,
    syncMeta: normalized.sync,
    lastSavedAt: normalized.meta.savedAt,
  };
}

export function createDefaultRuntimeState() {
  return snapshotToRuntime(createDefaultSnapshot());
}

export function buildSnapshotFromRuntime(runtimeState) {
  const currentStage = sanitizeStage(runtimeState.currentStage);
  const fallbackMaxHP = getCropHP(currentStage);
  const maxHP = Math.max(
    1,
    Math.floor(sanitizeNumber(runtimeState.maxHP, fallbackMaxHP)),
  );
  const bossHP = Math.max(
    0,
    Math.min(maxHP, Math.floor(sanitizeNumber(runtimeState.bossHP, maxHP))),
  );

  return {
    version: GAME_SAVE_VERSION,
    player: {
      isLoggedIn: Boolean(runtimeState.isLoggedIn),
      name:
        typeof runtimeState.playerName === "string"
          ? runtimeState.playerName
          : "",
      email:
        typeof runtimeState.playerEmail === "string"
          ? runtimeState.playerEmail
          : "",
      mode: runtimeState.playerMode === "offline" ? "offline" : "credentials",
    },
    currencies: {
      coins: Math.max(0, Math.floor(sanitizeNumber(runtimeState.coins, 0))),
      fertilizer: Math.max(
        0,
        Math.floor(sanitizeNumber(runtimeState.fertilizer, DEFAULT_FERTILIZER)),
      ),
    },
    progression: {
      currentStage,
      bossHP,
      maxHP,
    },
    inventory: {
      tapUpgrades: compactTapUpgrades(runtimeState.tapUpgrades),
      farmers: compactFarmers(runtimeState.farmers),
    },
    settings: {
      buyQuantity: sanitizeBuyQuantity(runtimeState.buyQuantity),
      activeItem: sanitizeActiveItem(runtimeState.activeItem),
      managementTab: sanitizeManagementTab(runtimeState.managementTab),
      isSoundMasterMuted: sanitizeBoolean(runtimeState.isSoundMasterMuted),
      isBgmEnabled: sanitizeBoolean(runtimeState.isBgmEnabled, true),
      isSfxEnabled: sanitizeBoolean(runtimeState.isSfxEnabled, true),
      bgmVolume: sanitizeVolume(runtimeState.bgmVolume, 0.42),
      sfxVolume: sanitizeVolume(runtimeState.sfxVolume, 0.5),
    },
    sync: {
      localRevision: Math.max(
        0,
        Math.floor(sanitizeNumber(runtimeState.syncMeta?.localRevision, 0)),
      ),
      lastMutationAt: sanitizeTimestamp(runtimeState.syncMeta?.lastMutationAt),
      lastSyncedAt: sanitizeTimestamp(runtimeState.syncMeta?.lastSyncedAt),
    },
    meta: {
      savedAt: sanitizeTimestamp(runtimeState.lastSavedAt),
    },
  };
}
