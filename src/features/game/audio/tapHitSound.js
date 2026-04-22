const DEFAULT_SFX_VOLUME = 0.5;

const tapHitSound = new Audio("/music/tapHit.mp3");
tapHitSound.preload = "auto";

let isMasterMuted = false;
let isSfxEnabled = true;
let sfxVolume = DEFAULT_SFX_VOLUME;

const clampVolume = (value, fallback = DEFAULT_SFX_VOLUME) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, numericValue));
};

const applyTapHitState = () => {
  tapHitSound.volume = clampVolume(sfxVolume);
  tapHitSound.muted = isMasterMuted || !isSfxEnabled;
};

applyTapHitState();

export function setTapHitSoundEnabled(isEnabled) {
  isSfxEnabled = Boolean(isEnabled);
  applyTapHitState();
}

export function setTapHitSoundVolume(volume) {
  sfxVolume = clampVolume(volume);
  applyTapHitState();
}

export function setTapHitSoundMasterMuted(isMuted) {
  isMasterMuted = Boolean(isMuted);
  applyTapHitState();
}

export function playTapHitSound(damage) {
  if (tapHitSound.muted) {
    return;
  }

  // Damage is accepted for forward compatibility with future dynamic SFX tuning.
  const _damageMetadata = damage;
  void _damageMetadata;

  tapHitSound.currentTime = 0;
  tapHitSound.play().catch(() => {
    // Ignore playback failures until browser gesture policy is satisfied.
  });
}
