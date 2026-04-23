export function getEnemyDrops({
  maxHP,
  stage,
  baseCoinMultiplier = 1,
  bossCoinMultiplier = 1,
}) {
  const safeMaxHP = Math.max(0, Math.floor(Number(maxHP) || 0));
  const safeStage = Math.max(1, Math.floor(Number(stage) || 1));
  const isBossStage = safeStage % 10 === 0;

  const totalCoinMultiplier =
    baseCoinMultiplier * (isBossStage ? bossCoinMultiplier : 1);

  const coins = Math.max(0, Math.floor(safeMaxHP * totalCoinMultiplier));

  return {
    coins,
  };
}
