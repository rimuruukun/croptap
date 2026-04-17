// Crop data with specialization for tools
export const CROPS = {
  strawberry: {
    id: 'strawberry',
    name: 'Strawberry',
    image: '/assets/crops/strawberry.png',
    family: 'berry',
    baseHP: 100,
    bossMultiplier: 1.0,
  },
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    image: '/assets/crops/wheat.png',
    family: 'grain',
    baseHP: 150,
    bossMultiplier: 1.2,
  },
  corn: {
    id: 'corn',
    name: 'Corn',
    image: '/assets/crops/corn.png',
    family: 'grain',
    baseHP: 140,
    bossMultiplier: 1.15,
  },
  potato: {
    id: 'potato',
    name: 'Potato',
    image: '/assets/crops/potato.png',
    family: 'underground',
    baseHP: 160,
    bossMultiplier: 1.25,
  },
  beetroot: {
    id: 'beetroot',
    name: 'Beetroot',
    image: '/assets/crops/beetroot.png',
    family: 'underground',
    baseHP: 155,
    bossMultiplier: 1.2,
  },
  carrot: {
    id: 'carrot',
    name: 'Carrot',
    image: '/assets/crops/carrot.png',
    family: 'underground',
    baseHP: 150,
    bossMultiplier: 1.18,
  },
  turnip: {
    id: 'turnip',
    name: 'Turnip',
    image: '/assets/crops/turnip.png',
    family: 'underground',
    baseHP: 145,
    bossMultiplier: 1.15,
  },
  ginger: {
    id: 'ginger',
    name: 'Ginger',
    image: '/assets/crops/ginger.png',
    family: 'underground',
    baseHP: 140,
    bossMultiplier: 1.12,
  },
  peanut: {
    id: 'peanut',
    name: 'Peanut',
    image: '/assets/crops/peanut.png',
    family: 'legume',
    baseHP: 130,
    bossMultiplier: 1.1,
  },
  peapod: {
    id: 'peapod',
    name: 'Pea Pod',
    image: '/assets/crops/peapod.png',
    family: 'legume',
    baseHP: 125,
    bossMultiplier: 1.08,
  },
  peas: {
    id: 'peas',
    name: 'Peas',
    image: '/assets/crops/peas.png',
    family: 'legume',
    baseHP: 120,
    bossMultiplier: 1.05,
  },
  lettuce: {
    id: 'lettuce',
    name: 'Lettuce',
    image: '/assets/crops/lettuce.png',
    family: 'vegetable',
    baseHP: 110,
    bossMultiplier: 1.0,
  },
  bellpepper: {
    id: 'bellpepper',
    name: 'Bell Pepper',
    image: '/assets/crops/bellpepper.png',
    family: 'vegetable',
    baseHP: 115,
    bossMultiplier: 1.05,
  },
  eggplant: {
    id: 'eggplant',
    name: 'Eggplant',
    image: '/assets/crops/eggplant.png',
    family: 'vegetable',
    baseHP: 130,
    bossMultiplier: 1.1,
  },
  bokchoy: {
    id: 'bokchoy',
    name: 'Bok Choy',
    image: '/assets/crops/bokchoy.png',
    family: 'vegetable',
    baseHP: 105,
    bossMultiplier: 0.98,
  },
  stringbean: {
    id: 'stringbean',
    name: 'String Bean',
    image: '/assets/crops/stringbean.png',
    family: 'legume',
    baseHP: 115,
    bossMultiplier: 1.06,
  },
  watermelon: {
    id: 'watermelon',
    name: 'Watermelon',
    image: '/assets/crops/watermelon.png',
    family: 'berry',
    baseHP: 180,
    bossMultiplier: 1.3,
  },
  pineapple: {
    id: 'pineapple',
    name: 'Pineapple',
    image: '/assets/crops/pineapple.png',
    family: 'berry',
    baseHP: 170,
    bossMultiplier: 1.25,
  },
  orange: {
    id: 'orange',
    name: 'Orange',
    image: '/assets/crops/orange.png',
    family: 'fruit',
    baseHP: 135,
    bossMultiplier: 1.12,
  },
  cauliflower: {
    id: 'cauliflower',
    name: 'Cauliflower',
    image: '/assets/crops/cauliflower.png',
    family: 'vegetable',
    baseHP: 125,
    bossMultiplier: 1.08,
  },
  aloevera: {
    id: 'aloevera',
    name: 'Aloe Vera',
    image: '/assets/crops/aloevera.png',
    family: 'plant',
    baseHP: 100,
    bossMultiplier: 0.95,
  },
};

export const CROP_IDS = Object.keys(CROPS);

export function getCropByStage(stage) {
  const cropIndex = (stage - 1) % CROP_IDS.length;
  return CROPS[CROP_IDS[cropIndex]];
}

export function getCropHP(stage) {
  const crop = getCropByStage(stage);
  const isBoss = stage % 10 === 0;
  // Steep scaling (1.18) with lower starting base (500) for easier early progression
  const stageBaseHP = 500 * Math.pow(1.18, stage - 1);
  const cropWeight = 1 + ((crop.baseHP - 130) / 130) * 0.08;
  const hp = stageBaseHP * cropWeight;

  return Math.floor(isBoss ? hp * crop.bossMultiplier : hp);
}
