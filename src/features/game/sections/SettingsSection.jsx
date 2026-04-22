function SettingsSection({
  isInstallAvailable,
  isInstalled,
  isSoundMasterMuted,
  isBgmEnabled,
  isSfxEnabled,
  bgmVolume,
  sfxVolume,
  onSoundMasterMutedChange,
  onBgmEnabledChange,
  onSfxEnabledChange,
  onBgmVolumeChange,
  onSfxVolumeChange,
  onInstall,
  onLogout,
}) {
  const installButtonLabel = isInstalled ? "App Installed" : "Install App";
  const installHintText = isInstalled
    ? "CropTap is already installed on this device."
    : isInstallAvailable
      ? "Install CropTap for faster launching and offline-friendly play."
      : "Install prompt is currently unavailable on this device.";

  return (
    <section className="wf-settings-section" aria-label="Settings">
      <div className="wf-settings-card">
        <h2>Settings</h2>
        <p className="wf-settings-description">
          Manage your app actions and session access.
        </p>

        <div className="wf-settings-actions">
          <button
            type="button"
            className="wf-install-button"
            onClick={onInstall}
            disabled={!isInstallAvailable || isInstalled}
          >
            {installButtonLabel}
          </button>

          <button
            type="button"
            className="wf-install-button wf-logout-button"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>

        <p className="wf-settings-hint">{installHintText}</p>

        <div className="wf-settings-sound-controls" aria-label="Sound settings">
          <h3>Sound</h3>

          <label className="wf-settings-control-row" htmlFor="wf-master-mute">
            <span>Master Mute</span>
            <input
              id="wf-master-mute"
              type="checkbox"
              checked={isSoundMasterMuted}
              onChange={(event) =>
                onSoundMasterMutedChange(event.target.checked)
              }
            />
          </label>

          <label className="wf-settings-control-row" htmlFor="wf-bgm-enabled">
            <span>Background Music</span>
            <input
              id="wf-bgm-enabled"
              type="checkbox"
              checked={isBgmEnabled}
              onChange={(event) => onBgmEnabledChange(event.target.checked)}
            />
          </label>

          <label className="wf-settings-control-row" htmlFor="wf-bgm-volume">
            <span>BGM Volume {Math.round(bgmVolume * 100)}%</span>
            <input
              id="wf-bgm-volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={bgmVolume}
              onChange={(event) =>
                onBgmVolumeChange(Number(event.target.value))
              }
            />
          </label>

          <label className="wf-settings-control-row" htmlFor="wf-sfx-enabled">
            <span>Tap SFX</span>
            <input
              id="wf-sfx-enabled"
              type="checkbox"
              checked={isSfxEnabled}
              onChange={(event) => onSfxEnabledChange(event.target.checked)}
            />
          </label>

          <label className="wf-settings-control-row" htmlFor="wf-sfx-volume">
            <span>SFX Volume {Math.round(sfxVolume * 100)}%</span>
            <input
              id="wf-sfx-volume"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={sfxVolume}
              onChange={(event) =>
                onSfxVolumeChange(Number(event.target.value))
              }
            />
          </label>
        </div>
      </div>
    </section>
  );
}

export default SettingsSection;
