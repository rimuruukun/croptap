import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  defaultDesktopSectionId,
  desktopNavItems,
  getPathForSection,
  loginRoutePath,
  mobileNavItems,
} from "./features/game/config/constants";
import LoginPage from "./ui/auth/LoginPage";
import SharedHeader from "./ui/shell/SharedHeader";
import SharedNavigation from "./ui/shell/SharedNavigation";
import SimpleSection from "./ui/common/SimpleSection";
import BattleSection from "./features/game/sections/BattleSection";
import EventSection from "./features/game/sections/EventSection";
import ManagementSection from "./features/game/sections/ManagementSection";
import SettingsSection from "./features/game/sections/SettingsSection";
import { getPurchasePlan } from "./features/game/utils/economy";
import { getCropByStage, getCropHP } from "./features/crops/cropsData";
import {
  pauseBackgroundMusic,
  playBackgroundMusic,
  registerBackgroundMusicUnlock,
  setBackgroundMusicEnabled,
  setBackgroundMusicMasterMuted,
  setBackgroundMusicVolume,
} from "./features/game/audio/backgroundMusic";
import {
  playTapHitSound,
  setTapHitSoundEnabled,
  setTapHitSoundMasterMuted,
  setTapHitSoundVolume,
} from "./features/game/audio/tapHitSound";
import { useNetworkStatus } from "./features/offline/useNetworkStatus";
import { usePwaInstallPrompt } from "./features/offline/usePwaInstallPrompt";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";
import ProtectedRoute from "./routes/ProtectedRoute";
import {
  getDefaultProtectedPath,
  getPostLoginRedirectPath,
  getSectionIdFromPath,
  resolveSafeProtectedPath,
  sectionRouteEntries,
} from "./routes/routeConstants";
import {
  buildSnapshotFromRuntime,
  createDefaultRuntimeState,
  snapshotToRuntime,
} from "./state/offlineGameState";
import { useOfflineGamePersistence } from "./state/useOfflineGamePersistence";
import {
  getAuthErrorMessage,
  registerWithEmailPassword,
  signInWithEmailPassword,
  signOutFirebaseUser,
  subscribeToFirebaseAuthState,
} from "./lib/firebase/authentication/services/emailPasswordAuthService";
import { useSyncRuntime } from "./sync/runtime/useSyncRuntime";

const BOSS_TIMER_DURATION_MS = 30000;

