import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BeyBossAttempt, BeyBossRound } from '../types';
import { BeyPartDef } from '../services/beyData';
import { BeyBossDef } from '../services/beyBossData';
import { getDecidedRounds, ROUND_LABELS } from '../services/beyBossUtils';
import { BeyTop } from './BeyTop';
import { Button } from './ui/Button';
import { Icons } from './Icons';

/** 出戰的一顆陀螺；用來畫我方陣容。 */
export interface BeyBattleSide {
  childName: string;
  teamColor: 'purple' | 'orange';
  bladeId: string;
  ratchetId: string;
  bitId: string;
}

interface BeyBossBattleProps {
  boss: BeyBossDef;
  attempt: BeyBossAttempt;
  sides: BeyBattleSide[];
  /** 打贏完整版才有的專屬零件；減弱版的安慰獎無法事先得知是哪一件。 */
  rewardPart: BeyPartDef | null;
  onClose: () => void;
}

/** 兩軍滑入場的時間。 */
const ENTER_MS = 700;
/** 每回合的演出長度：數值跑動、撞擊、勝負。 */
const ROUND_MS = 1150;

/** 數值從 0 跑到最終值，讓孩子有時間比大小。 */
const useCountUp = (target: number, durationMs: number): number => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (durationMs <= 0) {
      setValue(target);
      return undefined;
    }

    const startedAt = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / durationMs, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [target, durationMs]);

  return value;
};

/** 一回合的比數列。最新的一回合數值會跑動，先前的直接顯示。 */
const RoundRow: React.FC<{ round: BeyBossRound; index: number; animate: boolean }> = ({
  round,
  index,
  animate,
}) => {
  const teamValue = useCountUp(round.teamValue, animate ? 520 : 0);
  const bossValue = useCountUp(round.bossValue, animate ? 520 : 0);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-bey-steel bg-bey-void/50 px-2.5 py-1.5 animate-pop">
      <span className="w-12 flex-shrink-0 text-[11px] font-normal text-bey-dim">第 {index + 1} 回合</span>
      <span className="w-8 flex-shrink-0 text-xs font-bold text-bey-ink">{ROUND_LABELS[round.stat]}</span>
      <span className="flex-1 text-xs font-bold tabular-nums text-bey-dim">
        <span className="text-bey-ink">{teamValue}</span>
        <span className="mx-1">vs</span>
        <span className="text-bey-ink">{bossValue}</span>
      </span>
      {round.upset && <span className="flex-shrink-0 text-[10px] font-bold text-bey-yellow">爆冷！</span>}
      <span className={`w-5 flex-shrink-0 text-right text-xs font-bold ${round.won ? 'text-bey-lime' : 'text-bey-red'}`}>
        {round.won ? '勝' : '敗'}
      </span>
    </div>
  );
};

/**
 * 魔王戰演出。勝負在按下開戰時就已經算完，這裡只是把已知的結果演一遍，
 * 所以節奏可以對準每一回合；一天只有一次機會，隨時都能跳過但不會跳掉結果。
 */
