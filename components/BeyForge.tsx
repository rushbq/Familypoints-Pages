import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BeyForgeState, BeyPartSlot, User, UserRole } from '../types';
import {
  BEY_PARTS,
  BEY_SLOT_LABELS,
  BEY_SOURCE_LABELS,
  BeyPartDef,
  getBeyPart,
} from '../services/beyData';
import {
  DUPLICATE_SCRAP_REFUND,
  getAvailableBeyDraws,
  getBeyBuilds,
  getBeyChildProgress,
  getBuildStats,
  getOwnedPartDefs,
  getOwnedParts,
  getScrapTowardNextDraw,
  getScrapUntilNextDraw,
} from '../services/beyUtils';
import { BeyTop } from './BeyTop';
import { Button } from './ui/Button';
import { Icons } from './Icons';
import { prefersReducedMotion } from '../services/motion';

interface BeyForgeProps {
  currentUser: User;
  users: User[];
  forge: BeyForgeState;
  /** 回傳這次抽到的零件 id 與是否重複，供畫面顯示結果。 */
  onDrawPart: (childId: string) => { partId: string | null; isDuplicate: boolean };
  onAssemble: (childId: string, name: string, bladeId: string, ratchetId: string, bitId: string) => void;
  onDisassemble: (buildId: string) => void;
  onShowRules: () => void;
}

const SLOTS: BeyPartSlot[] = ['BLADE', 'RATCHET', 'BIT'];

/** 爐火蓄力到揭曉零件的時間。 */
const FORGE_CHARGE_MS = 700;
/** 組裝完成卡停留多久後收掉。 */
const ASSEMBLE_SHOW_MS = 3200;

/** 三圍的顯示設定；上限是三個零件各 5 分。 */
const STAT_ROWS = [
  { key: 'attack' as const, label: '攻擊', color: 'bg-bey-red' },
  { key: 'defense' as const, label: '防禦', color: 'bg-bey-blue' },
  { key: 'stamina' as const, label: '持久', color: 'bg-bey-lime' },
];
const STAT_MAX = 15;

