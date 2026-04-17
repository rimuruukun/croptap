import QuantityControls from '../components/QuantityControls';
import SectionSwitch from '../components/SectionSwitch';
import UpgradeCard from '../components/UpgradeCard';
import { formatCompact } from '../utils';

function ManagementSection({
  activeTab,
  onTabChange,
  showSwitch = true,
  upgrades,
  farmers,
  coins,
  quantity,
  onQuantityChange,
  onBuy,
  onHire,
  autoTapRate,
}) {
  const isTools = activeTab === 'tools';

  const totalTapDamage = upgrades.reduce((total, upgrade) => total + upgrade.dmgPerLevel * upgrade.level, 0);
  const totalAutoTapRate = Math.floor(autoTapRate);

  return (
    <section className="wf-upgrades wf-management" aria-label="Management">
      <div className="wf-upgrades-header">
        {isTools ? (
          <>
            <p className="wf-upgrade-description">Upgrade tools to increase tap damage</p>
            <p className="wf-upgrade-stat">Tap damage: {formatCompact(totalTapDamage)}</p>
          </>
        ) : (
          <>
            <p className="wf-upgrade-description">Hire farmers to increase auto tap per second</p>
            <p className="wf-upgrade-stat">Auto-tap/sec: {formatCompact(totalAutoTapRate)}</p>
          </>
        )}
        <QuantityControls quantity={quantity} onChange={onQuantityChange} />
      </div>

      <div className="wf-upgrade-list">
        {isTools
          ? upgrades.map((upgrade) => (
              <UpgradeCard
                key={upgrade.id}
                item={upgrade}
                coins={coins}
                quantity={quantity}
                actionLabel="Buy"
                onAction={onBuy}
              />
            ))
          : farmers.map((farmer) => (
              <UpgradeCard
                key={farmer.id}
                item={farmer}
                coins={coins}
                quantity={quantity}
                actionLabel="Hire"
                onAction={onHire}
              />
            ))}
      </div>

      {showSwitch ? <SectionSwitch activeTab={activeTab} onChange={onTabChange} /> : null}
    </section>
  );
}

export default ManagementSection;