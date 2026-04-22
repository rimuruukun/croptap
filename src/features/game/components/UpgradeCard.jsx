import { formatCompact, getBatchCost, getPurchasePlan } from "../utils/economy";

function UpgradeCard({ item, coins, quantity, actionLabel, onAction }) {
  const plan = getPurchasePlan({
    price: item.price,
    growth: item.growth,
    coins,
    quantity,
  });

  const selectedQuantity = quantity === "max" ? plan.purchased : quantity;
  const priceLabel =
    quantity === "max"
      ? formatCompact(plan.totalCost || item.price)
      : formatCompact(getBatchCost(item.price, item.growth, quantity));
  const buyLabel = `Buy x${selectedQuantity}`;
  const canAfford =
    quantity === "max" ? plan.purchased > 0 : plan.purchased === quantity;

  return (
    <article className="wf-upgrade-card">
      <img
        src={`/assets/weapons/${item.id}.png`}
        alt={item.name}
        className="wf-tool-icon"
      />

      <div className="wf-upgrade-info">
        <h3>{item.name}</h3>
        {"dmgPerLevel" in item ? (
          <p>+{formatCompact(item.dmgPerLevel)} tap dmg</p>
        ) : (
          <p>+{Math.floor(item.tapsPerSecPerHire)} taps/sec</p>
        )}
        {"level" in item ? (
          <p>Level: {item.level}</p>
        ) : (
          <p>Owned: {item.owned}</p>
        )}
      </div>

      <div className="wf-upgrade-cta">
        <strong>{priceLabel}</strong>
        <button
          type="button"
          onClick={() => onAction(item.id)}
          disabled={!canAfford}
        >
          {buyLabel}
        </button>
      </div>
    </article>
  );
}

export default UpgradeCard;
