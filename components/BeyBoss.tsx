import React, { useMemo, useState } from 'react';
import { BeyBossAttempt, BeyBossState, BeyForgeState, User, UserRole } from '../types';
import { getBeyBoss } from '../services/beyBossData';
import { getBeyPart } from '../services/beyData';
import {
  getBossAvailability,
  getDecidedRounds,
  getBossEntry,
  getBossForWeek,
  getDaysUntilBattle,
  getEffectiveBossStats,
  isBattleDay,
  getLineupBuildId,
  getSelectableBuilds,
  getTeamStats,
  getWeekKey,
  ROUND_LABELS,
} from '../services/beyBossUtils';
import { getBuildStats } from '../services/beyUtils';
import { BeyTop } from './BeyTop';
import { Button } from './ui/Button';
import { Icons } from './Icons';
import { BeyBattleSide, BeyBossBattle } from './BeyBossBattle';
import { prefersReducedMotion } from '../services/motion';

interface BeyBossProps {
  currentUser: User;
  users: User[];
  forge: BeyForgeState;
  boss: BeyBossState;
  onSetLineup: (childId: string, buildId: string | null) => void;
  onChallenge: () => BeyBossAttempt | null;
  onShowRules: () => void;
}

const STAT_KEYS = ['attack', 'defense', 'stamina'] as const;

/** 魔王三圍對照表：讓孩子一眼看出本週要補哪一項。 */
const StatCompare: React.FC<{
  team: { attack: number; defense: number; stamina: number };
  bossStats: { attack: number; defense: number; stamina: number };
}> = ({ team, bossStats }) => (
  <div className="grid grid-cols-3 gap-2">
    {STAT_KEYS.map((key) => {
      const ahead = team[key] >= bossStats[key];
      return (
        <div key={key} className="rounded-lg border border-bey-steel bg-bey-void/40 px-2 py-1.5 text-center">
          <p className="text-[10px] font-normal text-bey-dim">{ROUND_LABELS[key]}</p>
          <p className="text-sm font-bold tabular-nums">
            <span className={ahead ? 'text-bey-lime' : 'text-bey-red'}>{team[key]}</span>
            <span className="mx-1 text-bey-dim">/</span>
            <span className="text-bey-ink">{bossStats[key]}</span>
          </p>
        </div>
      );
    })}
  </div>
);

/**
 * 週魔王戰。只在週六、週日開放；平日顯示魔王情報與倒數，
 * 讓孩子平日就知道要補哪一項，但打不了。
 */
