const DEFAULT_BGM_VOLUME = 0.42;

const backgroundMusic = new Audio("/music/croptapBGM.mp3");
backgroundMusic.loop = true;
backgroundMusic.preload = "auto";

let isMasterMuted = false;
let isBgmEnabled = true;
let bgmVolume = DEFAULT_BGM_VOLUME;
let hasUserGestureUnlock = false;
let hasUnlockListeners = false;

const clampVolume = (value, fallback = DEFAULT_BGM_VOLUME) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, numericValue));
};

const applyBackgroundMusicState = () => {
  backgroundMusic.volume = clampVolume(bgmVolume);
  backgroundMusic.muted = isMasterMuted || !isBgmEnabled;
};

applyBackgroundMusicState();

const unlockBackgroundMusic = () => {
  if (hasUserGestureUnlock) {
    return;
  }

  hasUserGestureUnlock = true;

  const previousMuted = backgroundMusic.muted;
  backgroundMusic.muted = true;

  backgroundMusic
    .play()
    .then(() => {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    })
    .catch(() => {
      // Ignore unlock failures to avoid noisy console logs.
    })
    .finally(() => {
      backgroundMusic.muted = previousMuted;
      applyBackgroundMusicState();
    });
};

const tryPlayBackgroundMusic = () => {
  if (backgroundMusic.muted) {
    return;
  }

  backgroundMusic.play().catch(() => {
    // Ignore autoplay rejections until next user interaction.
  });
};

export function registerBackgroundMusicUnlock() {
  if (hasUnlockListeners) {
    return;
  }

  hasUnlockListeners = true;

  const handleFirstGesture = () => {
    unlockBackgroundMusic();
    tryPlayBackgroundMusic();
  };

  document.addEventListener("pointerdown", handleFirstGesture, {
    once: true,
    passive: true,
  });
  document.addEventListener("keydown", handleFirstGesture, {
    once: true,
  });
  document.addEventListener("touchstart", handleFirstGesture, {
    once: true,
    passive: true,
  });
}

export function setBackgroundMusicEnabled(isEnabled) {
  isBgmEnabled = Boolean(isEnabled);
  applyBackgroundMusicState();
}

export function setBackgroundMusicVolume(volume) {
  bgmVolume = clampVolume(volume);
  applyBackgroundMusicState();
}

export function setBackgroundMusicMasterMuted(isMuted) {
  isMasterMuted = Boolean(isMuted);
  applyBackgroundMusicState();
}

export function playBackgroundMusic() {
  registerBackgroundMusicUnlock();
  tryPlayBackgroundMusic();
}

export function pauseBackgroundMusic() {
  backgroundMusic.pause();
}
