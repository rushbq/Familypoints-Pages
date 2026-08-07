import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FamilyGardenState, User, UserRole } from '../types';
import {
  getActiveGardenPlant,
  getAvailableGardenWaterings,
  getGardenChildProgress,
  getGardenContributions,
  getGardenPointsTowardNextWatering,
  getGardenPointsUntilNextWatering,
  getGardenSpecies,
  isCooperativeBloom,
  isGardenPlantBloomed,
} from '../services/gardenUtils';
import { Button } from './ui/Button';
import { GardenAlbum } from './GardenAlbum';
import { GardenPlant } from './GardenPlant';
import { getGardenScene } from './GardenScene';
import { Icons } from './Icons';

interface FamilyGardenProps {
  currentUser: User;
  users: User[];
  garden: FamilyGardenState;
  onWaterGarden: (childId: string) => void;
  onStartGardenPlant: (speciesId: string) => void;
}

const STAGE_LABELS = ['種子', '發芽', '長出新葉', '小植株', '花苞', '開花'];
const WATERING_FEEDBACK = ['種子喝到水了！', '嫩芽冒出來了！', '長出新的葉片了！', '植物長得更高了！', '花苞準備開花了！', '植物開花了！'];

/** 澆水動畫總長度；水真正澆到土裡的時間點 */
const WATERING_DURATION_MS = 1600;
const WATERING_LANDS_AT_MS = 900;

/** 從壺嘴依序落下的水滴（x 偏移、延遲秒數、落到水道的哪個位置） */
const WATER_DROPS = [
  { x: -2, delay: 0.34, end: '100%' },
  { x: 8, delay: 0.42, end: '90%' },
  { x: -8, delay: 0.5, end: '104%' },
  { x: 14, delay: 0.58, end: '86%' },
  { x: 2, delay: 0.66, end: '100%' },
  { x: -12, delay: 0.74, end: '96%' },
  { x: 10, delay: 0.82, end: '92%' },
  { x: 0, delay: 0.9, end: '102%' },
];

const WATER_SPARKLES = [
  { left: '28%', top: '36%', delay: 0.95, size: 15 },
  { left: '68%', top: '28%', delay: 1.06, size: 12 },
  { left: '50%', top: '50%', delay: 1.16, size: 10 },
];

/** 開花慶祝時飄落的花瓣（左側位置、延遲秒數、左右飄移量） */
const BLOOM_PETALS = [
  { left: '14%', delay: 0, drift: 24 },
  { left: '30%', delay: 0.18, drift: -18 },
  { left: '44%', delay: 0.36, drift: 30 },
  { left: '58%', delay: 0.1, drift: -26 },
  { left: '72%', delay: 0.28, drift: 20 },
  { left: '86%', delay: 0.44, drift: -22 },
];

const prefersReducedMotion = (): boolean =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** 澆水過程：灑水壺傾倒、水滴落下、土面濺起水花、冒出小星星 */
const WateringEffect: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
    <div className="garden-can absolute left-1/2 top-[4%] -translate-x-[6px]">
      <svg width="92" height="68" viewBox="0 0 78 58">
        <path d="M26 16 H60 C63.5 16 65.5 18.4 64.6 21.4 L59.6 47.6 C58.8 51.6 55.6 54 51.6 54 H34.4 C30.4 54 27.2 51.6 26.4 47.6 L21.4 21.4 C20.5 18.4 22.5 16 26 16 Z" fill="#7BC0DE" stroke="#3282A5" strokeWidth="3" strokeLinejoin="round" />
        <path d="M32 16 C34 5 52 5 54 16" fill="none" stroke="#3282A5" strokeWidth="4" strokeLinecap="round" />
        <path d="M22 25 L8 34 L6 42" fill="none" stroke="#3282A5" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="6" cy="46" rx="9.5" ry="5" fill="#9AD3EA" stroke="#3282A5" strokeWidth="2.5" />
        <path d="M32 23 H54" stroke="#DCF0F9" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
      </svg>
    </div>

    {/* 水道：從壺嘴一路延伸到土面，高度隨舞台自動調整 */}
    <div className="absolute bottom-[16%] left-1/2 top-[22%] w-0">
      {WATER_DROPS.map((drop) => (
        <span
          key={drop.delay}
          className="garden-drop absolute h-3 w-[7px] rounded-full bg-nook-blue"
          style={{
            left: `${drop.x}px`,
            animationDelay: `${drop.delay}s`,
            '--drop-end': drop.end,
          } as React.CSSProperties}
        />
      ))}
    </div>

    {[0.86, 1.04].map((delay) => (
      <span
        key={delay}
        className="garden-splash absolute bottom-[13%] left-1/2 h-4 w-20 rounded-full border-[3px] border-nook-blue/70"
        style={{ animationDelay: `${delay}s` }}
      />
    ))}

    {WATER_SPARKLES.map((sparkle) => (
      <span
        key={sparkle.delay}
        className="garden-sparkle absolute leading-none"
        style={{ left: sparkle.left, top: sparkle.top, fontSize: sparkle.size, animationDelay: `${sparkle.delay}s` }}
      >
        ✨
      </span>
    ))}
  </div>
);

