import React, { useEffect, useMemo, useRef } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { BeyBossAttempt } from '../types';
import { BeyBossDef } from '../services/beyBossData';
import { getDecidedRounds } from '../services/beyBossUtils';
import { ARENA_ENTER_MS, ARENA_MAX_HP, ArenaScript, buildArenaScript } from '../services/beyArenaScript';
import { BeyTop } from './BeyTop';
import type { BeyBattleSide } from './BeyBossBattle';

/**
 * 魔王戰的俯視競技場，這是演出唯一的繪製層。
 * 時間軸來自 beyArenaScript、貼圖來自 BeyTop；之後若換成 Phaser，只重寫這個檔案，
 * props 介面保持不變。
 *
 * Canvas 裡沒有 Tailwind，顏色直接用 index.html 主題設定裡的色碼。
 */

interface BeyArenaCanvasProps {
  sides: BeyBattleSide[];
  boss: BeyBossDef;
  attempt: BeyBossAttempt;
  /** 跳過演出時直接畫終局。 */
  skipped: boolean;
}

const COLORS = {
  void: '#05080F',
  deep: '#0D1424',
  panel: '#16213A',
  steel: '#2C3B60',
  dim: '#9FB3D9',
  yellow: '#FCEE21',
  purple: '#D47CFF',
  orange: '#FF7A2F',
};

/** 邏輯座標：整張畫布是 1000×1000，繪製時再依實際像素縮放。 */
const SIZE = 1000;
const C = SIZE / 2;
const R = 440;
const BOSS_R = 80;
const TEAM_R_SINGLE = 64;
const TEAM_R_DOUBLE = 54;
/** 一般回合輸家被撞開的距離，與終局被撞到場邊的距離。 */
const KNOCK = 200;
const FINAL_KNOCK = 320;
/** 兩個孩子同時撞魔王時，兩個撞擊方向至少要分開的角度（弧度），才不會疊在一起。 */
const MIN_SPLIT = 1.4;
/** 防重疊修正量的緩動時間常數（毫秒）。 */
const CORRECTION_MS = 50;

const TEXTURE_PX = 256;
const TAU = Math.PI * 2;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x: number) => {
  const v = clamp01(x);
  return v * v * (3 - 2 * v);
};
const easeOut = (x: number) => 1 - (1 - clamp01(x)) ** 3;

interface Vec {
  x: number;
  y: number;
}
const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: Vec, k: number): Vec => ({ x: a.x * k, y: a.y * k });
const mix = (a: Vec, b: Vec, k: number): Vec => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
const fromAngle = (a: number): Vec => ({ x: Math.cos(a), y: Math.sin(a) });
const unit = (a: Vec): Vec => {
  const len = Math.hypot(a.x, a.y);
  return len < 1e-6 ? { x: 1, y: 0 } : mul(a, 1 / len);
};

/**
 * 每顆陀螺各自一組亂數，決定它的遊走路線：
 * 一個繞場的大圈，再疊上幾個不同頻率的擺動，路線不規則但速度連續，轉向才會順。
 */
type Seed = number[];
const makeSeed = (orbitPhase: number): Seed => [Math.random(), Math.random(), orbitPhase, ...Array.from({ length: 5 }, Math.random)];

const wander = (t: number, s: Seed): Vec => {
  const a = t * (0.0008 + s[0] * 0.0006) + s[2] * TAU;
  const orbitR = R * (0.26 + s[1] * 0.14);
  const n1 = t * (0.0013 + s[3] * 0.0007) + s[4] * TAU;
  const n2 = t * (0.0019 + s[5] * 0.0009) + s[6] * TAU;
  const n3 = t * (0.0007 + s[7] * 0.0005);
  return {
    x: C + Math.cos(a) * orbitR + Math.sin(n1) * R * 0.18 + Math.cos(n3 * 1.7 + s[4] * 5) * R * 0.08,
    y: C + Math.sin(a) * orbitR + Math.cos(n2) * R * 0.16 + Math.sin(n3 * 1.3 + s[6] * 5) * R * 0.08,
  };
};

interface Motion {
  teamSeeds: Seed[];
  bossSeed: Seed;
  teamR: number;
}

interface Layout {
  team: Vec[];
  boss: Vec;
  /** 0→1：輸家倒下的程度。 */
  teamFall: number;
  bossFall: number;
  /** 0→1：倒下前的搖晃。 */
  teamWobble: number;
  bossWobble: number;
  /** 自轉速度倍率；終局輸家會慢慢停下。 */
  teamSpin: number;
  bossSpin: number;
}

