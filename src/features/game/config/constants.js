export const sectionPathById = Object.freeze({
  battle: "/battle",
  events: "/events",
  farmers: "/farmers",
  leaderboards: "/leaderboards",
  settings: "/settings",
  tools: "/tools",
});

export const sectionIdByPath = Object.freeze(
  Object.fromEntries(
    Object.entries(sectionPathById).map(([sectionId, path]) => [
      path,
      sectionId,
    ]),
  ),
);

export const loginRoutePath = "/login";
export const defaultMobileSectionId = "battle";
export const defaultDesktopSectionId = "tools";

export const defaultMobileRoutePath = sectionPathById[defaultMobileSectionId];
export const defaultDesktopRoutePath = sectionPathById[defaultDesktopSectionId];

export function getPathForSection(sectionId) {
  return sectionPathById[sectionId] ?? defaultMobileRoutePath;
}

export function getSectionForPath(pathname) {
  return sectionIdByPath[pathname] ?? defaultMobileSectionId;
}

export const mobileNavItems = [
  { id: "events", label: "Events" },
  { id: "farmers", label: "Farmers" },
  { id: "battle", label: "Main Battle" },
  { id: "leaderboards", label: "Leaderboards" },
  { id: "settings", label: "Settings" },
];

export const desktopNavItems = [
  { id: "tools", label: "Tools" },
  { id: "farmers", label: "Farmers" },
  { id: "events", label: "Events" },
  { id: "leaderboards", label: "Leaderboards" },
  { id: "settings", label: "Settings" },
];

export const initialTapUpgrades = [
  // Tier A (Weak) - Basic Tools - Lower efficiency
  {
    id: "handforkA",
    name: "Wooden Handfork",
    dmgPerLevel: 3,
    level: 0,
    price: 200,
    growth: 1.18,
  },
  {
    id: "trowelA",
    name: "Simple Trowel",
    dmgPerLevel: 35,
    level: 0,
    price: 2200,
    growth: 1.18,
  },
  {
    id: "axeA",
    name: "Crude Axe",
    dmgPerLevel: 70,
    level: 0,
    price: 4800,
    growth: 1.18,
  },
  {
    id: "rakeA",
    name: "Simple Rake",
    dmgPerLevel: 120,
    level: 0,
    price: 9500,
    growth: 1.18,
  },
  {
    id: "hoeA",
    name: "Garden Hoe",
    dmgPerLevel: 200,
    level: 0,
    price: 18000,
    growth: 1.18,
  },
  {
    id: "scytheA",
    name: "Harvest Scythe",
    dmgPerLevel: 350,
    level: 0,
    price: 35000,
    growth: 1.18,
  },

  // Tier B (Medium) - Improved Tools - Better efficiency
  {
    id: "handforkB",
    name: "Hardened Handfork",
    dmgPerLevel: 1500,
    level: 0,
    price: 80000,
    growth: 1.18,
  },
  {
    id: "trowelB",
    name: "Quality Trowel",
    dmgPerLevel: 2400,
    level: 0,
    price: 140000,
    growth: 1.18,
  },
  {
    id: "axeB",
    name: "Standard Axe",
    dmgPerLevel: 3800,
    level: 0,
    price: 240000,
    growth: 1.18,
  },
  {
    id: "knife",
    name: "Cutting Blade",
    dmgPerLevel: 9000,
    level: 0,
    price: 600000,
    growth: 1.18,
  },

  // Unique Tools - Moved next to Cutting Blade
  {
    id: "sickle",
    name: "Sickle",
    dmgPerLevel: 355000,
    level: 0,
    price: 16000000,
    growth: 1.18,
  },
  {
    id: "pitchfork",
    name: "Pitchfork",
    dmgPerLevel: 550000,
    level: 0,
    price: 25000000,
    growth: 1.18,
  },

  // Tier C (Strong) - Reinforced Tools - Best efficiency
  {
    id: "rakeB",
    name: "Reinforced Rake",
    dmgPerLevel: 13500,
    level: 0,
    price: 750000,
    growth: 1.18,
  },
  {
    id: "hoeB",
    name: "Reinforced Hoe",
    dmgPerLevel: 21000,
    level: 0,
    price: 1150000,
    growth: 1.18,
  },
  {
    id: "handforkC",
    name: "Reinforced Handfork",
    dmgPerLevel: 65000,
    level: 0,
    price: 3300000,
    growth: 1.18,
  },
  {
    id: "scytheB",
    name: "Reinforced Scythe",
    dmgPerLevel: 100000,
    level: 0,
    price: 5000000,
    growth: 1.18,
  },
  {
    id: "trowelC",
    name: "Reinforced Trowel",
    dmgPerLevel: 150000,
    level: 0,
    price: 7500000,
    growth: 1.18,
  },
  {
    id: "axeC",
    name: "Reinforced Axe",
    dmgPerLevel: 550000,
    level: 0,
    price: 25000000,
    growth: 1.18,
  },
];

export const initialFarmers = [
  {
    id: "worker",
    name: "Field Worker",
    tapsPerSecPerHire: 1.2,
    owned: 0,
    price: 180,
    growth: 1.2,
  },
  {
    id: "planter",
    name: "Seed Planter",
    tapsPerSecPerHire: 3.8,
    owned: 0,
    price: 760,
    growth: 1.2,
  },
  {
    id: "harvester",
    name: "Crop Harvester",
    tapsPerSecPerHire: 10.5,
    owned: 0,
    price: 2800,
    growth: 1.2,
  },
  {
    id: "tractor",
    name: "Mini Tractor",
    tapsPerSecPerHire: 24.0,
    owned: 0,
    price: 9400,
    growth: 1.2,
  },
];

export const buyOptions = [1, 10, 100, "max"];