/** 開花慶祝：花瓣飄落與蝴蝶 */
const BloomEffect: React.FC<{ color: string; accent: string }> = ({ color, accent }) => (
  <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden="true">
    {BLOOM_PETALS.map((petal, index) => (
      <span
        key={petal.left}
        className="garden-petal absolute top-0 block h-3.5 w-2.5 rounded-full"
        style={{
          left: petal.left,
          backgroundColor: index % 2 === 0 ? color : accent,
          animationDelay: `${petal.delay}s`,
          '--petal-x': `${petal.drift}px`,
        } as React.CSSProperties}
      />
    ))}
    <span className="garden-sparkle absolute left-[22%] top-[24%] text-2xl leading-none" style={{ animationDelay: '0.25s' }}>🦋</span>
    <span className="garden-sparkle absolute right-[20%] top-[16%] text-xl leading-none" style={{ animationDelay: '0.6s' }}>🦋</span>
  </div>
);

const getGardenName = (children: User[]): string => {
  const nameCharacters = children.slice(0, 2).map((child) => Array.from(child.name).at(-1) ?? child.name);
  return nameCharacters.length > 0 ? `${nameCharacters.join('')}花園` : '家庭花園';
};

export const FamilyGarden: React.FC<FamilyGardenProps> = ({
  currentUser,
  users,
  garden,
  onWaterGarden,
  onStartGardenPlant,
}) => {
  const activePlant = getActiveGardenPlant(garden);
  const stage = Math.min(activePlant?.waterings.length ?? 0, garden.wateringsToBloom);
  const bloomed = isGardenPlantBloomed(activePlant, garden);
  const species = getGardenSpecies(activePlant?.speciesId ?? 'sunflower');
  // 每澆一次水就換一幕背景，避免同一個場景看久了失去新鮮感
  const scene = getGardenScene(activePlant?.id ?? 'garden', stage);
  const isChild = currentUser.role === UserRole.CHILD;
  const childUsers = users.filter((user) => user.role === UserRole.CHILD);
  const gardenName = getGardenName(childUsers);
  const currentChildId = isChild ? currentUser.id : null;
  const currentAvailableWaterings = currentChildId
    ? getAvailableGardenWaterings(garden, currentChildId)
    : 0;
  const currentPoints = currentChildId
    ? getGardenPointsTowardNextWatering(garden, currentChildId)
    : 0;
  const pointsUntilNext = currentChildId
    ? getGardenPointsUntilNextWatering(garden, currentChildId)
    : garden.pointsPerWatering;
  const contributions = useMemo(() => getGardenContributions(activePlant), [activePlant]);
  const [showAlbum, setShowAlbum] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isWatering, setIsWatering] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isPetting, setIsPetting] = useState(false);
  const timeoutsRef = useRef<number[]>([]);
  const albumRef = useRef<HTMLDivElement>(null);

  const schedule = (callback: () => void, delayMs: number) => {
    timeoutsRef.current.push(window.setTimeout(callback, delayMs));
  };

  useEffect(() => {
    if (!feedback) return undefined;
    const timeoutId = window.setTimeout(() => setFeedback(null), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  useEffect(() => () => {
    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutsRef.current = [];
  }, []);

  // 圖鑑在卡片最下方，展開後把它捲進畫面，才不用自己找。
  // 等瀏覽器排完展開後的版面再捲，否則平滑捲動會停在錯的位置（標題被頂欄蓋住）。
  useEffect(() => {
    if (!showAlbum) return undefined;
    const frameId = window.requestAnimationFrame(() => {
      albumRef.current?.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [showAlbum]);

  const handleWater = () => {
    if (!currentChildId || currentAvailableWaterings < 1 || bloomed || isWatering) return;

    const nextStage = Math.min(stage + 1, garden.wateringsToBloom);
    const willBloom = nextStage >= garden.wateringsToBloom;
    const applyWatering = () => {
      onWaterGarden(currentChildId);
      setFeedback(WATERING_FEEDBACK[Math.min(nextStage, WATERING_FEEDBACK.length - 1)]);
    };

    // 關閉動畫時直接完成澆水，不讓孩子空等
    if (prefersReducedMotion()) {
      applyWatering();
      return;
    }

    setIsWatering(true);
    // 等水真的澆到土裡，植物才長大，因果看起來才對
    schedule(() => {
      applyWatering();
      if (willBloom) setIsCelebrating(true);
    }, WATERING_LANDS_AT_MS);
    schedule(() => setIsWatering(false), WATERING_DURATION_MS);
    if (willBloom) schedule(() => setIsCelebrating(false), WATERING_LANDS_AT_MS + 2600);
  };

  // 摸摸看：讓孩子在等待澆水次數時也有東西可以玩
  const handlePetPlant = () => {
    if (isPetting || isWatering) return;
    setIsPetting(true);
    schedule(() => setIsPetting(false), 620);
  };

  return (
    <section aria-labelledby="family-garden-title" className="overflow-hidden rounded-2xl bg-white soft-card">
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4 md:px-5 md:pt-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-nook-green/15 text-nook-greenDark" aria-hidden="true">
              <Icons.Leaf size={18} />
            </span>
            <div>
              <h2 id="family-garden-title" className="text-base font-bold text-nook-greenDark">{gardenName}</h2>
              <p className="text-xs font-bold text-nook-brown/75">兩個人的陽光，養大同一株植物</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAlbum((visible) => !visible)}
          aria-expanded={showAlbum}
          aria-label="植物圖鑑"
          className="inline-flex min-h-10 flex-shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold text-nook-greenDark hover:bg-nook-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nook-greenDark"
        >
          <Icons.BookOpen size={16} />
          <span className="hidden sm:inline">植物圖鑑</span>
          <Icons.ChevronDown size={14} className={`transition-transform ${showAlbum ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className="grid gap-0 md:grid-cols-[minmax(0,1.15fr)_minmax(270px,0.85fr)]">
        <div
          style={{ background: scene.backdrop }}
          className={`relative flex items-end justify-center overflow-hidden px-5 pt-4 transition-[background] duration-500 ${stage <= 1 ? 'min-h-[230px] md:min-h-[250px]' : stage === 2 ? 'min-h-[280px] md:min-h-[300px]' : 'min-h-[300px] md:min-h-[340px]'}`}
        >
          <div className="absolute left-4 top-3 z-10 rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-nook-greenDark soft-card">
            {STAGE_LABELS[stage]}・第 {stage} / {garden.wateringsToBloom} 階段
          </div>
          {bloomed && activePlant && isCooperativeBloom(activePlant) && (
            <div className="absolute right-4 top-3 z-10 rounded-full bg-nook-yellow px-3 py-2 text-xs font-bold text-[#684D0E]">
              🦋 協力開花
            </div>
          )}
          <button
            type="button"
            onClick={handlePetPlant}
            aria-label={`摸摸看${species.commonName}`}
            className="w-full max-w-[330px] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nook-greenDark"
          >
            <div className={`transition-[filter] duration-200 ${isWatering ? 'brightness-105' : ''} ${isPetting ? 'garden-wiggle' : ''}`}>
              <GardenPlant speciesId={species.id} stage={stage} sceneId={scene.id} />
            </div>
          </button>
          <p className="absolute bottom-3 left-4 z-10 rounded-full bg-white/85 px-2.5 py-1 text-xs font-bold text-nook-brown/75">
            <span aria-hidden="true">{scene.emoji}</span> {scene.label}
          </p>
          {isWatering && <WateringEffect />}
          {isCelebrating && <BloomEffect color={species.flowerColor} accent={species.flowerAccent} />}
        </div>

        <div className="flex min-w-0 flex-col px-4 py-4 md:px-5 md:py-5">
          <div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h3 className="text-xl font-black text-nook-brown">{species.commonName}</h3>
              <span className="text-xs font-bold italic text-nook-brown/75">{species.scientificName}</span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-nook-brown">{species.childFact}</p>
          </div>

          {isChild ? (
            <div className="mt-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold text-[#765812]">
                    <span aria-hidden="true">☀️</span> 你的陽光
                  </p>
                  <p className="mt-1 font-black tabular-nums text-nook-brown">
                    <span className="text-xl text-nook-greenDark">{currentPoints}</span>
                    <span className="text-sm text-nook-brown/75"> / {garden.pointsPerWatering}</span>
                  </p>
                </div>
                <p className="text-right text-xs font-bold text-nook-brown/75">
                  {currentAvailableWaterings > 0
                    ? `可以澆水 ${currentAvailableWaterings} 次`
                    : `還差 ${pointsUntilNext} 點`}
                </p>
              </div>
              <div
                className="mt-2 h-2.5 overflow-hidden rounded-full bg-nook-beige"
                role="progressbar"
                aria-label="下一次澆水的陽光進度"
                aria-valuemin={0}
                aria-valuemax={garden.pointsPerWatering}
                aria-valuenow={currentPoints}
              >
                <div
                  className="h-full rounded-full bg-nook-yellow transition-[width] duration-200"
                  style={{ width: `${Math.min(100, (currentPoints / garden.pointsPerWatering) * 100)}%` }}
                />
              </div>

              {bloomed ? (
                <Button
                  className="mt-3 w-full"
                  size="lg"
                  onClick={() => setShowAlbum(true)}
                  icon={<Icons.Leaf size={18} />}
                >
                  選擇下一顆種子
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleWater}
                  disabled={currentAvailableWaterings < 1 || isWatering}
                  className="mt-3 w-full disabled:border-nook-brown/10 disabled:bg-nook-beige disabled:text-nook-brown/75 disabled:opacity-100"
                  aria-describedby="garden-water-hint"
                >
                  <span className="mr-2" aria-hidden="true">💧</span>
                  {isWatering ? '正在澆水…' : '幫花澆水'}
                </Button>
              )}
              <p id="garden-water-hint" className="mt-2 text-center text-xs font-bold text-nook-brown/75">
                家長登記好事加分時，1 分會變成 1 點陽光；集滿 {garden.pointsPerWatering} 點可澆水一次，且不會扣分。
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-nook-yellow/20 px-3 py-2">
              <p className="text-xs font-bold text-[#765812]">每登記 1 分好事，就會同步累積 1 點陽光；每 {garden.pointsPerWatering} 點可澆水一次。澆水留給孩子親自完成。</p>
            </div>
          )}

          <div className="mt-4 border-t border-nook-greenDark/10 pt-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-nook-greenDark">本株澆水</p>
              <p className="text-xs font-bold tabular-nums text-nook-brown">
                {stage} / {garden.wateringsToBloom} 次
              </p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {childUsers.slice(0, 2).map((child) => {
                const available = getAvailableGardenWaterings(garden, child.id);
                const progress = getGardenChildProgress(garden, child.id);

                return (
                  <div key={child.id} className="min-w-0 rounded-xl bg-nook-beige/60 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base" aria-hidden="true">{child.avatar}</span>
                      <span className="truncate text-xs font-bold text-nook-brown">{child.name}</span>
                    </div>
                    <p className="mt-1 text-xs font-bold text-nook-brown/75">
                      澆了 {contributions.get(child.id) ?? 0} 次
                      {!isChild && `・可用 ${available} 次`}
                    </p>
                    {!isChild && (
                      <p className="text-xs font-bold text-[#765812]">
                        累積陽光 {progress.earnedPositivePoints} 點
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {(feedback || bloomed) && (
            <p className="mt-3 text-center text-sm font-bold text-nook-greenDark" aria-live="polite">
              {feedback ?? `${species.commonName}開花了！`}
            </p>
          )}
        </div>
      </div>

      {showAlbum && (
        <div ref={albumRef} className="scroll-mt-16 px-4 pb-4 md:px-5 md:pb-5 lg:scroll-mt-4">
          <GardenAlbum
            garden={garden}
            canStartNextPlant={bloomed}
            onStartPlant={(speciesId) => {
              onStartGardenPlant(speciesId);
              setShowAlbum(false);
              setFeedback('新的種子已經種下了！');
            }}
          />
        </div>
      )}
    </section>
  );
};
