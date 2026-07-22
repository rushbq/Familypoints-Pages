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
  const isChild = currentUser.role === UserRole.CHILD;
  const childUsers = users.filter((user) => user.role === UserRole.CHILD);
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
  const wateringTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeoutId = window.setTimeout(() => setFeedback(null), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  useEffect(() => () => {
    if (wateringTimeoutRef.current !== null) {
      window.clearTimeout(wateringTimeoutRef.current);
    }
  }, []);

  const handleWater = () => {
    if (!currentChildId || currentAvailableWaterings < 1 || bloomed || isWatering) return;
    setIsWatering(true);
    setFeedback(WATERING_FEEDBACK[Math.min(stage + 1, 5)]);
    onWaterGarden(currentChildId);
    wateringTimeoutRef.current = window.setTimeout(() => {
      setIsWatering(false);
      wateringTimeoutRef.current = null;
    }, 250);
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
              <h2 id="family-garden-title" className="text-base font-bold text-nook-greenDark">我們的家庭花園</h2>
              <p className="text-xs font-bold text-nook-brown/75">一起澆水，也一起認識植物</p>
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
        <div className={`relative flex items-end justify-center overflow-hidden bg-nook-beige/50 px-5 pt-4 ${stage <= 1 ? 'min-h-[230px] md:min-h-[250px]' : stage === 2 ? 'min-h-[280px] md:min-h-[300px]' : 'min-h-[300px] md:min-h-[340px]'}`}>
          <div className="absolute left-4 top-3 z-10 rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-nook-greenDark soft-card">
            {STAGE_LABELS[stage]}・第 {stage} / {garden.wateringsToBloom} 階段
          </div>
          {bloomed && activePlant && isCooperativeBloom(activePlant) && (
            <div className="absolute right-4 top-3 z-10 rounded-full bg-nook-yellow px-3 py-2 text-xs font-bold text-[#684D0E]">
              🦋 協力開花
            </div>
          )}
          <div className={`w-full max-w-[330px] transition-[transform,filter] duration-200 ${isWatering ? 'scale-[1.025] brightness-105' : ''}`}>
            <GardenPlant speciesId={species.id} stage={stage} />
          </div>
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
                澆水不會扣除你的分數
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-nook-yellow/20 px-3 py-2">
              <p className="text-xs font-bold text-[#765812]">家長可以查看進度，澆水留給孩子親自完成。</p>
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
        <div className="px-4 pb-4 md:px-5 md:pb-5">
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
