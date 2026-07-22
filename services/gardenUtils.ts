import {
  FamilyGardenState,
  GardenChildProgress,
  GardenPlantCycle,
  User,
  UserRole,
} from '../types';

export interface GardenSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  familyName: string;
  origin: string;
  growthHabit: string;
  identifyingFeature: string;
  childFact: string;
  sourceUrl: string;
  flowerColor: string;
  flowerAccent: string;
}

export const GARDEN_SPECIES: GardenSpecies[] = [
  {
    id: 'sunflower',
    commonName: '向日葵',
    scientificName: 'Helianthus annuus L.',
    familyName: '菊科',
    origin: '美國西南部至墨西哥',
    growthHabit: '一年生草本',
    identifyingFeature: '黃色舌狀花圍繞深色中央花盤，葉片寬大。',
    childFact: '中央花盤其實是許多小花排在一起；年輕花苞也會隨日照方向轉動。',
    sourceUrl: 'https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A119003-2',
    flowerColor: '#F6C544',
    flowerAccent: '#6B4A24',
  },
  {
    id: 'cosmos',
    commonName: '大波斯菊',
    scientificName: 'Cosmos bipinnatus Cav.',
    familyName: '菊科',
    origin: '墨西哥',
    growthHabit: '一年生草本',
    identifyingFeature: '葉片細細分裂，花朵外圍的舌狀花排列整齊。',
    childFact: '細裂的葉片看起來像柔軟羽毛，和寬大的向日葵葉片很不一樣。',
    sourceUrl: 'https://powo.science.kew.org/taxon/198320-1',
    flowerColor: '#F4A6C1',
    flowerAccent: '#F6C544',
  },
  {
    id: 'marigold',
    commonName: '萬壽菊',
    scientificName: 'Tagetes erecta L.',
    familyName: '菊科',
    origin: '墨西哥至瓜地馬拉',
    growthHabit: '一年生草本',
    identifyingFeature: '黃色或橙色的小花密集集合，形成飽滿的球狀花序。',
    childFact: '看起來像一大朵的花，其實也是由許多小花緊密組合而成。',
    sourceUrl: 'https://powo.science.kew.org/taxon/252092-1',
    flowerColor: '#F0A24A',
    flowerAccent: '#B96828',
  },
  {
    id: 'zinnia',
    commonName: '百日草',
    scientificName: 'Zinnia elegans Jacq.',
    familyName: '菊科',
    origin: '墨西哥至尼加拉瓜',
    growthHabit: '一年生草本',
    identifyingFeature: '葉片成對排列，花序層次清楚，園藝品種有許多花色。',
    childFact: '百日草常被栽培成不同顏色，但成對生長的葉片是重要線索。',
    sourceUrl: 'https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A261331-1',
    flowerColor: '#E76F67',
    flowerAccent: '#F6D96B',
  },
  {
    id: 'morning-glory',
    commonName: '牽牛花',
    scientificName: 'Ipomoea nil (L.) Roth',
    familyName: '旋花科',
    origin: '熱帶及亞熱帶美洲',
    growthHabit: '一年生攀緣植物',
    identifyingFeature: '莖會纏繞攀爬，花冠呈藍紫色漏斗狀。',
    childFact: '牽牛花會利用纏繞的莖向上攀爬，不需要長出像手一樣的構造。',
    sourceUrl: 'https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A1071575-2/general-information',
    flowerColor: '#7887D8',
    flowerAccent: '#F7F4FF',
  },
  {
    id: 'hibiscus',
    commonName: '朱槿',
    scientificName: 'Hibiscus × rosa-sinensis L.',
    familyName: '錦葵科',
    origin: '南太平洋園藝雜交栽培植物',
    growthHabit: '熱帶灌木',
    identifyingFeature: '大型五瓣花中央有一根明顯伸出的雄蕊柱。',
    childFact: '朱槿有許多園藝花色，但伸出花朵中央的長雄蕊柱很容易辨認。',
    sourceUrl: 'https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A560756-1',
    flowerColor: '#E76F67',
    flowerAccent: '#B83E45',
  },
];

export const DEFAULT_GARDEN_SPECIES_ID = GARDEN_SPECIES[0].id;