export const BeyBoss: React.FC<BeyBossProps> = ({
  currentUser,
  users,
  forge,
  boss,
  onSetLineup,
  onChallenge,
  onShowRules,
}) => {
  const [result, setResult] = useState<BeyBossAttempt | null>(null);
  /** 正在演出的那一場；關掉只收掉演出，結果仍留在面板上。 */
  const [battle, setBattle] = useState<BeyBossAttempt | null>(null);
  const [expanded, setExpanded] = useState(false);

  const weekKey = getWeekKey();
  const entry = getBossEntry(boss, weekKey);
  // 本週還沒有任何紀錄時（沒人派出陀螺），直接由日期算出輪到哪一隻
  const def = entry ? getBeyBoss(entry.bossId) : getBossForWeek(weekKey);

  const isParent = currentUser.role === UserRole.PARENT;
  const allChildren = users.filter((user) => user.role === UserRole.CHILD);
  const team = getTeamStats(entry, forge);
  const availability = getBossAvailability(entry, forge, new Date());
  const weakened = team.memberCount < 2;
  const daysUntil = getDaysUntilBattle();

  const bossStats = useMemo(
    () => (def ? getEffectiveBossStats(def, weakened) : { attack: 0, defense: 0, stamina: 0 }),
    [def, weakened],
  );

  if (!def) return null;

  // 勝負與獎勵在這一刻就寫進狀態了，演出只是把已知的結果播一遍
  const handleChallenge = () => {
    const attempt = onChallenge();
    if (!attempt) return;
    setResult(attempt);
    if (!prefersReducedMotion()) setBattle(attempt);
  };

  // 演出用的我方陣容；順序跟著孩子清單，隊色才和首頁一致
  const battleSides = useMemo<BeyBattleSide[]>(
    () => allChildren.flatMap((child, index) => {
      const buildId = getLineupBuildId(entry, child.id);
      const build = buildId
        ? getSelectableBuilds(forge, child.id).find((item) => item.id === buildId)
        : undefined;
      if (!build) return [];
      return [{
        childName: child.name,
        teamColor: index % 2 === 0 ? 'purple' : 'orange',
        bladeId: build.bladeId,
        ratchetId: build.ratchetId,
        bitId: build.bitId,
      }];
    }),
    [allChildren, entry, forge],
  );

  const statusLine = (() => {
    switch (availability) {
      case 'DEFEATED': return '本週已擊敗，下週換新魔王';
      case 'NOT_BATTLE_DAY': return daysUntil === 1 ? '明天（週六）開戰' : `還有 ${daysUntil} 天開戰`;
      case 'NO_LINEUP': return '先派出陀螺才能開戰';
      case 'ALREADY_TODAY': return '今天已經挑戰過了，明天再來';
      case 'READY': return weakened ? '只有一人出戰，只能打減弱版' : '兩人到齊，可以打完整版！';
      default: return '';
    }
  })();

  return (
    <>
      <section
          aria-label="週魔王戰"
        className="relative overflow-hidden bg-bey-panel soft-card clip-notch border-t-[3px] p-3 md:p-4"
        style={{ borderTopColor: def.color.main }}
      >
        <div className="pointer-events-none absolute inset-0 speed-lines opacity-40" aria-hidden="true" />

        <div className="relative flex items-center gap-3">
          {/* 魔王用自己的色系，才分得出敵我；平日慢轉、戰鬥日才轉快，
              避免平常看一眼就被催促 */}
          <BeyTop
            size={52}
            colorSet={def.color}
            speed={availability === 'DEFEATED' || !isBattleDay() ? 'idle' : 'fast'}
            className="flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[10px] font-bold tracking-[0.26em]" style={{ color: def.color.main }}>
              WEEKLY BOSS
            </p>
            <h3 className="text-base font-black text-bey-ink">
              {def.name}
              {availability === 'DEFEATED' && <span className="ml-2 text-xs font-bold text-bey-lime">已擊敗 ✓</span>}
            </h3>
            <p className="text-[11px] font-normal text-bey-dim">{statusLine}</p>
          </div>
          <button
            type="button"
            onClick={onShowRules}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-bey-steel text-[11px] font-bold text-bey-dim transition-colors hover:border-bey-cyan/50 hover:text-bey-ink"
            aria-label="玩法說明"
            title="玩法說明"
          >
            ？
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 rounded-lg p-1 text-bey-dim hover:text-bey-ink"
            aria-expanded={expanded}
            aria-label={expanded ? '收合魔王戰' : '展開魔王戰'}
          >
            <Icons.ChevronDown size={18} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
        </div>

        {expanded && (
          <div className="relative mt-3 animate-pop">
            <p className="mb-3 text-xs font-normal leading-relaxed text-bey-dim">{def.tagline}</p>

            <p className="mb-1.5 font-display text-[10px] font-bold tracking-[0.18em] text-bey-dim">
              我方 / 魔王{weakened && '（減弱版）'}
            </p>
            <StatCompare team={team} bossStats={bossStats} />

            {/* 派出陀螺 */}
            <div className="mt-3 space-y-2">
              {allChildren.map((child) => {
                const builds = getSelectableBuilds(forge, child.id);
                const picked = getLineupBuildId(entry, child.id);
                const canEdit = !isParent && child.id === currentUser.id && availability !== 'DEFEATED';

                return (
                  <div key={child.id} className="rounded-xl border border-bey-steel bg-bey-void/40 p-2.5">
                    <p className="mb-1.5 text-xs font-bold text-bey-ink">
                      <span aria-hidden="true">{child.avatar}</span> {child.name} 的出戰陀螺
                    </p>

                    {builds.length === 0 ? (
                      <p className="text-[11px] font-normal text-bey-dim">還沒有組裝好的陀螺</p>
                    ) : canEdit ? (
                      <div className="flex flex-wrap gap-1.5">
                        {builds.map((build) => {
                          const stats = getBuildStats(build.bladeId, build.ratchetId, build.bitId);
                          return (
                            <button
                              key={build.id}
                              type="button"
                              onClick={() => onSetLineup(child.id, picked === build.id ? null : build.id)}
                              className={`rounded-lg border px-2 py-1 text-[11px] font-bold transition-colors ${
                                picked === build.id
                                  ? 'border-bey-cyan bg-bey-cyan/20 text-bey-cyan'
                                  : 'border-bey-steel bg-bey-paper text-bey-dim hover:text-bey-ink'
                              }`}
                            >
                              {build.name} <span className="font-normal">({stats.total})</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] font-normal text-bey-dim">
                        {picked
                          ? builds.find((build) => build.id === picked)?.name ?? '已派出'
                          : '尚未派出'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 開戰 */}
            {!isParent && (
              <Button
                variant="danger"
                className="mt-3 w-full"
                disabled={availability !== 'READY'}
                onClick={handleChallenge}
                icon={<Icons.Trophy size={16} />}
              >
                {availability === 'READY' ? (weakened ? '挑戰減弱版' : '開戰！') : statusLine}
              </Button>
            )}

            {/* 三回合結果 */}
            {result && (
              <div className="mt-3 rounded-xl border border-bey-steel bg-bey-void/50 p-3 animate-pop">
                <p className={`mb-2 text-sm font-black ${result.won ? 'text-bey-lime' : 'text-bey-red'}`}>
                  {result.won
                    ? result.weakened ? '打贏減弱版！拿到一個稀有零件' : `擊敗 ${def.name}！兩人各拿到專屬零件`
                    : '這次輸了，明天再來'}
                </p>
                <div className="space-y-1">
                  {getDecidedRounds(result.rounds).map((round, index) => (
                    <div key={round.stat} className="flex items-center gap-2 text-[11px]">
                      <span className="w-12 flex-shrink-0 font-normal text-bey-dim">
                        第 {index + 1} 回合
                      </span>
                      <span className="w-8 flex-shrink-0 font-bold text-bey-ink">{ROUND_LABELS[round.stat]}</span>
                      <span className="flex-1 font-normal tabular-nums text-bey-dim">
                        {round.teamValue} vs {round.bossValue}
                      </span>
                      <span className={`font-bold ${round.won ? 'text-bey-lime' : 'text-bey-red'}`}>
                        {round.won ? '勝' : '敗'}
                      </span>
                      {round.upset && <span className="text-[10px] font-bold text-bey-yellow">爆冷</span>}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="mt-2 w-full rounded-lg py-1 text-[11px] font-bold text-bey-dim hover:text-bey-ink"
                >
                  關閉
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {battle && (
        <BeyBossBattle
          boss={def}
          attempt={battle}
          sides={battleSides}
          rewardPart={battle.won && !battle.weakened ? getBeyPart(def.rewardPartId) ?? null : null}
          onClose={() => setBattle(null)}
        />
      )}
    </>
  );
};