/** 某一刻每個孩子要從魔王的哪一側撞進去：沿用各自當下的方位，兩人太靠近就往兩邊拉開。 */
const contactDirs = (m: Motion, at: number): Vec[] => {
  const bossAt = wander(at, m.bossSeed);
  const dirs = m.teamSeeds.map((seed) => unit(sub(wander(at, seed), bossAt)));
  if (dirs.length !== 2) return dirs;
  const a0 = Math.atan2(dirs[0].y, dirs[0].x);
  let diff = Math.atan2(dirs[1].y, dirs[1].x) - a0;
  while (diff > Math.PI) diff -= TAU;
  while (diff < -Math.PI) diff += TAU;
  if (Math.abs(diff) >= MIN_SPLIT) return dirs;
  const mid = a0 + diff / 2;
  const sign = diff >= 0 ? 1 : -1;
  return [fromAngle(mid - (sign * MIN_SPLIT) / 2), fromAngle(mid + (sign * MIN_SPLIT) / 2)];
};

/** 收尾：誰都不能出場、彼此不能疊在一起（孩子被推開，魔王比較重不動）。 */
const settle = (layout: Layout, m: Motion): Layout => {
  const keepInside = (p: Vec, radius: number) => {
    const d = sub(p, { x: C, y: C });
    const max = R - radius - 8;
    const len = Math.hypot(d.x, d.y);
    return len > max ? add({ x: C, y: C }, mul(d, max / len)) : p;
  };
  const boss = keepInside(layout.boss, BOSS_R);
  let team = layout.team.map((p) => keepInside(p, m.teamR));
  // 兩個孩子之間至少留一顆陀螺的空隙，看起來才是各打各的；略小於一起撞魔王時的間距
  const minPair = m.teamR * 3 + 8;
  const minBoss = m.teamR + BOSS_R;
  // 推開一個可能又撞上另一個，來回幾次就會穩定
  for (let pass = 0; pass < 4; pass += 1) {
    if (team.length === 2) {
      const d = sub(team[1], team[0]);
      const len = Math.hypot(d.x, d.y);
      if (len < minPair) {
        const push = mul(unit(d), (minPair - len) / 2);
        team = [sub(team[0], push), add(team[1], push)];
      }
    }
    team = team.map((p) => {
      const d = sub(p, boss);
      const len = Math.hypot(d.x, d.y);
      return keepInside(len < minBoss - 0.5 ? add(boss, mul(unit(d), minBoss)) : p, m.teamR);
    });
  }
  return { ...layout, team, boss };
};

/**
 * 從 from 衝向魔王身上 dir 那一側的撞擊點。繞著魔王走弧線而不是直線，
 * 才不會穿過魔王、被推到另一邊而瞬移。
 */
const approach = (boss: Vec, from: Vec, dir: Vec, contact: number, k: number): Vec => {
  if (k <= 0) return from;
  const rel = sub(from, boss);
  const a0 = Math.atan2(rel.y, rel.x);
  let da = Math.atan2(dir.y, dir.x) - a0;
  while (da > Math.PI) da -= TAU;
  while (da < -Math.PI) da += TAU;
  const r = Math.hypot(rel.x, rel.y);
  return add(boss, mul(fromAngle(a0 + da * k), r + (contact - r) * k));
};

/**
 * 由時間推算每顆陀螺的位置。純函式，跳過演出時直接帶入終局時間即可。
 * resolve=false 回傳還沒做防重疊的原始路線，畫面用它來把防重疊的修正量平滑掉。
 */
