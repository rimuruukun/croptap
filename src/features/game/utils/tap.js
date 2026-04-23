export function getTapDamage({ tapUpgrades = [], farmers = [] } = {}) {
  const baseDamage = tapUpgrades.reduce(
    (total, upgrade) => total + upgrade.level * upgrade.dmgPerLevel,
    1,
  );

  const farmerBonusMultiplier =
    1 + farmers.reduce((total, farmer) => total + farmer.owned * 0.02, 0);

  return Math.ceil(baseDamage * farmerBonusMultiplier);
}

export function resolveTapHit({ bossHP, maxHP, damage }) {
  const appliedDamage = Math.max(0, Math.floor(damage));
  const nextHP = Math.max(0, bossHP - appliedDamage);
  const nextPercent = maxHP > 0 ? Math.max(0, (nextHP / maxHP) * 100) : 0;

  return {
    damage: appliedDamage,
    nextHP,
    nextPercent,
    isDefeated: nextHP <= 0,
  };
}
