function SettingsSection({
  isInstallAvailable,
  isInstalled,
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
      </div>
    </section>
  );
}

export default SettingsSection;
