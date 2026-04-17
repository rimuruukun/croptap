import { useEffect, useMemo, useRef, useState } from 'react';

import { desktopNavItems, initialFarmers, initialTapUpgrades, mobileNavItems } from './app/constants';
import { getPurchasePlan } from './app/utils';
import { getCropByStage, getCropHP } from './features/crops/cropsData';
import SharedHeader from './app/components/SharedHeader';
import SharedNavigation from './app/components/SharedNavigation';
import BattleSection from './app/sections/BattleSection';
import EventSection from './app/sections/EventSection';
import ManagementSection from './app/sections/ManagementSection';
import SimpleSection from './app/components/SimpleSection';
import LoginPage from './app/components/LoginPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [activeItem, setActiveItem] = useState('battle');
  const [managementTab, setManagementTab] = useState('tools');
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const [coins, setCoins] = useState(500);
  const [fertilizer] = useState(4200000);
  const [tapUpgrades, setTapUpgrades] = useState(initialTapUpgrades);
  const [farmers, setFarmers] = useState(initialFarmers);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [currentStage, setCurrentStage] = useState(1);
  const [bossHP, setBossHP] = useState(0);
  const [maxHP, setMaxHP] = useState(0);
  const [timerPercent, setTimerPercent] = useState(100);
  const [hpTrailPercent, setHpTrailPercent] = useState(100);
  const bossTimerStartRef = useRef(null);
  const hpTrailTargetRef = useRef(100);
  const hpTrailFrameRef = useRef(null);

  const autoTapRate = useMemo(
    () => farmers.reduce((total, farmer) => total + farmer.owned * farmer.tapsPerSecPerHire, 0),
    [farmers],
  );

  // Calculate tap damage from weapon upgrades
  const tapDamage = useMemo(() => {
    const baseDamage = tapUpgrades.reduce(
      (total, upgrade) => total + upgrade.level * upgrade.dmgPerLevel,
      1,
    );

    // Farmers provide a smaller, linear tap bonus to avoid runaway scaling.
    const farmerBonusMultiplier = 1 + farmers.reduce((total, farmer) => total + farmer.owned * 0.02, 0);
    return Math.ceil(baseDamage * farmerBonusMultiplier);
  }, [tapUpgrades, farmers]);

  // Initialize boss HP on stage change
  useEffect(() => {
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

    const timerDuration = 30000;
    const timerId = setInterval(() => {
      const elapsed = Date.now() - bossTimerStartRef.current;
      const remaining = Math.max(0, 100 - (elapsed / timerDuration) * 100);

      setTimerPercent(remaining);

      if (remaining <= 0) {
        clearInterval(timerId);
        setCurrentStage((stage) => Math.max(1, stage - 1));
      }
    }, 50);

    return () => clearInterval(timerId);
  }, [currentStage, bossHP]);

  // Auto damage from farmers
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

        // Award coins per farmer hit based on damage
        const coinsPerHit = Math.floor(autoTapRate * 0.1);
        setCoins((c) => c + coinsPerHit);

        if (newHP <= 0) {
          // Stage complete, move to next
          setCurrentStage((stage) => stage + 1);
          setCoins((c) => c + Math.floor(maxHP * 2)); // Nerfed defeat reward
          return 0;
        }
        return newHP;
      });
    }, 1000);

    return () => clearInterval(autoTapTimer);
  }, [autoTapRate, maxHP]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 960px)');

    const updateLayout = () => {
      setIsDesktopLayout(mediaQuery.matches);
    };

    updateLayout();
    mediaQuery.addEventListener('change', updateLayout);

    return () => {
      mediaQuery.removeEventListener('change', updateLayout);
    };
  }, []);

  useEffect(() => {
    if (isDesktopLayout && activeItem === 'battle') {
      setActiveItem('tools');
    }
  }, [activeItem, isDesktopLayout]);

  const handleBuyUpgrade = (upgradeId) => {
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
  };

  const handleHireFarmer = (farmerId) => {
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
  };

  const handleTap = () => {
    if (bossHP <= 0) return;

    const damage = tapDamage;
    const newHP = bossHP - damage;
    const nextPercent = maxHP > 0 ? Math.max(0, (newHP / maxHP) * 100) : 0;

    setBossHP(newHP);
    hpTrailTargetRef.current = nextPercent;

    // Award coins per tap based on damage
    const coinsPerTap = Math.floor(damage * 0.1);
    setCoins((c) => c + coinsPerTap);

    if (newHP <= 0) {
      // Crop defeated, reward bonus coins and move to next stage
      setCurrentStage((stage) => stage + 1);
      setCoins((c) => c + Math.floor(maxHP * 2)); // Nerfed defeat reward
    }
  };

  const renderActiveScreen = () => {
    if (activeItem === 'battle') {
      return (
        <BattleSection
          stage={currentStage}
          bossHP={bossHP}
          maxHP={maxHP}
          crop={getCropByStage(currentStage)}
          onTap={handleTap}
          timerPercent={timerPercent}
          hpTrailPercent={hpTrailPercent}
        />
      );
    }

    if (activeItem === 'events') {
      return <EventSection />;
    }

    if (activeItem === 'farmers') {
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

    if (activeItem === 'leaderboards') {
      return <SimpleSection title="Leaderboards" message="Leaderboards section wireframe coming next." />;
    }

    return <SimpleSection title="Settings" message="Settings section wireframe coming next." />;
  };

  const renderDesktopLeftScreen = () => {
    if (activeItem === 'tools') {
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

    if (activeItem === 'farmers') {
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

    if (activeItem === 'leaderboards') {
      return <SimpleSection title="Leaderboards" message="Leaderboards section wireframe coming next." />;
    }

    if (activeItem === 'settings') {
      return <SimpleSection title="Settings" message="Settings section wireframe coming next." />;
    }

    return <EventSection />;
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={(user) => {
      setPlayerName(user.name || user.email);
      setIsLoggedIn(true);
    }} />;
  }

  if (isDesktopLayout) {
    return (
      <div className="wf-page">
        <SharedHeader coins={coins} fertilizer={fertilizer} activeItem={activeItem} managementTab={managementTab} />

        <main className="wf-play-panel wf-desktop-left-panel">{renderDesktopLeftScreen()}</main>

        <div className="wf-desktop-battle-panel">
          <BattleSection
            stage={currentStage}
            bossHP={bossHP}
            maxHP={maxHP}
            crop={getCropByStage(currentStage)}
            onTap={handleTap}
            timerPercent={timerPercent}
            hpTrailPercent={hpTrailPercent}
          />
        </div>

        <div className="wf-mobile-nav-wrap wf-desktop-nav-wrap">
          <SharedNavigation
            activeItem={activeItem}
            items={desktopNavItems}
            onSelect={(id) => {
              setActiveItem(id);

              if (id === 'tools') {
                setManagementTab('tools');
              }

              if (id === 'farmers') {
                setManagementTab('farmers');
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`wf-page${activeItem === 'battle' ? ' wf-page-battle' : ''}`}>
      <SharedHeader coins={coins} fertilizer={fertilizer} activeItem={activeItem} managementTab={managementTab} />

      <div className="wf-layout">
        <main className="wf-play-panel">{renderActiveScreen()}</main>
      </div>

      <div className="wf-mobile-nav-wrap">
        <SharedNavigation
          activeItem={activeItem}
          items={mobileNavItems}
          onSelect={(id) => {
            setActiveItem(id);

            if (id === 'farmers') {
              setManagementTab('tools');
            }
          }}
        />
      </div>
    </div>
  );
}

export default App;