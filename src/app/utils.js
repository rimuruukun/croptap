export function getPurchasePlan({ price, growth, coins, quantity }) {
  const purchaseLimit = quantity === 'max' ? Number.MAX_SAFE_INTEGER : quantity;
  let purchased = 0;
  let totalCost = 0;
  let nextPrice = price;
  let remainingCoins = coins;

  while (purchased < purchaseLimit && remainingCoins >= nextPrice) {
    remainingCoins -= nextPrice;
    totalCost += nextPrice;
    purchased += 1;
    nextPrice = Math.ceil(nextPrice * growth);
  }

  return {
    purchased,
    totalCost,
    nextPrice,
  };
}

export function getBatchCost(price, growth, quantity) {
  if (quantity === 'max') {
    return 0;
  }

  let totalCost = 0;
  let currentPrice = price;

  for (let index = 0; index < quantity; index += 1) {
    totalCost += currentPrice;
    currentPrice = Math.ceil(currentPrice * growth);
  }

  return totalCost;
}

export function formatCompact(value) {
  const absoluteValue = Math.floor(Math.abs(value));
  const sign = value < 0 ? '-' : '';

  if (absoluteValue < 1000) {
    return `${sign}${absoluteValue}`;
  }

  const scales = [
    { threshold: 1_000_000_000_000, suffix: 'T' },
    { threshold: 1_000_000_000, suffix: 'B' },
    { threshold: 1_000_000, suffix: 'M' },
    { threshold: 1_000, suffix: 'K' },
  ];

  for (const { threshold, suffix } of scales) {
    if (absoluteValue >= threshold) {
      const scaled = absoluteValue / threshold;
      // Show one decimal place only if it's meaningful (not .0)
      const formatted = scaled % 1 === 0 ? Math.floor(scaled) : scaled.toFixed(1);
      return `${sign}${formatted}${suffix}`;
    }
  }

  return `${sign}${absoluteValue}`;
}