export const getGardenSpecies = (speciesId: string): GardenSpecies =>
  GARDEN_SPECIES.find((species) => species.id === speciesId) ?? GARDEN_SPECIES[0];

const toNonNegativeInteger = (value: unknown): number => {
  const numericValue = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.floor(numericValue));
};

const createChildProgress = (childId: string): GardenChildProgress => ({
  childId,
  earnedPositivePoints: 0,
  usedWaterings: 0,
});

export const createInitialFamilyGarden = (
  users: User[],
  timestamp: number = Date.now(),
): FamilyGardenState => ({
  version: 1,
  pointsPerWatering: 100,
  wateringsToBloom: 5,
  activePlantId: timestamp.toString(),
  childProgress: users
    .filter((user) => user.role === UserRole.CHILD)
    .map((child) => createChildProgress(child.id)),
  plants: [
    {
      id: timestamp.toString(),
      speciesId: DEFAULT_GARDEN_SPECIES_ID,
      startedAt: timestamp,
      completedAt: null,
      waterings: [],
    },
  ],
});

export const normalizeFamilyGarden = (
  input: Partial<FamilyGardenState> | null | undefined,
  users: User[],
): FamilyGardenState => {
  if (!input || input.version !== 1) {
    return createInitialFamilyGarden(users);
  }

  const pointsPerWatering = Math.max(1, toNonNegativeInteger(input.pointsPerWatering) || 100);
  const wateringsToBloom = Math.max(1, toNonNegativeInteger(input.wateringsToBloom) || 5);
  const progressMap = new Map<string, GardenChildProgress>();

  (input.childProgress ?? []).forEach((progress) => {
    if (!progress?.childId) return;
    progressMap.set(progress.childId, {
      childId: progress.childId,
      earnedPositivePoints: toNonNegativeInteger(progress.earnedPositivePoints),
      usedWaterings: toNonNegativeInteger(progress.usedWaterings),
    });
  });

  users
    .filter((user) => user.role === UserRole.CHILD)
    .forEach((child) => {
      if (!progressMap.has(child.id)) {
        progressMap.set(child.id, createChildProgress(child.id));
      }
    });

  const plants: GardenPlantCycle[] = (input.plants ?? [])
    .filter((plant): plant is GardenPlantCycle => Boolean(plant?.id))
    .map((plant) => {
      const waterings = (plant.waterings ?? [])
        .filter((event) => Boolean(event?.id && event.childId))
        .slice(0, wateringsToBloom)
        .map((event) => ({
          id: event.id,
          childId: event.childId,
          childName: event.childName || users.find((user) => user.id === event.childId)?.name || '家庭成員',
          wateredAt: toNonNegativeInteger(event.wateredAt) || Date.now(),
        }));
      const isComplete = waterings.length >= wateringsToBloom;

      return {
        id: plant.id,
        speciesId: getGardenSpecies(plant.speciesId).id,
        startedAt: toNonNegativeInteger(plant.startedAt) || Date.now(),
        completedAt: isComplete
          ? toNonNegativeInteger(plant.completedAt) || waterings[waterings.length - 1]?.wateredAt || Date.now()
          : null,
        waterings,
      };
    });

  if (plants.length === 0) {
    return createInitialFamilyGarden(users);
  }

  const activePlantId = plants.some((plant) => plant.id === input.activePlantId)
    ? input.activePlantId
    : plants[plants.length - 1].id;

  return {
    version: 1,
    pointsPerWatering,
    wateringsToBloom,
    activePlantId,
    childProgress: Array.from(progressMap.values()),
    plants,
  };
};

export const getActiveGardenPlant = (garden: FamilyGardenState): GardenPlantCycle | null =>
  garden.plants.find((plant) => plant.id === garden.activePlantId) ?? null;

export const isGardenPlantBloomed = (
  plant: GardenPlantCycle | null,
  garden: FamilyGardenState,
): boolean => Boolean(plant && plant.waterings.length >= garden.wateringsToBloom);

export const getGardenChildProgress = (
  garden: FamilyGardenState,
  childId: string,
): GardenChildProgress => garden.childProgress.find((progress) => progress.childId === childId)
  ?? createChildProgress(childId);