const StatBars: React.FC<{
  attack: number;
  defense: number;
  stamina: number;
  /** 組裝完成時讓三條從 0 長到最終值。 */
  grow?: boolean;
}> = ({ attack, defense, stamina, grow = false }) => {
  const values = { attack, defense, stamina };
  // 先畫成 0 再於下一格畫面交給 CSS transition，才看得到長出來的過程
  const [grown, setGrown] = useState(!grow);

  useEffect(() => {
    if (!grow) return undefined;
    const frameId = window.requestAnimationFrame(() => setGrown(true));
    return () => window.cancelAnimationFrame(frameId);
  }, [grow]);

  return (
    <div className="space-y-1.5">
      {STAT_ROWS.map((row) => (
        <div key={row.key} className="flex items-center gap-2">
          <span className="w-8 flex-shrink-0 text-xs font-normal text-bey-dim">{row.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full border border-bey-steel bg-bey-void/70">
            <div
              className={`h-full rounded-full ${row.color} ${grow ? 'transition-[width] delay-[760ms] duration-700 ease-out' : ''}`}
              style={{ width: grown ? `${(values[row.key] / STAT_MAX) * 100}%` : '0%' }}
            />
          </div>
          <span className="w-5 flex-shrink-0 text-right text-xs font-bold tabular-nums text-bey-ink">{values[row.key]}</span>
        </div>
      ))}
    </div>
  );
};

/** 單一孩子的鍛造面板。家長檢視時會看到兩個孩子各一塊。 */
const ChildForgePanel: React.FC<{
  child: User;
  forge: BeyForgeState;
  canOperate: boolean;
  teamColor: 'purple' | 'orange';
  onDrawPart: BeyForgeProps['onDrawPart'];
  onAssemble: BeyForgeProps['onAssemble'];
  onDisassemble: BeyForgeProps['onDisassemble'];
}> = ({ child, forge, canOperate, teamColor, onDrawPart, onAssemble, onDisassemble }) => {
  const [selection, setSelection] = useState<Record<BeyPartSlot, string | null>>({
    BLADE: null,
    RATCHET: null,
    BIT: null,
  });
  const [buildName, setBuildName] = useState('');
  const [drawResult, setDrawResult] = useState<{ partId: string; isDuplicate: boolean } | null>(null);
  const [isForging, setIsForging] = useState(false);
  /** 剛組裝好的陀螺，只為了播一次動畫，不是資料來源。 */
  const [forged, setForged] = useState<{
    name: string;
    bladeId: string;
    ratchetId: string;
    bitId: string;
  } | null>(null);
  const [showForge, setShowForge] = useState(false);
  // 零件庫預設收合：未取得的零件是一整片同樣的「？？？」，
  // 攤開來佔掉最多版面，資訊量卻等於零。
  const [showParts, setShowParts] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  const schedule = (callback: () => void, delayMs: number) => {
    timeoutsRef.current.push(window.setTimeout(callback, delayMs));
  };

  useEffect(() => () => {
    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutsRef.current = [];
  }, []);

  const progress = getBeyChildProgress(forge, child.id);
  const draws = getAvailableBeyDraws(forge, child.id);
  const toward = getScrapTowardNextDraw(forge, child.id);
  const until = getScrapUntilNextDraw(forge, child.id);
  const ownedParts = getOwnedParts(forge, child.id);
  const builds = getBeyBuilds(forge, child.id);

  const ownedBySlot = useMemo(() => ({
    BLADE: getOwnedPartDefs(forge, child.id, 'BLADE'),
    RATCHET: getOwnedPartDefs(forge, child.id, 'RATCHET'),
    BIT: getOwnedPartDefs(forge, child.id, 'BIT'),
  }), [forge, child.id]);

  const canAssemble = Boolean(selection.BLADE && selection.RATCHET && selection.BIT);
  const previewStats = canAssemble
    ? getBuildStats(selection.BLADE!, selection.RATCHET!, selection.BIT!)
    : { attack: 0, defense: 0, stamina: 0, total: 0 };

  const accent = teamColor === 'purple' ? 'text-bey-purple' : 'text-bey-orange';
  const accentBorder = teamColor === 'purple' ? 'border-t-bey-purple' : 'border-t-bey-orange';

  // 鋼料在點下去的那一刻就扣掉、零件也已入庫；動畫只延後「看到」，
  // 這樣播放中關掉 App 也不會白白損失一次鍛造。
  const handleDraw = () => {
    if (isForging) return;
    const result = onDrawPart(child.id);
    if (!result.partId) return;
    const revealed = { partId: result.partId, isDuplicate: result.isDuplicate };

    if (prefersReducedMotion()) {
      setDrawResult(revealed);
      return;
    }

    setDrawResult(null);
    setIsForging(true);
    schedule(() => {
      setIsForging(false);
      setDrawResult(revealed);
    }, FORGE_CHARGE_MS);
  };

  const handleAssemble = () => {
    if (!canAssemble) return;
    const parts = { bladeId: selection.BLADE!, ratchetId: selection.RATCHET!, bitId: selection.BIT! };
    onAssemble(child.id, buildName, parts.bladeId, parts.ratchetId, parts.bitId);
    setSelection({ BLADE: null, RATCHET: null, BIT: null });
    setShowForge(false);

    if (!prefersReducedMotion()) {
      // 名字的預設值要跟 assembleBey 一致，動畫上顯示的才是實際存下來的名字
      const celebration = { name: buildName.trim() || '無名陀螺', ...parts };
      setDrawResult(null);
      setForged(celebration);
      // 只收掉自己這一張：連續組裝兩台時，前一個計時器不該把第二張提早關掉
      schedule(
        () => setForged((current) => (current === celebration ? null : current)),
        ASSEMBLE_SHOW_MS,
      );
    }
    setBuildName('');
  };

  const drawnPart = drawResult ? getBeyPart(drawResult.partId) : null;
  // 重複零件不給慶祝：不彈出、不閃光，只把退回的鋼料飄向進度條
  const celebrate = Boolean(drawnPart) && !drawResult?.isDuplicate;
  const isRarePart = celebrate && drawnPart?.rarity !== 'COMMON';
  const forgedParts = forged
    ? [forged.bladeId, forged.ratchetId, forged.bitId]
      .map((partId) => getBeyPart(partId))
      .filter((part): part is BeyPartDef => Boolean(part))
    : [];
  const forgedStats = forged
    ? getBuildStats(forged.bladeId, forged.ratchetId, forged.bitId)
    : { attack: 0, defense: 0, stamina: 0, total: 0 };

  return (
    <div className={`relative overflow-hidden bg-bey-panel soft-card clip-notch border-t-[3px] ${accentBorder} p-3 md:p-4`}>
      {/* 標題與鋼料進度 */}
      <div className="mb-3 flex items-center gap-2.5">
        <BeyTop color={teamColor} size={40} speed="idle" />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-bold text-bey-ink">
            <span aria-hidden="true">{child.avatar}</span> {child.name} 的工房
          </h4>
          <p className={`font-display text-[10px] font-bold tracking-[0.2em] ${accent}`}>
            PARTS {ownedParts.length}/{BEY_PARTS.length}・BEYS {builds.length}
          </p>
        </div>
      </div>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs font-bold">
          <span className="text-bey-dim">⚙️ 鋼料 {progress.earnedScrap}</span>
          <span className={accent}>{draws > 0 ? `可鍛造 ${draws} 次` : `還差 ${until} 鋼料`}</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full border border-bey-steel bg-bey-void/70"
          role="progressbar"
          aria-label="距離下一次鍛造的鋼料進度"
          aria-valuemin={0}
          aria-valuemax={forge.scrapPerDraw}
          aria-valuenow={toward}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-bey-cyan to-bey-lime"
            style={{ width: `${(toward / forge.scrapPerDraw) * 100}%` }}
          />
        </div>
      </div>

      {canOperate && (
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          disabled={draws <= 0}
          onClick={handleDraw}
          icon={<Icons.Sparkles size={15} />}
        >
          {draws > 0 ? '鍛造零件' : '鋼料不足'}
        </Button>
      )}

      {/* 鍛造中：爐心蓄力，看不出抽到什麼 */}
      {isForging && (
        <div
          className="relative mt-3 flex items-center justify-center overflow-hidden rounded-xl border border-bey-cyan/40 bg-bey-void/70 p-4"
          aria-hidden="true"
        >
          <div className="pointer-events-none absolute inset-0 speed-lines opacity-60" />
          <div className="bey-charge relative flex items-center justify-center">
            <span className="absolute h-14 w-14 rounded-full bg-bey-cyan/25 blur-md" />
            <BeyTop size={52} color="cyan" speed="fast" className="relative opacity-70" />
          </div>
          <p className="relative ml-3 font-display text-[11px] font-bold tracking-[0.22em] text-bey-cyan">
            FORGING…
          </p>
        </div>
      )}

      {/* 抽取結果 */}
      {drawnPart && (
        <div
          className={`relative mt-3 flex items-center gap-3 overflow-hidden rounded-xl border bg-bey-void/50 p-2.5 ${
            isRarePart ? 'border-bey-yellow/60' : 'border-bey-steel'
          } ${celebrate ? 'animate-pop' : ''}`}
        >
          {celebrate && (
            <span className="bey-flash pointer-events-none absolute inset-0 bg-white" aria-hidden="true" />
          )}
          <div className="relative flex-shrink-0">
            <BeyTop
              size={44}
              speed="fast"
              bladeId={drawnPart.slot === 'BLADE' ? drawnPart.id : undefined}
              ratchetId={drawnPart.slot === 'RATCHET' ? drawnPart.id : undefined}
              bitId={drawnPart.slot === 'BIT' ? drawnPart.id : undefined}
            />
            {isRarePart && (
              <span
                className="bey-shockwave pointer-events-none absolute inset-0 rounded-full border-2 border-bey-yellow"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-bey-ink">{drawnPart.name}</p>
            <p className="text-xs font-normal text-bey-dim">
              {BEY_SLOT_LABELS[drawnPart.slot]}
              {drawResult?.isDuplicate
                ? `・重複了，換到 +${DUPLICATE_SCRAP_REFUND} 鋼料`
                : isRarePart ? '・稀有零件入庫！' : '・新零件入庫！'}
            </p>
          </div>
          {drawResult?.isDuplicate && (
            <span
              className="bey-float-up pointer-events-none absolute left-14 top-2 text-xs font-bold text-bey-cyan"
              aria-hidden="true"
            >
              +{DUPLICATE_SCRAP_REFUND}
            </span>
          )}
          <button
            type="button"
            onClick={() => setDrawResult(null)}
            className="flex-shrink-0 rounded-lg px-2 py-1 text-bey-dim hover:text-bey-ink"
            aria-label="關閉鍛造結果"
          >
            <Icons.X size={16} />
          </button>
        </div>
      )}

      {/* 組裝完成：三個零件依序飛入，到位後整台登場 */}
      {forged && (
        <div className="relative mt-3 overflow-hidden rounded-xl border border-bey-cyan/50 bg-bey-void/50 p-2.5">
          <span
            className="bey-flash pointer-events-none absolute inset-0 bg-white"
            style={{ animationDelay: '0.48s' }}
            aria-hidden="true"
          />
          <div className="relative flex items-center gap-3">
            <div className="relative flex-shrink-0">
              {/* 等三個零件都飛到位，整台才登場 */}
              <span className="bey-assemble-in block" style={{ animationDelay: '0.46s' }}>
                <BeyTop
                  size={72}
                  speed="fast"
                  bladeId={forged.bladeId}
                  ratchetId={forged.ratchetId}
                  bitId={forged.bitId}
                />
              </span>
              <span
                className="bey-shockwave pointer-events-none absolute inset-0 rounded-full border-2 border-bey-cyan"
                style={{ animationDelay: '0.86s' }}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-bey-ink">{forged.name} 組裝完成！</p>
              <div className="mb-1.5 mt-1 flex flex-wrap gap-1">
                {forgedParts.map((part, index) => (
                  <span
                    key={part.id}
                    className="bey-part-fly inline-flex rounded-md bg-bey-cyan/15 px-1.5 py-0.5 text-xs font-bold text-bey-cyan"
                    style={{ animationDelay: `${index * 0.16}s` }}
                  >
                    {part.name}
                  </span>
                ))}
              </div>
              <StatBars {...forgedStats} grow />
            </div>
          </div>
        </div>
      )}

      {/* 零件庫：預設只給一行進度，點開才看剪影 */}
      <div className="mt-3 border-t border-bey-steel pt-3">
        <button
          type="button"
          onClick={() => setShowParts(!showParts)}
          className="flex min-h-11 w-full items-center justify-between gap-2 text-left"
          aria-expanded={showParts}
        >
          <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-bold text-bey-dim">
            {SLOTS.map((slot) => {
              const all = BEY_PARTS.filter((part) => part.slot === slot);
              const got = all.filter((part) => ownedParts.some((item) => item.partId === part.id)).length;
              return (
                <span key={slot} className={got > 0 ? 'text-bey-ink' : undefined}>
                  {BEY_SLOT_LABELS[slot]} {got}/{all.length}
                </span>
              );
            })}
          </span>
          <Icons.ChevronDown
            size={16}
            className={`flex-shrink-0 text-bey-dim transition-transform ${showParts ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {showParts && (
      <div className="mt-2 space-y-2 animate-pop">
        {SLOTS.map((slot) => (
          <div key={slot}>
            <p className="mb-1 font-display text-[10px] font-bold tracking-[0.18em] text-bey-dim">
              {BEY_SLOT_LABELS[slot]}
            </p>
            <div className="flex flex-wrap gap-1">
              {BEY_PARTS.filter((part) => part.slot === slot).map((part) => {
                const owned = ownedParts.find((item) => item.partId === part.id);
                return (
                  <span
                    key={part.id}
                    title={owned ? `${part.name}（${BEY_SOURCE_LABELS[owned.source] ?? ''}）` : '尚未取得'}
                    className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-bold ${
                      owned
                        ? part.rarity === 'RARE'
                          ? 'bg-bey-yellow/20 text-bey-yellow'
                          : 'bg-bey-cyan/15 text-bey-cyan'
                        : 'bg-bey-void/50 text-bey-dim/40'
                    }`}
                  >
                    {owned ? part.name : '？？？'}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* 鍛造台 */}
      {canOperate && (
        <div className="mt-3 border-t border-bey-steel pt-3">
          <button
            type="button"
            onClick={() => setShowForge(!showForge)}
            className="flex min-h-11 w-full items-center justify-between text-left"
            aria-expanded={showForge}
          >
            <span className="font-display text-[10px] font-bold tracking-[0.2em] text-bey-dim">FORGE</span>
            <span className="flex items-center gap-1 text-xs font-bold text-bey-ink">
              組裝新陀螺
              <Icons.ChevronDown size={15} className={showForge ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </span>
          </button>

          {showForge && (
            <div className="mt-3 animate-pop">
              <div className="mb-3 flex items-center gap-3">
                <BeyTop
                  size={76}
                  speed={canAssemble ? 'fast' : 'idle'}
                  bladeId={selection.BLADE ?? undefined}
                  ratchetId={selection.RATCHET ?? undefined}
                  bitId={selection.BIT ?? undefined}
                />
                <div className="min-w-0 flex-1">
                  <StatBars {...previewStats} />
                </div>
              </div>

              {SLOTS.map((slot) => (
                <div key={slot} className="mb-2">
                  <p className="mb-1 text-xs font-normal text-bey-dim">{BEY_SLOT_LABELS[slot]}</p>
                  {ownedBySlot[slot].length === 0 ? (
                    <p className="text-xs font-normal text-bey-dim/60">還沒有{BEY_SLOT_LABELS[slot]}，先去鍛造吧</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {ownedBySlot[slot].map((part: BeyPartDef) => (
                        <button
                          key={part.id}
                          type="button"
                          onClick={() => setSelection((prev) => ({
                            ...prev,
                            [slot]: prev[slot] === part.id ? null : part.id,
                          }))}
                          className={`min-h-11 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                            selection[slot] === part.id
                              ? 'border-bey-cyan bg-bey-cyan/20 text-bey-cyan'
                              : 'border-bey-steel bg-bey-paper text-bey-dim hover:text-bey-ink'
                          }`}
                        >
                          {part.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <input
                type="text"
                value={buildName}
                onChange={(event) => setBuildName(event.target.value)}
                maxLength={12}
                placeholder="幫陀螺取個名字"
                className="mt-2 w-full rounded-xl border border-bey-steel bg-bey-paper px-3 py-2 text-sm font-bold text-bey-ink outline-none placeholder:text-bey-dim/50 focus:border-bey-cyan focus:ring-2 focus:ring-bey-cyan/40"
              />

              <Button variant="primary" size="sm" className="mt-2 w-full" disabled={!canAssemble} onClick={handleAssemble}>
                {canAssemble ? '組裝！' : '三個部位都要選'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 我的陀螺庫 */}
      {builds.length > 0 && (
        <div className="mt-3 border-t border-bey-steel pt-3">
          <p className="mb-2 font-display text-[10px] font-bold tracking-[0.2em] text-bey-dim">MY BEYS</p>
          <div className="space-y-2">
            {builds.map((build) => {
              const stats = getBuildStats(build.bladeId, build.ratchetId, build.bitId);
              return (
                <div key={build.id} className="flex items-center gap-2.5 rounded-xl border border-bey-steel bg-bey-void/40 p-2.5">
                  <BeyTop size={46} speed="idle" bladeId={build.bladeId} ratchetId={build.ratchetId} bitId={build.bitId} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-bey-ink">{build.name}</p>
                    <p className="text-xs font-normal text-bey-dim">
                      攻 {stats.attack}・防 {stats.defense}・久 {stats.stamina}
                    </p>
                  </div>
                  <span className={`font-display text-base font-black tabular-nums ${accent}`}>{stats.total}</span>
                  {canOperate && (
                    <button
                      type="button"
                      onClick={() => onDisassemble(build.id)}
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-bey-dim hover:text-bey-red"
                      aria-label={`拆掉 ${build.name}`}
                      title="拆掉（零件會留著）"
                    >
                      <Icons.Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 陀螺鍛造區塊。
 * 和家庭花園並列但性格相反：花園是兩人共養一株，這裡是每個孩子自己的收藏。
 */
export const BeyForge: React.FC<BeyForgeProps> = ({
  currentUser,
  users,
  forge,
  onDrawPart,
  onAssemble,
  onDisassemble,
  onShowRules,
}) => {
  const isParent = currentUser.role === UserRole.PARENT;
  const allChildren = users.filter((user) => user.role === UserRole.CHILD);
  const visibleChildren = isParent ? allChildren : allChildren.filter((child) => child.id === currentUser.id);

  if (visibleChildren.length === 0) return null;

  return (
    <section aria-label="陀螺鍛造" className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="min-w-0 text-xs font-normal text-bey-dim">
          家長加分會累積鋼料，集滿就能鍛造零件。
        </p>
        <button
          type="button"
          onClick={onShowRules}
          className="flex min-h-11 flex-shrink-0 items-center gap-1 rounded-lg border border-bey-steel px-3 text-xs font-bold text-bey-dim transition-colors hover:border-bey-cyan/50 hover:text-bey-ink"
        >
          <Icons.BookOpen size={13} /> 玩法說明
        </button>
      </div>

      <div className={`grid gap-3 md:gap-4 ${visibleChildren.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {visibleChildren.map((child) => {
          // 隊色沿用首頁：第一位孩子紫、第二位橘。
          const index = allChildren.findIndex((item) => item.id === child.id);
          return (
            <ChildForgePanel
              key={child.id}
              child={child}
              forge={forge}
              canOperate={isParent || child.id === currentUser.id}
              teamColor={index % 2 === 0 ? 'purple' : 'orange'}
              onDrawPart={onDrawPart}
              onAssemble={onAssemble}
              onDisassemble={onDisassemble}
            />
          );
        })}
      </div>
    </section>
  );
};
