export function getTapDamage({ tapUpgrades = [], farmers = [] } = {}) {
  const baseDamage = tapUpgrades.reduce(
    (total, upgrade) => total + upgrade.level * upgrade.dmgPerLevel,
    1,
  );

  const farmerBonusMultiplier =
    1 + farmers.reduce((total, farmer) => total + farmer.owned * 0.02, 0);

  return Math.ceil(baseDamage * farmerBonusMultiplier);
}

export function resolveTapHit({
  bossHP,
  maxHP,
  damage,
  critChance = 0.05,
  critBonus = 0.3,
  random = Math.random,
} = {}) {
  const baseDamage = Math.max(0, Math.floor(damage));
  const isCrit = random() < critChance;
  const appliedDamage = isCrit
    ? Math.max(1, Math.ceil(baseDamage * (1 + critBonus)))
    : baseDamage;
  const nextHP = Math.max(0, bossHP - appliedDamage);
  const nextPercent = maxHP > 0 ? Math.max(0, (nextHP / maxHP) * 100) : 0;

  return {
    damage: appliedDamage,
    baseDamage,
    critDamage: Math.max(0, appliedDamage - baseDamage),
    isCrit,
    nextHP,
    nextPercent,
    isDefeated: nextHP <= 0,
  };
}