export const getAvailableGardenWaterings = (
  garden: FamilyGardenState,
  childId: string,
): number => {
  const progress = getGardenChildProgress(garden, childId);
  return Math.max(
    0,
    Math.floor(progress.earnedPositivePoints / garden.pointsPerWatering) - progress.usedWaterings,
  );
};

export const getGardenPointsTowardNextWatering = (
  garden: FamilyGardenState,
  childId: string,
): number => getGardenChildProgress(garden, childId).earnedPositivePoints % garden.pointsPerWatering;

export const getGardenPointsUntilNextWatering = (
  garden: FamilyGardenState,
  childId: string,
): number => {
  if (getAvailableGardenWaterings(garden, childId) > 0) return 0;
  const currentPoints = getGardenPointsTowardNextWatering(garden, childId);
  return currentPoints === 0 ? garden.pointsPerWatering : garden.pointsPerWatering - currentPoints;
};

export const addGardenPositivePoints = (
  garden: FamilyGardenState,
  childId: string,
  points: number,
): FamilyGardenState => {
  const safePoints = toNonNegativeInteger(points);
  if (safePoints === 0) return garden;

  const existingProgress = garden.childProgress.find((progress) => progress.childId === childId);
  const nextProgress = existingProgress
    ? garden.childProgress.map((progress) => progress.childId === childId
      ? { ...progress, earnedPositivePoints: progress.earnedPositivePoints + safePoints }
      : progress)
    : [...garden.childProgress, { ...createChildProgress(childId), earnedPositivePoints: safePoints }];

  return { ...garden, childProgress: nextProgress };
};

export interface WaterGardenResult {
  garden: FamilyGardenState;
  didWater: boolean;
  didBloom: boolean;
}

export const waterFamilyGarden = (
  garden: FamilyGardenState,
  child: User,
  eventId: string,
  timestamp: number = Date.now(),
): WaterGardenResult => {
  const activePlant = getActiveGardenPlant(garden);
  if (
    child.role !== UserRole.CHILD
    || !activePlant
    || isGardenPlantBloomed(activePlant, garden)
    || getAvailableGardenWaterings(garden, child.id) < 1
  ) {
    return { garden, didWater: false, didBloom: false };
  }

  const nextWaterings = [
    ...activePlant.waterings,
    { id: eventId, childId: child.id, childName: child.name, wateredAt: timestamp },
  ];
  const didBloom = nextWaterings.length >= garden.wateringsToBloom;

  return {
    garden: {
      ...garden,
      childProgress: garden.childProgress.map((progress) => progress.childId === child.id
        ? { ...progress, usedWaterings: progress.usedWaterings + 1 }
        : progress),
      plants: garden.plants.map((plant) => plant.id === activePlant.id
        ? {
            ...plant,
            waterings: nextWaterings,
            completedAt: didBloom ? timestamp : null,
          }
        : plant),
    },
    didWater: true,
    didBloom,
  };
};

export const startFamilyGardenPlant = (
  garden: FamilyGardenState,
  speciesId: string,
  plantId: string,
  timestamp: number = Date.now(),
): FamilyGardenState => {
  const activePlant = getActiveGardenPlant(garden);
  if (activePlant && !isGardenPlantBloomed(activePlant, garden)) return garden;

  const newPlant: GardenPlantCycle = {
    id: plantId,
    speciesId: getGardenSpecies(speciesId).id,
    startedAt: timestamp,
    completedAt: null,
    waterings: [],
  };

  return {
    ...garden,
    activePlantId: newPlant.id,
    plants: [...garden.plants, newPlant],
  };
};

export const getGardenContributions = (plant: GardenPlantCycle | null): Map<string, number> => {
  const contributions = new Map<string, number>();
  plant?.waterings.forEach((watering) => {
    contributions.set(watering.childId, (contributions.get(watering.childId) ?? 0) + 1);
  });
  return contributions;
};

export const isCooperativeBloom = (plant: GardenPlantCycle): boolean =>
  new Set(plant.waterings.map((watering) => watering.childId)).size >= 2;

export const getGardenCollectionCount = (
  garden: FamilyGardenState,
  speciesId: string,
): number => garden.plants.filter((plant) => (
  plant.speciesId === speciesId
  && isGardenPlantBloomed(plant, garden)
)).length;