const layoutAt = (t: number, script: ArenaScript, m: Motion, resolve = true): Layout => {
  const contact = m.teamR + BOSS_R;
  const layout: Layout = {
    team: m.teamSeeds.map((seed) => wander(t, seed)),
    boss: wander(t, m.bossSeed),
    teamFall: 0,
    bossFall: 0,
    teamWobble: 0,
    bossWobble: 0,
    teamSpin: 1,
    bossSpin: 1,
  };
  const { rounds } = script;
  const n = m.teamSeeds.length;

  // 進場：每顆從自己路線起點的那一側直直滑進來，彼此不會交錯
  if (t < ARENA_ENTER_MS || rounds.length === 0) {
    const k = easeOut(t / ARENA_ENTER_MS);
    const entry = (seed: Seed) => {
      const start = wander(ARENA_ENTER_MS, seed);
      return add({ x: C, y: C }, mul(unit(sub(start, { x: C, y: C })), R * 1.3));
    };
    layout.team = layout.team.map((p, i) => mix(entry(m.teamSeeds[i]), p, k));
    layout.boss = mix(entry(m.bossSeed), layout.boss, k);
    return resolve ? settle(layout, m) : layout;
  }

  let index = rounds.findIndex((round) => t < round.endMs);
  const isFinal = index === -1 || index === rounds.length - 1;
  if (index === -1) index = rounds.length - 1;
  const round = rounds[index];
  const span = round.impactMs - round.startMs;

  // 撞擊前：各自遊走，中途輪到一個孩子去擦撞一下，最後一起衝向魔王
  if (t < round.impactMs) {
    const p = (t - round.startMs) / span;
    const grazer = index % n;
    const graze = smooth(1 - Math.abs(p - 0.45) / 0.16);
    if (graze > 0) {
      const dir = contactDirs(m, round.startMs + span * 0.45)[grazer];
      layout.team[grazer] = approach(layout.boss, layout.team[grazer], dir, contact, graze);
    }
    const charge = smooth((p - 0.68) / 0.32);
    if (charge > 0) {
      const dirs = contactDirs(m, round.impactMs);
      layout.team = layout.team.map((pt, i) => approach(layout.boss, pt, dirs[i], contact, charge));
    }
    return resolve ? settle(layout, m) : layout;
  }

  const dirs = contactDirs(m, round.impactMs);
  const teamLost = isFinal ? !script.teamWon : !round.won;
  // 魔王被撞開的方向：孩子們撞進來的反方向
  const bossAway = mul(unit(dirs.reduce(add, { x: 0, y: 0 })), -1);

  if (!isFinal) {
    // 一般回合：輸的一方被撞開再回到自己的路線，贏的一方直接放開
    const u = (t - round.impactMs) / (round.endMs - round.impactMs);
    const hold = 1 - smooth(u / 0.5);
    const kick = (u < 0.2 ? easeOut(u / 0.2) : 1 - smooth((u - 0.2) / 0.8)) * KNOCK;
    layout.team = layout.team.map((pt, i) => {
      const held = approach(layout.boss, pt, dirs[i], contact, hold);
      return teamLost ? add(held, mul(dirs[i], kick)) : held;
    });
    if (!teamLost) layout.boss = add(layout.boss, mul(bossAway, kick));
    return resolve ? settle(layout, m) : layout;
  }

  // 終局：輸家被撞到場邊、減速、搖晃、倒下；贏家回到自己的路線繼續轉
  const u = t - round.impactMs;
  const bossAtHit = wander(round.impactMs, m.bossSeed);
  const teamAtHit = dirs.map((dir) => add(bossAtHit, mul(dir, contact)));
  const knock = FINAL_KNOCK * easeOut(u / 400);
  const back = smooth(u / 900);
  const fall = smooth((u - 600) / 500);
  const wobble = smooth((u - 150) / 400) * (1 - fall);
  const spin = 1 - smooth(u / 1100);

  if (teamLost) {
    layout.team = teamAtHit.map((hit, i) => add(hit, mul(dirs[i], knock)));
    layout.boss = mix(bossAtHit, layout.boss, back);
    layout.teamFall = fall;
    layout.teamWobble = wobble;
    layout.teamSpin = spin;
  } else {
    layout.boss = add(bossAtHit, mul(bossAway, knock));
    layout.team = layout.team.map((pt, i) => mix(teamAtHit[i], pt, back));
    layout.bossFall = fall;
    layout.bossWobble = wobble;
    layout.bossSpin = spin;
  }
  return resolve ? settle(layout, m) : layout;
};


interface Particle {
  kind: 'spark' | 'ring';
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
}

interface ArenaEvent {
  t: number;
  big: boolean;
  upset: boolean;
  /** 這一撞是哪幾個孩子撞上魔王（火花畫在各自的撞擊點）。 */
  hitters: number[];
}

