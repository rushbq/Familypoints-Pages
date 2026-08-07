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
  /** 真實照片（Wikimedia Commons），讓孩子認得野外看到的樣子 */
  photoUrl: string;
  /** 照片作者與授權，顯示於圖說 */
  photoCredit: string;
  /** Commons 檔案頁，提供完整授權資訊 */
  photoSourceUrl: string;
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
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Common_sunflower_%28Helianthus_annuus%29.jpg/960px-Common_sunflower_%28Helianthus_annuus%29.jpg',
    photoCredit: 'Dandy1022 / CC BY-SA 4.0',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Common_sunflower_(Helianthus_annuus).jpg',
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
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Cosmos_bipinnatus_pink%2C_Burdwan%2C_West_Bengal%2C_India_10_01_2013.jpg/960px-Cosmos_bipinnatus_pink%2C_Burdwan%2C_West_Bengal%2C_India_10_01_2013.jpg',
    photoCredit: 'Joydeep / CC BY-SA 3.0',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Cosmos_bipinnatus_pink,_Burdwan,_West_Bengal,_India_10_01_2013.jpg',
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
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Tagetes_erecta_26122014_%282%29.jpg/960px-Tagetes_erecta_26122014_%282%29.jpg',
    photoCredit: 'Joydeep / CC BY-SA 3.0',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Tagetes_erecta_26122014_(2).jpg',
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
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Zinnienbl%C3%BCte_Zinnia_elegans_stack15_20190722-RM-7222254.jpg/960px-Zinnienbl%C3%BCte_Zinnia_elegans_stack15_20190722-RM-7222254.jpg',
    photoCredit: 'Ermell / CC BY-SA 4.0',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Zinnienbl%C3%BCte_Zinnia_elegans_stack15_20190722-RM-7222254.jpg',
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
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Ipomoea_nil_Akatsukinoumi1.jpg/960px-Ipomoea_nil_Akatsukinoumi1.jpg',
    photoCredit: 'KENPEI / CC BY-SA 3.0',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Ipomoea_nil_Akatsukinoumi1.jpg',
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
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/3935_-_Chinesischer_Roseneibisch_%28Hibiscus_rosa-sinensis%29.JPG/960px-3935_-_Chinesischer_Roseneibisch_%28Hibiscus_rosa-sinensis%29.JPG',
    photoCredit: 'Tubifex / CC BY-SA 3.0',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:3935_-_Chinesischer_Roseneibisch_(Hibiscus_rosa-sinensis).JPG',
  },
  {
    id: 'dandelion',
    commonName: '蒲公英',
    scientificName: 'Taraxacum officinale F.H.Wigg.',
    familyName: '菊科',
    origin: '歐洲與亞洲溫帶地區，現已廣布世界',
    growthHabit: '多年生草本',
    identifyingFeature: '葉片貼地排成蓮座狀、邊緣有倒鉤狀缺刻，花莖中空折斷會流出白色乳汁。',
    childFact: '果實上有像小降落傘的冠毛，可以被風帶到很遠的地方才落地發芽。',
    sourceUrl: 'https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A1003018-2',
    flowerColor: '#F6C544',
    flowerAccent: '#D99A22',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Dandelion_flower_head_%282008-05-04_pic02%29.jpg/960px-Dandelion_flower_head_%282008-05-04_pic02%29.jpg',
    photoCredit: 'Steven Pavlov / CC BY-SA 4.0',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Dandelion_flower_head_(2008-05-04_pic02).jpg',
  },
  {
    id: 'tulip',
    commonName: '鬱金香',
    scientificName: 'Tulipa gesneriana L.',
    familyName: '百合科',
    origin: '中亞至土耳其一帶的栽培族群',
    growthHabit: '多年生球根草本',
    identifyingFeature: '花朵呈杯狀，由 6 枚花被片組成；葉片寬長、帶灰綠色。',
    childFact: '鬱金香靠地下的鱗莖（球根）把養分存起來過冬，天氣回暖才抽出花莖開花。',
    sourceUrl: 'https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A542923-1',
    flowerColor: '#E4586B',
    flowerAccent: '#B8354F',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Tulipe_des_jardins_-_Tulipa_gesneriana.jpg/960px-Tulipe_des_jardins_-_Tulipa_gesneriana.jpg',
    photoCredit: 'JackyM59 / CC BY-SA 4.0',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Tulipe_des_jardins_-_Tulipa_gesneriana.jpg',
  },
  {
    id: 'rose',
    commonName: '月季（玫瑰）',
    scientificName: 'Rosa chinensis Jacq.',
    familyName: '薔薇科',
    origin: '中國',
    growthHabit: '常綠至半常綠灌木',
    identifyingFeature: '莖上有皮刺，葉子是羽狀複葉，花瓣一層一層向內排列。',
    childFact: '莖上的「刺」其實是表皮長出來的皮刺，輕輕一撥就能剝下來，和真正的刺不一樣。',
    sourceUrl: 'https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A732029-1',
    flowerColor: '#E4607F',
    flowerAccent: '#B8385A',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Rosa_chinensis.jpg/960px-Rosa_chinensis.jpg',
    photoCredit: 'Sakurai Midori / CC BY-SA 3.0',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Rosa_chinensis.jpg',
  },
  {
    id: 'hydrangea',
    commonName: '繡球花',
    scientificName: 'Hydrangea macrophylla (Thunb.) Ser.',
    familyName: '繡球花科',
    origin: '日本',
    growthHabit: '落葉灌木',
    identifyingFeature: '葉片大而對生、邊緣有鋸齒，許多花聚成半球形的大花序。',
    childFact: '看起來像花瓣的部分其實是萼片；土壤偏酸時常偏藍色，偏鹼時常偏粉紅色。',
    sourceUrl: 'https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A791637-1',
    flowerColor: '#7EA8E0',
    flowerAccent: '#A98FD6',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/%28Natural%29_Hydrangea_macrophylla%2C_Iwafune%2C_Isumi%2C_Chiba%2C_Japan_2.jpg/960px-%28Natural%29_Hydrangea_macrophylla%2C_Iwafune%2C_Isumi%2C_Chiba%2C_Japan_2.jpg',
    photoCredit: 'belvedere04 / CC BY 4.0',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:(Natural)_Hydrangea_macrophylla,_Iwafune,_Isumi,_Chiba,_Japan_2.jpg',
  },
  {
    id: 'moth-orchid',
    commonName: '蝴蝶蘭',
    scientificName: 'Phalaenopsis aphrodite Rchb.f.',
    familyName: '蘭科',
    origin: '台灣與菲律賓',
    growthHabit: '多年生附生蘭',
    identifyingFeature: '花朵左右對稱，中央有一片形狀特別的唇瓣；葉片厚實，根會露在外面。',
    childFact: '蝴蝶蘭是附生植物，粗白的根攀在樹皮上吸收空氣中的水分，並不是長在土裡。',
    sourceUrl: 'https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A650507-1',
    flowerColor: '#FBF1F7',
    flowerAccent: '#D9A7C7',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Phalaenopsis_aphrodite_Orchi_0047.jpg/960px-Phalaenopsis_aphrodite_Orchi_0047.jpg',
    photoCredit: 'Orchi / CC BY-SA 3.0',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Phalaenopsis_aphrodite_Orchi_0047.jpg',
  },
  {
    id: 'lavender',
    commonName: '薰衣草',
    scientificName: 'Lavandula angustifolia Mill.',
    familyName: '唇形科',
    origin: '地中海地區',
    growthHabit: '多年生亞灌木',
    identifyingFeature: '莖的橫切面是四方形，葉片細長，紫色小花排成長長的穗狀花序。',
    childFact: '輕輕搓一下葉子就會聞到香氣，那是葉片表面的腺毛釋放出來的精油。',
    sourceUrl: 'https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A449008-1',
    flowerColor: '#9280CC',
    flowerAccent: '#6C57A8',
    photoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Lavandula_angustifolia_lavender_Lavendel_01.jpg/960px-Lavandula_angustifolia_lavender_Lavendel_01.jpg',
    photoCredit: 'Norbert Nagel / CC BY-SA 3.0',
    photoSourceUrl: 'https://commons.wikimedia.org/wiki/File:Lavandula_angustifolia_lavender_Lavendel_01.jpg',
  },
];

