import { BeyBossRound } from '../types';

/**
 * 魔王戰演出的時間軸。勝負在按下開戰時就算完了，這裡只把已知結果排成一場戲：
 * 進場 → 每回合「繞場、擦撞、重擊」→ 輸家倒下。
 * 比數列（BeyBossBattle）和場上的撞擊（BeyArenaCanvas）讀同一份時間，兩邊才對得上。
 */

/** 雙方滑進場地的時間。 */
export const ARENA_ENTER_MS = 900;
/** 每回合長度；太短孩子看不清是誰撞飛了誰。 */
export const ARENA_ROUND_MS = 2000;
/** 回合開始後多久發生決定性的那一撞（比數列也在這一刻揭曉）。 */
export const ARENA_IMPACT_AT = 0.7;
/** 最後一撞之後，輸家減速、倒下的時間。 */
export const ARENA_FINISH_MS = 1300;
/** 兩勝制：雙方各有兩格體力，輸一回合掉一格。 */
export const ARENA_MAX_HP = 2;

export interface ArenaRoundScript {
  /** 我方是否贏下這回合。 */
  won: boolean;
  upset: boolean;
  startMs: number;
  impactMs: number;
  endMs: number;
  /** 這一撞之後雙方剩下的體力。 */
  teamHp: number;
  bossHp: number;
}

export interface ArenaScript {
  rounds: ArenaRoundScript[];
  /** 整場演完（輸家倒地）的時間。 */
  totalMs: number;
  teamWon: boolean;
}

/** decided 應是 getDecidedRounds() 的結果：只到定勝負的那一回合為止。 */
export const buildArenaScript = (decided: BeyBossRound[]): ArenaScript => {
  let teamHp = ARENA_MAX_HP;
  let bossHp = ARENA_MAX_HP;

  const rounds = decided.map((round, index) => {
    const startMs = ARENA_ENTER_MS + index * ARENA_ROUND_MS;
    if (round.won) bossHp -= 1;
    else teamHp -= 1;
    return {
      won: round.won,
      upset: round.upset,
      startMs,
      impactMs: startMs + ARENA_ROUND_MS * ARENA_IMPACT_AT,
      endMs: startMs + ARENA_ROUND_MS,
      teamHp,
      bossHp,
    };
  });

  const last = rounds[rounds.length - 1];
  return {
    rounds,
    totalMs: last ? last.impactMs + ARENA_FINISH_MS : ARENA_ENTER_MS,
    teamWon: bossHp < teamHp,
  };
};