/** 把 BeyTop 畫成圖片。場上轉的就是孩子自己組的那一顆，魔王也是自己的造型。 */
const renderTopImage = async (node: React.ReactElement): Promise<HTMLImageElement | null> => {
  // 從 effect 裡出來再 flushSync，否則 React 會抱怨在渲染中途同步刷新
  await Promise.resolve();
  const host = document.createElement('div');
  const root = createRoot(host);
  flushSync(() => root.render(node));
  const svg = host.querySelector('svg');
  // XMLSerializer 會補上 xmlns，data URL 的 SVG 少了它不會顯示
  const markup = svg ? new XMLSerializer().serializeToString(svg) : '';
  root.unmount();
  if (!markup) return null;

  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  try {
    await image.decode();
    return image;
  } catch {
    return null;
  }
};

const teamColorHex = (side: BeyBattleSide) => (side.teamColor === 'purple' ? COLORS.purple : COLORS.orange);

const drawArena = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = COLORS.deep;
  ctx.fillRect(0, 0, SIZE, SIZE);

  const floor = ctx.createRadialGradient(C, C, 0, C, C, R);
  floor.addColorStop(0, COLORS.panel);
  floor.addColorStop(1, COLORS.void);
  ctx.fillStyle = floor;
  ctx.beginPath();
  ctx.arc(C, C, R, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = COLORS.steel;
  ctx.lineWidth = 3;
  [R * 0.33, R * 0.66].forEach((ring) => {
    ctx.beginPath();
    ctx.arc(C, C, ring, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 刻度線
  ctx.lineWidth = 4;
  for (let i = 0; i < 12; i += 1) {
    const a = (Math.PI * 2 * i) / 12;
    ctx.beginPath();
    ctx.moveTo(C + Math.cos(a) * (R - 34), C + Math.sin(a) * (R - 34));
    ctx.lineTo(C + Math.cos(a) * (R - 8), C + Math.sin(a) * (R - 8));
    ctx.stroke();
  }

  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(C, C, R, 0, Math.PI * 2);
  ctx.stroke();
};

const drawTop = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  x: number,
  y: number,
  radius: number,
  angle: number,
  fallback: string,
  fall: number,
) => {
  ctx.save();
  ctx.translate(x, y);
  // 倒下：壓扁成側躺的橢圓並變暗
  if (fall > 0) {
    ctx.globalAlpha = 1 - 0.4 * fall;
    ctx.rotate(0.5);
    ctx.scale(1, 1 - 0.5 * fall);
    ctx.rotate(-0.5);
  }
  // 影子
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(6, 8, radius * 0.95, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(angle);
  if (image) {
    // BeyTop 的 viewBox 是 100，外圈能量環半徑 47；放大讓外圈剛好落在碰撞半徑上
    const drawSize = radius * 2 * (50 / 47);
    ctx.drawImage(image, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
  } else {
    ctx.fillStyle = fallback;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

/** 魔王的眼睛不轉：在旋轉的貼圖上再蓋一顆固定的。座標沿用 BeyTop 的 viewBox。 */
const drawBossEye = (ctx: CanvasRenderingContext2D, boss: BeyBossDef, x: number, y: number, radius: number, fall: number) => {
  const k = (radius * 2 * (50 / 47)) / 100;
  ctx.save();
  ctx.translate(x, y);
  if (fall > 0) {
    ctx.globalAlpha = 1 - 0.4 * fall;
    ctx.rotate(0.5);
    ctx.scale(1, 1 - 0.5 * fall);
    ctx.rotate(-0.5);
  }
  ctx.scale(k, k);
  ctx.fillStyle = COLORS.void;
  ctx.strokeStyle = boss.color.deep;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = boss.color.main;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.quadraticCurveTo(10, 0, 0, 12);
  ctx.quadraticCurveTo(-10, 0, 0, -12);
  ctx.fill();
  ctx.fillStyle = COLORS.void;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.quadraticCurveTo(3.5, 0, 0, 8);
  ctx.quadraticCurveTo(-3.5, 0, 0, -8);
  ctx.fill();
  ctx.restore();
};

/** 體力格：兩勝制，各兩格。 */
const drawHp = (
  ctx: CanvasRenderingContext2D,
  x: number,
  hp: number,
  fills: string[],
  alignRight: boolean,
) => {
  const segW = 130;
  const segH = 22;
  const gap = 10;
  for (let i = 0; i < ARENA_MAX_HP; i += 1) {
    // 右側（魔王）從右往左掉格，左側（我方）從左往右排
    const slot = alignRight ? ARENA_MAX_HP - 1 - i : i;
    const sx = x + slot * (segW + gap);
    ctx.fillStyle = COLORS.void;
    ctx.strokeStyle = COLORS.steel;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(sx, 36, segW, segH);
    ctx.fill();
    ctx.stroke();
    if (i < hp) {
      // 兩個孩子一起出戰時，每格左右各半，用兩人的隊色
      fills.forEach((fill, f) => {
        ctx.fillStyle = fill;
        ctx.fillRect(sx + 4 + ((segW - 8) / fills.length) * f, 40, (segW - 8) / fills.length, segH - 8);
      });
    }
  }
};

export const BeyArenaCanvas: React.FC<BeyArenaCanvasProps> = ({ sides, boss, attempt, skipped }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skippedRef = useRef(skipped);
  const script = useMemo(() => buildArenaScript(getDecidedRounds(attempt.rounds)), [attempt]);

  useEffect(() => {
    skippedRef.current = skipped;
  }, [skipped]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    let cancelled = false;
    let frameId = 0;
    const teamImages: (HTMLImageElement | null)[] = sides.map(() => null);
    let bossImage: HTMLImageElement | null = null;

    sides.forEach((side, index) => {
      void renderTopImage(
        <BeyTop size={TEXTURE_PX} bladeId={side.bladeId} ratchetId={side.ratchetId} bitId={side.bitId} />,
      ).then((image) => {
        if (!cancelled) teamImages[index] = image;
      });
    });
    void renderTopImage(<BeyTop variant="boss" colorSet={boss.color} size={TEXTURE_PX} />).then((image) => {
      if (!cancelled) bossImage = image;
    });

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(canvas.clientWidth * dpr);
      if (width > 0 && canvas.width !== width) {
        canvas.width = width;
        canvas.height = width;
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const teamR = sides.length > 1 ? TEAM_R_DOUBLE : TEAM_R_SINGLE;
    // 兩個孩子的繞場起點錯開半圈、魔王在中間，一開場就不會黏在一起
    // 三顆繞場速度相同、彼此錯開，才不會黏在一起或互相穿過；不規則感來自各自的擺動
    const phase = Math.random();
    const speed = Math.random();
    const withSpeed = (seed: Seed) => {
      seed[0] = speed;
      return seed;
    };
    const motion: Motion = {
      teamSeeds: sides.map((_, i) => withSpeed(makeSeed(phase + i * 0.5))),
      bossSeed: withSpeed(makeSeed(phase + 0.25)),
      teamR,
    };

    const events: ArenaEvent[] = script.rounds.flatMap((round, index) => [
      {
        t: round.startMs + (round.impactMs - round.startMs) * 0.45,
        big: false,
        upset: false,
        hitters: [index % sides.length],
      },
      { t: round.impactMs, big: true, upset: round.upset, hitters: sides.map((_, i) => i) },
    ]);

    const particles: Particle[] = [];
    let shakeUntil = 0;
    let shakeAmp = 0;
    let shakeLength = 1;
    let lastT = -1;
    let lastNow = 0;
    const teamAngles = sides.map(() => Math.random() * Math.PI * 2);
    let bossAngle = Math.random() * Math.PI * 2;
    let teamCorrection: Vec[] = sides.map(() => ({ x: 0, y: 0 }));
    let bossCorrection: Vec = { x: 0, y: 0 };
    const startedAt = performance.now();

    const spawn = (event: ArenaEvent, t: number) => {
      const layout = layoutAt(event.t, script, motion);
      event.hitters.forEach((i) => {
        const hit = add(layout.boss, mul(unit(sub(layout.team[i], layout.boss)), BOSS_R));
        const count = Math.round((event.big ? (event.upset ? 34 : 22) : 8) / (event.big ? Math.max(1, sides.length * 0.7) : 1));
        for (let s = 0; s < count; s += 1) {
          const a = Math.random() * Math.PI * 2;
          const speed = (event.big ? 0.5 : 0.3) + Math.random() * 0.6;
          particles.push({
            kind: 'spark',
            x: hit.x,
            y: hit.y,
            vx: Math.cos(a) * speed,
            vy: Math.sin(a) * speed,
            born: t,
            life: 250 + Math.random() * 250,
          });
        }
        if (event.big) particles.push({ kind: 'ring', x: hit.x, y: hit.y, vx: 0, vy: 0, born: t, life: 420 });
      });
      if (event.big) {
        shakeUntil = t + (event.upset ? 480 : 280);
        shakeLength = event.upset ? 480 : 280;
        shakeAmp = event.upset ? 18 : 9;
      }
    };

    const frame = (now: number) => {
      if (cancelled) return;
      const isSkipped = skippedRef.current;
      const t = isSkipped ? script.totalMs + 500 : now - startedAt;
      const dt = lastNow ? Math.min(now - lastNow, 50) : 16;
      lastNow = now;

      if (isSkipped) {
        particles.length = 0;
        shakeUntil = 0;
      } else {
        events.forEach((event) => {
          if (event.t > lastT && event.t <= t) spawn(event, t);
        });
      }
      lastT = t;

      // 防重疊的修正量在兩顆擦身而過時會瞬間換邊；只把這個修正量緩一下，路線本身與撞擊點不受影響
      const resolved = layoutAt(t, script, motion);
      const raw = layoutAt(t, script, motion, false);
      const follow = isSkipped ? 1 : 1 - Math.exp(-dt / CORRECTION_MS);
      const ease = (current: Vec, settled: Vec, base: Vec) => mix(current, sub(settled, base), follow);
      teamCorrection = teamCorrection.map((c, i) => ease(c, resolved.team[i], raw.team[i]));
      bossCorrection = ease(bossCorrection, resolved.boss, raw.boss);
      const layout: Layout = {
        ...resolved,
        team: raw.team.map((p, i) => add(p, teamCorrection[i])),
        boss: add(raw.boss, bossCorrection),
      };

      teamAngles.forEach((_, i) => {
        teamAngles[i] += dt * 0.03 * layout.teamSpin;
      });
      bossAngle -= dt * 0.024 * layout.bossSpin;

      const scale = canvas.width / SIZE;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.globalAlpha = 1;

      ctx.save();
      if (t < shakeUntil) {
        const k = (shakeUntil - t) / shakeLength;
        ctx.translate((Math.random() - 0.5) * 2 * shakeAmp * k, (Math.random() - 0.5) * 2 * shakeAmp * k);
      }

      drawArena(ctx);

      const wobbleAt = (w: number) => ({ x: Math.cos(t * 0.02) * 10 * w, y: Math.sin(t * 0.02) * 10 * w });
      const teamWob = wobbleAt(layout.teamWobble);
      const bossWob = wobbleAt(layout.bossWobble);

      // 倒下的那一方先畫，贏家壓在上面
      const drawTeam = () => sides.forEach((side, i) => {
        drawTop(
          ctx,
          teamImages[i],
          layout.team[i].x + teamWob.x,
          layout.team[i].y + teamWob.y,
          teamR,
          teamAngles[i],
          teamColorHex(side),
          layout.teamFall,
        );
      });
      const drawBoss = () => {
        const bx = layout.boss.x + bossWob.x;
        const by = layout.boss.y + bossWob.y;
        drawTop(ctx, bossImage, bx, by, BOSS_R, bossAngle, boss.color.main, layout.bossFall);
        if (bossImage) drawBossEye(ctx, boss, bx, by, BOSS_R, layout.bossFall);
      };
      if (layout.teamFall > 0) {
        drawTeam();
        drawBoss();
      } else {
        drawBoss();
        drawTeam();
      }

      // 火花
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const p = particles[i];
        const age = t - p.born;
        if (age > p.life) {
          particles.splice(i, 1);
          continue;
        }
        const k = 1 - age / p.life;
        if (p.kind === 'ring') {
          ctx.globalAlpha = k * 0.9;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 6 * k + 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 20 + (1 - k) * 120, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          const x = p.x + p.vx * age;
          const y = p.y + p.vy * age;
          ctx.globalAlpha = k;
          ctx.strokeStyle = COLORS.yellow;
          ctx.lineWidth = 5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - p.vx * 32, y - p.vy * 32);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // 體力格不跟著震
      const lostBefore = (teamSide: boolean) =>
        script.rounds.filter((round) => round.impactMs <= t && (teamSide ? !round.won : round.won)).length;
      drawHp(ctx, 40, ARENA_MAX_HP - lostBefore(true), sides.map(teamColorHex), false);
      drawHp(ctx, SIZE - 40 - (130 * ARENA_MAX_HP + 10), ARENA_MAX_HP - lostBefore(false), [boss.color.main], true);

      frameId = window.requestAnimationFrame(frame);
    };

    frameId = window.requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [script, sides, boss]);

  return <canvas ref={canvasRef} aria-hidden="true" className="block aspect-square w-full" />;
};
