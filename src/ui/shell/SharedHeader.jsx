import { formatCompact } from "../../features/game/utils/economy";

function formatSaveStatus(isSaving, hasUnsavedChanges, lastSavedAt) {
  if (isSaving) {
    return "Saving progress...";
  }

  if (hasUnsavedChanges) {
    return "Unsaved changes";
  }

  if (!lastSavedAt) {
    return "Waiting for first save";
  }

  const savedTime = new Date(lastSavedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return `Saved ${savedTime}`;
}

function formatSyncStatus(syncStatus) {
  if (!syncStatus) {
    return "Sync unknown";
  }

  if (syncStatus.lastError && !syncStatus.persistenceEnabled) {
    return `Cache fallback: ${syncStatus.cacheType}`;
  }

  if (syncStatus.hasPendingWrites) {
    return "Syncing changes";
  }

  if (!syncStatus.initialFetchComplete) {
    return "Connecting to sync";
  }

  if (syncStatus.cacheSource === "cache") {
    return "Offline cache ready";
  }

  return "Sync ready";
}

function SharedHeader({
  coins,
  fertilizer,
  activeItem,
  managementTab,
  isOnline,
  isSaving,
  hasUnsavedChanges,
  lastSavedAt,
  syncStatus,
  persistenceError,
}) {
  const getTitleText = () => {
    if (activeItem === "farmers") {
      return managementTab === "tools" ? "Tools" : "Farmers";
    }

    const titleMap = {
      battle: "Battle",
      tools: "Tools",
      events: "Events",
      leaderboards: "Leaderboards",
      settings: "Settings",
    };

    return titleMap[activeItem] || "CropTap";
  };

  const saveStatusText = formatSaveStatus(
    isSaving,
    hasUnsavedChanges,
    lastSavedAt,
  );

  return (
    <header className="wf-header" aria-label="Currency header">
      <div className="wf-currency-row">
        <div className="wf-currency-side left" aria-label="Coins">
          <img
            src="/assets/ui/coin.png"
            alt="Coins"
            className="wf-currency-icon"
          />
          <span>{formatCompact(coins)}</span>
        </div>
        <div className="wf-header-title">{getTitleText()}</div>
        <div className="wf-currency-side right" aria-label="Fertilizer">
          <span>{formatCompact(fertilizer)}</span>
          <img
            src="/assets/ui/fertilizer.png"
            alt="Fertilizer"
            className="wf-currency-icon"
          />
        </div>
      </div>

      <div className="wf-status-row" role="status" aria-live="polite">
        <span className={`wf-network-pill ${isOnline ? "online" : "offline"}`}>
          {isOnline ? "Online" : "Offline"}
        </span>
        <span className="wf-save-pill">{saveStatusText}</span>
        <span className="wf-sync-pill">{formatSyncStatus(syncStatus)}</span>
      </div>

      {persistenceError ? (
        <p className="wf-persistence-error">{persistenceError}</p>
      ) : null}
    </header>
  );
}

export default SharedHeader;