export const DEFAULT_GARDEN_SPECIES_ID = GARDEN_SPECIES[0].id;

type FamilyGardenInput = Partial<Omit<FamilyGardenState, 'version'>> & { version?: number };

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
  version: 2,
  pointsPerWatering: 20,
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
  input: FamilyGardenInput | null | undefined,
  users: User[],
): FamilyGardenState => {
  if (!input || (input.version !== 1 && input.version !== 2)) {
    return createInitialFamilyGarden(users);
  }

  const pointsPerWatering = input.version === 1
    ? 20
    : Math.max(1, toNonNegativeInteger(input.pointsPerWatering) || 20);
  const legacyPointsPerWatering = Math.max(1, toNonNegativeInteger(input.pointsPerWatering) || 100);
  const wateringsToBloom = Math.max(1, toNonNegativeInteger(input.wateringsToBloom) || 5);
  const progressMap = new Map<string, GardenChildProgress>();

  (input.childProgress ?? []).forEach((progress) => {
    if (!progress?.childId) return;
    const earnedPositivePoints = toNonNegativeInteger(progress.earnedPositivePoints);
    const migratedPositivePoints = input.version === 1
      ? Math.floor(earnedPositivePoints / legacyPointsPerWatering) * pointsPerWatering
        + Math.floor((earnedPositivePoints % legacyPointsPerWatering) / legacyPointsPerWatering * pointsPerWatering)
      : earnedPositivePoints;
    progressMap.set(progress.childId, {
      childId: progress.childId,
      earnedPositivePoints: migratedPositivePoints,
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
    version: 2,
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