export const BeyBossBattle: React.FC<BeyBossBattleProps> = ({
  boss,
  attempt,
  sides,
  rewardPart,
  onClose,
}) => {
  const decided = useMemo(() => getDecidedRounds(attempt.rounds), [attempt]);
  const [revealed, setRevealed] = useState(0);
  const [done, setDone] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  const clearTimeouts = () => {
    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    decided.forEach((_, index) => {
      timeoutsRef.current.push(
        window.setTimeout(() => setRevealed(index + 1), ENTER_MS + index * ROUND_MS),
      );
    });
    timeoutsRef.current.push(
      window.setTimeout(() => setDone(true), ENTER_MS + decided.length * ROUND_MS),
    );
    return clearTimeouts;
  }, [decided]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // 跳過是跳到結果，不是關掉視窗；一天只有一次，別讓手滑變成沒看到
  const handleSkip = () => {
    clearTimeouts();
    setRevealed(decided.length);
    setDone(true);
  };

  const latest = revealed > 0 ? decided[revealed - 1] : null;
  const teamToppled = done && !attempt.won;
  const bossToppled = done && attempt.won;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="魔王戰"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bey-void/95 p-4"
    >
      <div className="w-full max-w-md">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-display text-[11px] font-bold tracking-[0.26em]" style={{ color: boss.color.main }}>
            BATTLE
          </p>
          {!done && (
            <button
              type="button"
              onClick={handleSkip}
              className="rounded-lg border border-bey-steel px-2.5 py-1 text-[11px] font-bold text-bey-dim transition-colors hover:text-bey-ink"
            >
              跳過
            </button>
          )}
        </div>

        <div className="relative overflow-hidden bg-bey-panel soft-card clip-notch p-3 md:p-4">
          <div className="pointer-events-none absolute inset-0 arena-rings opacity-50" aria-hidden="true" />
          {!done && (
            <div className="pointer-events-none absolute inset-0 speed-lines opacity-50" aria-hidden="true" />
          )}

          {/* 戰場：每揭曉一回合就震一下，爆冷震得更久 */}
          <div
            key={revealed}
            className={`relative flex items-stretch gap-2 ${
              revealed === 0 ? '' : latest?.upset ? 'bey-impact-hard' : 'bey-impact'
            }`}
          >
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 bey-enter-left">
              <div className={`flex items-end justify-center gap-1 ${latest && !latest.won ? 'bey-recoil-left' : ''}`}>
                {sides.map((side) => (
                  <BeyTop
                    key={side.childName}
                    color={side.teamColor}
                    size={sides.length > 1 ? 54 : 68}
                    speed={teamToppled ? 'idle' : 'fast'}
                    bladeId={side.bladeId}
                    ratchetId={side.ratchetId}
                    bitId={side.bitId}
                    className={teamToppled ? 'bey-topple' : ''}
                  />
                ))}
              </div>
              <p className="truncate text-center text-[11px] font-bold text-bey-ink">
                {sides.map((side) => side.childName).join('＋')}
              </p>
            </div>

            <div className="flex flex-shrink-0 items-center">
              <span className="font-display text-sm font-black tracking-[0.1em] text-bey-dim">VS</span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 bey-enter-right">
              <div className={`flex items-end justify-center ${latest?.won ? 'bey-recoil-right' : ''}`}>
                <BeyTop
                  variant="boss"
                  colorSet={boss.color}
                  size={68}
                  speed={bossToppled ? 'idle' : 'fast'}
                  className={bossToppled ? 'bey-topple' : ''}
                />
              </div>
              <p className="truncate text-center text-[11px] font-bold" style={{ color: boss.color.main }}>
                {boss.name}
                {attempt.weakened && <span className="ml-1 font-normal text-bey-dim">減弱版</span>}
              </p>
            </div>
          </div>

          {/* 回合比數，逐回合出現 */}
          <div className="relative mt-3 space-y-1.5" aria-live="polite">
            {decided.slice(0, revealed).map((round, index) => (
              <RoundRow
                key={round.stat}
                round={round}
                index={index}
                animate={index === revealed - 1 && !done}
              />
            ))}
          </div>

          {/* 收尾 */}
          {done && (
            <div className="relative mt-3 animate-pop">
              <p className={`text-base font-black ${attempt.won ? 'text-bey-lime' : 'text-bey-red'}`}>
                {attempt.won
                  ? attempt.weakened ? '打贏減弱版！' : `擊敗 ${boss.name}！`
                  : '這次輸了，明天再來'}
              </p>
              <p className="mt-0.5 text-xs font-normal text-bey-dim">
                {attempt.won
                  ? attempt.weakened
                    ? '拿到一個稀有零件。兩個人一起打才拿得到專屬零件。'
                    : '本週通關，兩人各拿到專屬零件。'
                  : '陀螺還在，零件也還在，週末還有一次機會。'}
              </p>

              {attempt.won && rewardPart && (
                <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-bey-yellow/50 bg-bey-void/50 p-2.5">
                  <div className="relative flex-shrink-0">
                    <BeyTop
                      size={44}
                      speed="fast"
                      bladeId={rewardPart.slot === 'BLADE' ? rewardPart.id : undefined}
                      ratchetId={rewardPart.slot === 'RATCHET' ? rewardPart.id : undefined}
                      bitId={rewardPart.slot === 'BIT' ? rewardPart.id : undefined}
                    />
                    <span
                      className="bey-shockwave pointer-events-none absolute inset-0 rounded-full border-2 border-bey-yellow"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[10px] font-bold tracking-[0.2em] text-bey-yellow">BOSS PART</p>
                    <p className="truncate text-sm font-bold text-bey-ink">{rewardPart.name}</p>
                  </div>
                </div>
              )}

              <Button variant="primary" size="sm" className="mt-3 w-full" onClick={onClose} icon={<Icons.X size={15} />}>
                關閉
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