function HydrationLoadingScreen({
  hydrationError,
  forceHydrationFallback,
  isHydrationWatchdogTriggered,
  message = "Loading local save data...",
}) {
  return (
    <div className="wf-page wf-page-loading">
      <div className="wf-loading-card">
        <h1>CropTap</h1>
        <p>{message}</p>
        {hydrationError ? (
          <p className="wf-loading-error">{hydrationError}</p>
        ) : null}
        <div className="wf-loading-actions">
          <button
            type="button"
            className="wf-loading-action-button"
            onClick={forceHydrationFallback}
          >
            Continue Without Local Save
          </button>
          {isHydrationWatchdogTriggered ? (
            <p className="wf-loading-hint">
              Recovery mode active. You can keep playing while storage is
              unavailable.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProtectedAppLayout({
  isDesktopLayout,
  activeItem,
  managementTab,
  coins,
  fertilizer,
  isOnline,
  isSaving,
  hasUnsavedChanges,
  lastSavedAt,
  syncStatus,
  persistenceError,
  battleSection,
}) {
  if (isDesktopLayout) {
    return (
      <div className="wf-page">
        <SharedHeader
          coins={coins}
          fertilizer={fertilizer}
          activeItem={activeItem}
          managementTab={managementTab}
          isOnline={isOnline}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSavedAt={lastSavedAt}
          syncStatus={syncStatus}
          persistenceError={persistenceError}
        />

        <main className="wf-play-panel wf-desktop-left-panel">
          <Outlet />
        </main>

        <div className="wf-desktop-battle-panel">{battleSection}</div>

        <div className="wf-mobile-nav-wrap wf-desktop-nav-wrap">
          <SharedNavigation activeItem={activeItem} items={desktopNavItems} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`wf-page${activeItem === "battle" ? " wf-page-battle" : ""}`}
    >
      <SharedHeader
        coins={coins}
        fertilizer={fertilizer}
        activeItem={activeItem}
        managementTab={managementTab}
        isOnline={isOnline}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        lastSavedAt={lastSavedAt}
        syncStatus={syncStatus}
        persistenceError={persistenceError}
      />

      <div className="wf-layout">
        <main className="wf-play-panel">
          <Outlet />
        </main>
      </div>

      <div className="wf-mobile-nav-wrap">
        <SharedNavigation activeItem={activeItem} items={mobileNavItems} />
      </div>
    </div>
  );
}

function App() {
  const defaultRuntimeRef = useRef(createDefaultRuntimeState());
  const defaultRuntime = defaultRuntimeRef.current;
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(defaultRuntime.isLoggedIn);
  const [playerName, setPlayerName] = useState(defaultRuntime.playerName);
  const [playerEmail, setPlayerEmail] = useState(defaultRuntime.playerEmail);
  const [playerMode, setPlayerMode] = useState(defaultRuntime.playerMode);
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [ownerUid, setOwnerUid] = useState("");

  const [activeItem, setActiveItem] = useState(defaultRuntime.activeItem);
  const [managementTab, setManagementTab] = useState(
    defaultRuntime.managementTab,
  );
  const [isSoundMasterMuted, setIsSoundMasterMuted] = useState(
    defaultRuntime.isSoundMasterMuted,
  );
  const [isBgmEnabled, setIsBgmEnabled] = useState(defaultRuntime.isBgmEnabled);
  const [isSfxEnabled, setIsSfxEnabled] = useState(defaultRuntime.isSfxEnabled);
  const [bgmVolume, setBgmVolume] = useState(defaultRuntime.bgmVolume);
  const [sfxVolume, setSfxVolume] = useState(defaultRuntime.sfxVolume);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);

  const [coins, setCoins] = useState(defaultRuntime.coins);
  const [fertilizer, setFertilizer] = useState(defaultRuntime.fertilizer);

  const [tapUpgrades, setTapUpgrades] = useState(defaultRuntime.tapUpgrades);
  const [farmers, setFarmers] = useState(defaultRuntime.farmers);
  const [buyQuantity, setBuyQuantity] = useState(defaultRuntime.buyQuantity);

  const [currentStage, setCurrentStage] = useState(defaultRuntime.currentStage);
  const [bossHP, setBossHP] = useState(defaultRuntime.bossHP);
  const [maxHP, setMaxHP] = useState(defaultRuntime.maxHP);

  const [syncMeta, setSyncMeta] = useState(defaultRuntime.syncMeta);

  const [timerPercent, setTimerPercent] = useState(100);
  const [hpTrailPercent, setHpTrailPercent] = useState(100);

  const bossTimerStartRef = useRef(null);
  const hpTrailTargetRef = useRef(100);
  const hpTrailFrameRef = useRef(null);
  const hydratedBossStateRef = useRef(null);
  const previousRouteSectionRef = useRef(null);

  const isOnline = useNetworkStatus();
  const { isInstalled, isInstallAvailable, promptInstall } =
    usePwaInstallPrompt();

  const routeSectionId = useMemo(
    () => getSectionIdFromPath(location.pathname),
    [location.pathname],
  );

  const recordMutation = useCallback(() => {
    if (!ownerUid) {
      return;
    }

    const mutationTimestamp = Date.now();

    setSyncMeta((current) => ({
      ...current,
      localRevision: current.localRevision + 1,
      lastMutationAt: mutationTimestamp,
    }));
  }, [ownerUid]);

  const applyHydratedSnapshot = useCallback((snapshot) => {
    const runtime = snapshotToRuntime(snapshot);

    setIsLoggedIn(runtime.isLoggedIn);
    setPlayerName(runtime.playerName);
    setPlayerEmail(runtime.playerEmail);
    setPlayerMode(runtime.playerMode);

    setCoins(runtime.coins);
    setFertilizer(runtime.fertilizer);

    setTapUpgrades(runtime.tapUpgrades);
    setFarmers(runtime.farmers);
    setBuyQuantity(runtime.buyQuantity);

    setActiveItem(runtime.activeItem);
    setManagementTab(runtime.managementTab);
    setIsSoundMasterMuted(runtime.isSoundMasterMuted);
    setIsBgmEnabled(runtime.isBgmEnabled);
    setIsSfxEnabled(runtime.isSfxEnabled);
    setBgmVolume(runtime.bgmVolume);
    setSfxVolume(runtime.sfxVolume);

    setCurrentStage(runtime.currentStage);
    setBossHP(runtime.bossHP);
    setMaxHP(runtime.maxHP);
    setSyncMeta(runtime.syncMeta);

    hydratedBossStateRef.current = {
      stage: runtime.currentStage,
      bossHP: runtime.bossHP,
      maxHP: runtime.maxHP,
    };

    const hpPercent =
      runtime.maxHP > 0
        ? Math.max(0, (runtime.bossHP / runtime.maxHP) * 100)
        : 100;
    setTimerPercent(100);
    setHpTrailPercent(hpPercent);
    hpTrailTargetRef.current = hpPercent;
    bossTimerStartRef.current = null;
  }, []);

  const resetRuntimeForSignedOutUser = useCallback(() => {
    applyHydratedSnapshot(
      buildSnapshotFromRuntime(createDefaultRuntimeState()),
    );
  }, [applyHydratedSnapshot]);

  const snapshotForPersistence = useMemo(
    () =>
      buildSnapshotFromRuntime({
        isLoggedIn,
        playerName,
        playerEmail,
        playerMode,
        coins,
        fertilizer,
        tapUpgrades,
        farmers,
        buyQuantity,
        activeItem,
        managementTab,
        isSoundMasterMuted,
        isBgmEnabled,
        isSfxEnabled,
        bgmVolume,
        sfxVolume,
        currentStage,
        bossHP,
        maxHP,
        syncMeta,
      }),
    [
      activeItem,
      bgmVolume,
      bossHP,
      buyQuantity,
      coins,
      currentStage,
      farmers,
      fertilizer,
      isBgmEnabled,
      isLoggedIn,
      isSfxEnabled,
      isSoundMasterMuted,
      managementTab,
      maxHP,
      playerEmail,
      playerMode,
      playerName,
      sfxVolume,
      syncMeta,
      tapUpgrades,
    ],
  );

  useEffect(() => {
    registerBackgroundMusicUnlock();
  }, []);

  useEffect(() => {
    setBackgroundMusicMasterMuted(isSoundMasterMuted);
    setBackgroundMusicEnabled(isBgmEnabled);
    setBackgroundMusicVolume(bgmVolume);

    if (isSoundMasterMuted || !isBgmEnabled) {
      pauseBackgroundMusic();
      return;
    }

    playBackgroundMusic();
  }, [bgmVolume, isBgmEnabled, isSoundMasterMuted]);

  useEffect(() => {
    setTapHitSoundMasterMuted(isSoundMasterMuted);
    setTapHitSoundEnabled(isSfxEnabled);
    setTapHitSoundVolume(sfxVolume);
  }, [isSfxEnabled, isSoundMasterMuted, sfxVolume]);

  useEffect(
    () => () => {
      pauseBackgroundMusic();
    },
    [],
  );

  const {
    isHydrating,
    isHydrated,
    isSaving,
    hasUnsavedChanges,
    lastSavedAt,
    hydrationError,
    saveError,
    isHydrationWatchdogTriggered,
    forceHydrationFallback,
  } = useOfflineGamePersistence({
    snapshot: snapshotForPersistence,
    onHydrate: applyHydratedSnapshot,
    ownerUid,
    enabled: Boolean(ownerUid),
  });

  const { isSyncing, syncError, lastSyncAt, syncStatus } = useSyncRuntime({
    ownerUid,
    isHydrated,
    onRemoteSnapshot: applyHydratedSnapshot,
  });

  const [isPostLoginLoading, setIsPostLoginLoading] = useState(false);

  const isSessionReady = !isHydrating && isHydrated && isAuthInitialized;
  const isAppReady = isSessionReady && !isPostLoginLoading;

  useEffect(() => {
    if (!ownerUid || !isAuthInitialized) {
      setIsPostLoginLoading(false);
      return;
    }

    setIsPostLoginLoading(true);
  }, [isAuthInitialized, ownerUid]);

  useEffect(() => {
    if (!isPostLoginLoading) {
      return undefined;
    }

    let isCancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (!isCancelled) {
        setIsPostLoginLoading(false);
      }
    }, 5000);

    if (syncStatus?.initialFetchComplete) {
      window.clearTimeout(timeoutId);
      setIsPostLoginLoading(false);
      return undefined;
    }

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isPostLoginLoading, syncStatus?.initialFetchComplete]);

  useEffect(() => {
    if (!lastSyncAt) {
      return;
    }

    setSyncMeta((current) => ({
      ...current,
      lastSyncedAt: lastSyncAt,
    }));
  }, [lastSyncAt]);

  useEffect(() => {
    let isDisposed = false;
    let unsubscribe = () => {};

    try {
      unsubscribe = subscribeToFirebaseAuthState(
        (user) => {
          if (isDisposed) {
            return;
          }

          setIsAuthInitialized(true);
          setIsAuthenticating(false);

          if (!user) {
            setOwnerUid("");
            resetRuntimeForSignedOutUser();
            return;
          }

          setOwnerUid(user.uid || "");
          setAuthError("");
          setIsLoggedIn(true);
          setPlayerName(user.displayName || user.email || "Farmer");
          setPlayerEmail(user.email || "");
          setPlayerMode("credentials");
        },
        (error) => {
          if (isDisposed) {
            return;
          }

          setAuthError(getAuthErrorMessage(error));
          setIsAuthenticating(false);
          setIsAuthInitialized(true);
        },
      );
    } catch (error) {
      if (!isDisposed) {
        setAuthError(getAuthErrorMessage(error));
        setIsAuthenticating(false);
        setIsAuthInitialized(true);
      }
    }

    return () => {
      isDisposed = true;
      unsubscribe();
    };
  }, [resetRuntimeForSignedOutUser]);

  const safeDefaultProtectedPath = useMemo(
    () => getDefaultProtectedPath(isDesktopLayout),
    [isDesktopLayout],
  );
  const restoredProtectedPath = useMemo(
    () =>
      resolveSafeProtectedPath(getPathForSection(activeItem), isDesktopLayout),
    [activeItem, isDesktopLayout],
  );
  const postLoginRedirectPath = useMemo(
    () => getPostLoginRedirectPath(location.state, isDesktopLayout),
    [isDesktopLayout, location.state],
  );

  const autoTapRate = useMemo(
    () =>
      farmers.reduce(
        (total, farmer) => total + farmer.owned * farmer.tapsPerSecPerHire,
        0,
      ),
    [farmers],
  );

  const tapDamage = useMemo(() => {
    const baseDamage = tapUpgrades.reduce(
      (total, upgrade) => total + upgrade.level * upgrade.dmgPerLevel,
      1,
    );

    const farmerBonusMultiplier =
      1 + farmers.reduce((total, farmer) => total + farmer.owned * 0.02, 0);
    return Math.ceil(baseDamage * farmerBonusMultiplier);
  }, [tapUpgrades, farmers]);

  useEffect(() => {
    const hydratedBossState = hydratedBossStateRef.current;

    if (hydratedBossState && hydratedBossState.stage === currentStage) {
      const nextMaxHP = Math.max(1, Math.floor(hydratedBossState.maxHP));
      const nextBossHP = Math.max(
        0,
        Math.min(nextMaxHP, Math.floor(hydratedBossState.bossHP)),
      );
      const nextPercent = Math.max(0, (nextBossHP / nextMaxHP) * 100);

      setMaxHP(nextMaxHP);
      setBossHP(nextBossHP);
      setTimerPercent(100);
      setHpTrailPercent(nextPercent);
      hpTrailTargetRef.current = nextPercent;
      bossTimerStartRef.current = null;
      hydratedBossStateRef.current = null;

      if (hpTrailFrameRef.current) {
        cancelAnimationFrame(hpTrailFrameRef.current);
        hpTrailFrameRef.current = null;
      }

      return;
    }

    const hp = getCropHP(currentStage);
    setMaxHP(hp);
    setBossHP(hp);
    setTimerPercent(100);
    setHpTrailPercent(100);
    hpTrailTargetRef.current = 100;
    bossTimerStartRef.current = null;

    if (hpTrailFrameRef.current) {
      cancelAnimationFrame(hpTrailFrameRef.current);
      hpTrailFrameRef.current = null;
    }
  }, [currentStage]);

  useEffect(() => {
    const animateTrail = () => {
      setHpTrailPercent((current) => {
        const target = hpTrailTargetRef.current;
        const difference = target - current;

        if (Math.abs(difference) < 0.05) {
          return target;
        }

        const next = current + difference * 0.28;
        return Math.max(0, Math.min(100, next));
      });

      hpTrailFrameRef.current = requestAnimationFrame(animateTrail);
    };

    hpTrailFrameRef.current = requestAnimationFrame(animateTrail);

    return () => {
      if (hpTrailFrameRef.current) {
        cancelAnimationFrame(hpTrailFrameRef.current);
        hpTrailFrameRef.current = null;
      }
    };
  }, [currentStage]);

  useEffect(() => {
    const isBossStage = currentStage % 10 === 0;

    if (!isBossStage) {
      setTimerPercent(100);
      bossTimerStartRef.current = null;
      return undefined;
    }

    if (bossHP <= 0) {
      return undefined;
    }

    if (!bossTimerStartRef.current) {
      bossTimerStartRef.current = Date.now();
    }

    const timerId = setInterval(() => {
      const elapsed = Date.now() - bossTimerStartRef.current;
      const remaining = Math.max(
        0,
        100 - (elapsed / BOSS_TIMER_DURATION_MS) * 100,
      );

      setTimerPercent(remaining);

      if (remaining <= 0) {
        clearInterval(timerId);

        setCurrentStage((stage) => {
          const nextStage = Math.max(1, stage - 1);

          if (nextStage !== stage && isHydrated) {
            recordMutation("STAGE_REGRESSED", {
              fromStage: stage,
              toStage: nextStage,
              reason: "boss_timeout",
            });
          }

          return nextStage;
        });
      }
    }, 50);

    return () => clearInterval(timerId);
  }, [bossHP, currentStage, isHydrated, recordMutation]);

  useEffect(() => {
    if (autoTapRate <= 0) {
      return undefined;
    }

    const autoTapTimer = setInterval(() => {
      setBossHP((current) => {
        if (current <= 0) {
          return current;
        }

        const newHP = current - autoTapRate;
        const nextPercent = maxHP > 0 ? Math.max(0, (newHP / maxHP) * 100) : 0;

        hpTrailTargetRef.current = nextPercent;

        const coinsPerHit = Math.floor(autoTapRate * 0.1);
        //setCoins((value) => value + coinsPerHit);

        if (newHP <= 0) {
          setCurrentStage((stage) => {
            const nextStage = stage + 1;

            if (isHydrated) {
              recordMutation("STAGE_ADVANCED", {
                fromStage: stage,
                toStage: nextStage,
                source: "auto",
              });
            }

            return nextStage;
          });

          setCoins((value) => value + Math.floor(maxHP));
          return 0;
        }

        return newHP;
      });
    }, 1000);

    return () => clearInterval(autoTapTimer);
  }, [autoTapRate, isHydrated, maxHP, recordMutation]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 960px)");

    const updateLayout = () => {
      setIsDesktopLayout(mediaQuery.matches);
    };

    updateLayout();
    mediaQuery.addEventListener("change", updateLayout);

    return () => {
      mediaQuery.removeEventListener("change", updateLayout);
    };
  }, []);

  useEffect(() => {
    if (!routeSectionId) {
      previousRouteSectionRef.current = null;
      return;
    }

    const normalizedSectionId =
      isDesktopLayout && routeSectionId === "battle"
        ? defaultDesktopSectionId
        : routeSectionId;

    if (normalizedSectionId !== activeItem) {
      setActiveItem(normalizedSectionId);
    }

    if (normalizedSectionId === "tools") {
      setManagementTab("tools");
    }

    if (isDesktopLayout && normalizedSectionId === "farmers") {
      setManagementTab("farmers");
    }

    if (
      !isDesktopLayout &&
      routeSectionId === "farmers" &&
      previousRouteSectionRef.current !== routeSectionId
    ) {
      setManagementTab("tools");
    }

    previousRouteSectionRef.current = routeSectionId;
  }, [activeItem, isDesktopLayout, routeSectionId]);

  useEffect(() => {
    if (!isSessionReady || !isLoggedIn || !isDesktopLayout) {
      return;
    }

    if (routeSectionId === "battle") {
      navigate(safeDefaultProtectedPath, { replace: true });
    }
  }, [
    isDesktopLayout,
    isLoggedIn,
    isSessionReady,
    navigate,
    routeSectionId,
    safeDefaultProtectedPath,
  ]);

  const handleBuyUpgrade = useCallback(
    (upgradeId) => {
      const target = tapUpgrades.find((entry) => entry.id === upgradeId);

      if (!target) {
        return;
      }

      const plan = getPurchasePlan({
        price: target.price,
        growth: target.growth,
        coins,
        quantity: buyQuantity,
      });

      if (plan.purchased === 0) {
        return;
      }

      setCoins((value) => value - plan.totalCost);
      setTapUpgrades((current) =>
        current.map((entry) => {
          if (entry.id !== upgradeId) {
            return entry;
          }

          return {
            ...entry,
            level: entry.level + plan.purchased,
            price: plan.nextPrice,
          };
        }),
      );

      if (isHydrated) {
        recordMutation("BUY_UPGRADE", {
          upgradeId,
          purchased: plan.purchased,
          totalCost: plan.totalCost,
          nextPrice: plan.nextPrice,
        });
      }
    },
    [buyQuantity, coins, isHydrated, recordMutation, tapUpgrades],
  );

  const handleHireFarmer = useCallback(
    (farmerId) => {
      const target = farmers.find((entry) => entry.id === farmerId);

      if (!target) {
        return;
      }

      const plan = getPurchasePlan({
        price: target.price,
        growth: target.growth,
        coins,
        quantity: buyQuantity,
      });

      if (plan.purchased === 0) {
        return;
      }

      setCoins((value) => value - plan.totalCost);
      setFarmers((current) =>
        current.map((entry) => {
          if (entry.id !== farmerId) {
            return entry;
          }

          return {
            ...entry,
            owned: entry.owned + plan.purchased,
            price: plan.nextPrice,
          };
        }),
      );

      if (isHydrated) {
        recordMutation("HIRE_FARMER", {
          farmerId,
          purchased: plan.purchased,
          totalCost: plan.totalCost,
          nextPrice: plan.nextPrice,
        });
      }
    },
    [buyQuantity, coins, farmers, isHydrated, recordMutation],
  );

  const handleTap = useCallback(() => {
    if (bossHP <= 0) {
      return;
    }

    const damage = tapDamage;
    playTapHitSound(damage);
    const newHP = bossHP - damage;
    const nextPercent = maxHP > 0 ? Math.max(0, (newHP / maxHP) * 100) : 0;

    setBossHP(newHP);
    hpTrailTargetRef.current = nextPercent;

    const coinsPerTap = Math.floor(damage * 0.1);
    //setCoins((value) => value + coinsPerTap);

    if (newHP <= 0) {
      setCurrentStage((stage) => {
        const nextStage = stage + 1;

        if (isHydrated) {
          recordMutation("STAGE_ADVANCED", {
            fromStage: stage,
            toStage: nextStage,
            source: "manual",
          });
        }

        return nextStage;
      });

      setCoins((value) => value + Math.floor(maxHP));
    }
  }, [bossHP, isHydrated, maxHP, recordMutation, tapDamage]);

  const handleLogout = useCallback(async () => {
    setAuthError("");

    try {
      await signOutFirebaseUser();

      if (isHydrated && ownerUid) {
        recordMutation("LOGOUT", {
          fromRoute: routeSectionId ?? activeItem,
        });
      }

      setOwnerUid("");
      resetRuntimeForSignedOutUser();

      navigate(loginRoutePath, { replace: true });
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    }
  }, [
    activeItem,
    isHydrated,
    navigate,
    ownerUid,
    recordMutation,
    resetRuntimeForSignedOutUser,
    routeSectionId,
  ]);

  const renderBattleSection = useCallback(
    () => (
      <BattleSection
        stage={currentStage}
        bossHP={bossHP}
        maxHP={maxHP}
        crop={getCropByStage(currentStage)}
        onTap={handleTap}
        timerPercent={timerPercent}
        hpTrailPercent={hpTrailPercent}
      />
    ),
    [bossHP, currentStage, handleTap, hpTrailPercent, maxHP, timerPercent],
  );

  const renderMobileRouteElement = useCallback(
    (sectionId) => {
      if (sectionId === "battle") {
        return renderBattleSection();
      }

      if (sectionId === "events") {
        return <EventSection />;
      }

      if (sectionId === "farmers") {
        return (
          <ManagementSection
            activeTab={managementTab}
            onTabChange={setManagementTab}
            upgrades={tapUpgrades}
            farmers={farmers}
            coins={coins}
            quantity={buyQuantity}
            onQuantityChange={setBuyQuantity}
            onBuy={handleBuyUpgrade}
            onHire={handleHireFarmer}
            autoTapRate={autoTapRate}
          />
        );
      }

      if (sectionId === "tools") {
        return (
          <ManagementSection
            activeTab="tools"
            onTabChange={setManagementTab}
            showSwitch={false}
            upgrades={tapUpgrades}
            farmers={farmers}
            coins={coins}
            quantity={buyQuantity}
            onQuantityChange={setBuyQuantity}
            onBuy={handleBuyUpgrade}
            onHire={handleHireFarmer}
            autoTapRate={autoTapRate}
          />
        );
      }

      if (sectionId === "leaderboards") {
        return (
          <SimpleSection
            title="Leaderboards"
            message="Leaderboards section wireframe coming next."
          />
        );
      }

      if (sectionId === "settings") {
        return (
          <SettingsSection
            isInstallAvailable={isInstallAvailable}
            isInstalled={isInstalled}
            isSoundMasterMuted={isSoundMasterMuted}
            isBgmEnabled={isBgmEnabled}
            isSfxEnabled={isSfxEnabled}
            bgmVolume={bgmVolume}
            sfxVolume={sfxVolume}
            onSoundMasterMutedChange={setIsSoundMasterMuted}
            onBgmEnabledChange={setIsBgmEnabled}
            onSfxEnabledChange={setIsSfxEnabled}
            onBgmVolumeChange={setBgmVolume}
            onSfxVolumeChange={setSfxVolume}
            onInstall={promptInstall}
            onLogout={handleLogout}
          />
        );
      }

      return (
        <SimpleSection
          title="Settings"
          message="Settings section wireframe coming next."
        />
      );
    },
    [
      autoTapRate,
      buyQuantity,
      coins,
      farmers,
      handleBuyUpgrade,
      handleHireFarmer,
      handleLogout,
      isInstallAvailable,
      isInstalled,
      isBgmEnabled,
      managementTab,
      bgmVolume,
      promptInstall,
      renderBattleSection,
      isSfxEnabled,
      isSoundMasterMuted,
      sfxVolume,
      tapUpgrades,
    ],
  );

  const renderDesktopRouteElement = useCallback(
    (sectionId) => {
      if (sectionId === "battle") {
        return <Navigate to={safeDefaultProtectedPath} replace />;
      }

      if (sectionId === "tools") {
        return (
          <ManagementSection
            activeTab="tools"
            onTabChange={setManagementTab}
            showSwitch={false}
            upgrades={tapUpgrades}
            farmers={farmers}
            coins={coins}
            quantity={buyQuantity}
            onQuantityChange={setBuyQuantity}
            onBuy={handleBuyUpgrade}
            onHire={handleHireFarmer}
            autoTapRate={autoTapRate}
          />
        );
      }

      if (sectionId === "farmers") {
        return (
          <ManagementSection
            activeTab="farmers"
            onTabChange={setManagementTab}
            showSwitch={false}
            upgrades={tapUpgrades}
            farmers={farmers}
            coins={coins}
            quantity={buyQuantity}
            onQuantityChange={setBuyQuantity}
            onBuy={handleBuyUpgrade}
            onHire={handleHireFarmer}
            autoTapRate={autoTapRate}
          />
        );
      }

      if (sectionId === "leaderboards") {
        return (
          <SimpleSection
            title="Leaderboards"
            message="Leaderboards section wireframe coming next."
          />
        );
      }

      if (sectionId === "settings") {
        return (
          <SettingsSection
            isInstallAvailable={isInstallAvailable}
            isInstalled={isInstalled}
            isSoundMasterMuted={isSoundMasterMuted}
            isBgmEnabled={isBgmEnabled}
            isSfxEnabled={isSfxEnabled}
            bgmVolume={bgmVolume}
            sfxVolume={sfxVolume}
            onSoundMasterMutedChange={setIsSoundMasterMuted}
            onBgmEnabledChange={setIsBgmEnabled}
            onSfxEnabledChange={setIsSfxEnabled}
            onBgmVolumeChange={setBgmVolume}
            onSfxVolumeChange={setSfxVolume}
            onInstall={promptInstall}
            onLogout={handleLogout}
          />
        );
      }

      return <EventSection />;
    },
    [
      autoTapRate,
      buyQuantity,
      coins,
      farmers,
      handleBuyUpgrade,
      handleHireFarmer,
      handleLogout,
      isInstallAvailable,
      isInstalled,
      isBgmEnabled,
      bgmVolume,
      isSfxEnabled,
      isSoundMasterMuted,
      promptInstall,
      safeDefaultProtectedPath,
      sfxVolume,
      tapUpgrades,
    ],
  );

  const handleLogin = useCallback(
    async ({ mode, name, email, password }) => {
      const normalizedEmail = typeof email === "string" ? email.trim() : "";
      const normalizedPassword = typeof password === "string" ? password : "";
      const normalizedName = typeof name === "string" ? name.trim() : "";

      if (!normalizedEmail || !normalizedPassword) {
        return;
      }

      const isRegisterMode = mode === "register";
      setAuthError("");
      setIsAuthenticating(true);

      try {
        const user = isRegisterMode
          ? await registerWithEmailPassword({
              email: normalizedEmail,
              password: normalizedPassword,
              displayName: normalizedName || undefined,
            })
          : await signInWithEmailPassword({
              email: normalizedEmail,
              password: normalizedPassword,
            });

        const resolvedName =
          user.displayName || normalizedName || user.email || "Farmer";
        const nextPlayerEmail = user.email || normalizedEmail;
        const nextPlayerMode = "credentials";

        const redirectPath = getPostLoginRedirectPath(
          location.state,
          isDesktopLayout,
        );
        const targetSectionId =
          getSectionIdFromPath(redirectPath) ?? activeItem;
        const nextActiveItem =
          isDesktopLayout && targetSectionId === "battle"
            ? defaultDesktopSectionId
            : targetSectionId;
        const nextManagementTab =
          nextActiveItem === "farmers"
            ? isDesktopLayout
              ? "farmers"
              : "tools"
            : "tools";

        setPlayerName(resolvedName);
        setPlayerEmail(nextPlayerEmail);
        setPlayerMode(nextPlayerMode);
        setIsLoggedIn(true);
        setActiveItem(nextActiveItem);

        if (nextActiveItem === "tools" || nextActiveItem === "farmers") {
          setManagementTab(nextManagementTab);
        }

        if (isHydrated) {
          recordMutation("LOGIN", {
            mode: nextPlayerMode,
            playerName: resolvedName,
          });
        }

        navigate(redirectPath, { replace: true });
      } catch (error) {
        setAuthError(getAuthErrorMessage(error));
      } finally {
        setIsAuthenticating(false);
      }
    },
    [
      activeItem,
      isDesktopLayout,
      isHydrated,
      location.state,
      navigate,
      recordMutation,
    ],
  );

  const persistenceError = hydrationError || saveError || syncError;

  const loadingFallback = (
    <HydrationLoadingScreen
      hydrationError={hydrationError}
      forceHydrationFallback={forceHydrationFallback}
      isHydrationWatchdogTriggered={isHydrationWatchdogTriggered}
    />
  );

  const postLoginLoadingFallback = (
    <HydrationLoadingScreen
      hydrationError={syncError}
      forceHydrationFallback={() => setIsPostLoginLoading(false)}
      isHydrationWatchdogTriggered={false}
      message="Syncing account data..."
    />
  );

  const activeLoadingFallback = isPostLoginLoading
    ? postLoginLoadingFallback
    : loadingFallback;

  return (
    <Routes>
      <Route
        element={
          <PublicOnlyRoute
            isLoggedIn={isLoggedIn}
            isSessionReady={isAppReady}
            redirectTo={postLoginRedirectPath}
            loadingFallback={activeLoadingFallback}
          />
        }
      >
        <Route
          path={loginRoutePath}
          element={
            <LoginPage
              onLogin={handleLogin}
              isOnline={isOnline}
              lastSavedAt={lastSavedAt}
              hydrationError={hydrationError}
              authError={authError}
              isAuthenticating={isAuthenticating}
            />
          }
        />
      </Route>

      <Route
        element={
          <ProtectedRoute
            isLoggedIn={isLoggedIn}
            isSessionReady={isAppReady}
            loadingFallback={activeLoadingFallback}
          />
        }
      >
        <Route
          element={
            <ProtectedAppLayout
              isDesktopLayout={isDesktopLayout}
              activeItem={activeItem}
              managementTab={managementTab}
              coins={coins}
              fertilizer={fertilizer}
              isOnline={isOnline}
              isSaving={isSaving}
              hasUnsavedChanges={hasUnsavedChanges}
              lastSavedAt={lastSavedAt}
              syncStatus={syncStatus}
              persistenceError={persistenceError}
              battleSection={renderBattleSection()}
            />
          }
        >
          <Route
            path="/"
            element={<Navigate to={restoredProtectedPath} replace />}
          />
          {sectionRouteEntries.map((entry) => (
            <Route
              key={entry.id}
              path={entry.path}
              element={
                isDesktopLayout
                  ? renderDesktopRouteElement(entry.id)
                  : renderMobileRouteElement(entry.id)
              }
            />
          ))}
          <Route
            path="*"
            element={<Navigate to={safeDefaultProtectedPath} replace />}
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
