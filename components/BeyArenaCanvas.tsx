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
const REST = R * 0.52;
const BOSS_R = 80;
const TEAM_R_SINGLE = 64;
const TEAM_R_DOUBLE = 54;
/** 兩顆我方陀螺並排時，各自離隊伍中心的距離。 */
const FORMATION_FACTOR = 1.1;

const TEXTURE_PX = 256;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x: number) => {
  const v = clamp01(x);
  return v * v * (3 - 2 * v);
};
const easeOut = (x: number) => 1 - (1 - clamp01(x)) ** 3;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const orbit = (t: number) => Math.PI + t * 0.0011;

interface Pose {
  teamD: number;
  bossD: number;
  teamTheta: number;
  bossTheta: number;
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

/** 由時間推算雙方位置。純函式，跳過演出時直接帶入終局時間即可。 */
const poseAt = (t: number, script: ArenaScript, half: number): Pose => {
  const pose: Pose = {
    teamD: REST,
    bossD: REST,
    teamTheta: orbit(t),
    bossTheta: orbit(t) + Math.PI,
    teamFall: 0,
    bossFall: 0,
    teamWobble: 0,
    bossWobble: 0,
    teamSpin: 1,
    bossSpin: 1,
  };
  const { rounds } = script;

  if (t < ARENA_ENTER_MS || rounds.length === 0) {
    const d = lerp(R * 1.3, REST, easeOut(t / ARENA_ENTER_MS));
    pose.teamD = d;
    pose.bossD = d;
    return pose;
  }

  let index = rounds.findIndex((round) => t < round.endMs);
  const isFinal = index === -1 || index === rounds.length - 1;
  if (index === -1) index = rounds.length - 1;
  const round = rounds[index];

  // 撞擊前：繞場、中途擦撞一下、最後衝向對方
  if (t < round.impactMs) {
    const p = (t - round.startMs) / (round.impactMs - round.startMs);
    let d = lerp(REST, REST * 0.75, smooth(p));
    const clash = Math.max(0, 1 - Math.abs(p - 0.45) / 0.08);
    d = lerp(d, half, clash);
    d = lerp(d, half, smooth((p - 0.82) / 0.18));
    pose.teamD = d;
    pose.bossD = d;
    return pose;
  }

  const teamLost = isFinal ? !script.teamWon : !round.won;

  if (!isFinal) {
    // 一般回合：輸的一方被撞飛到場邊再彈回來
    const u = (t - round.impactMs) / (round.endMs - round.impactMs);
    const loserD = u < 0.25
      ? lerp(half, R * 0.85, easeOut(u / 0.25))
      : lerp(R * 0.85, REST, smooth((u - 0.25) / 0.75));
    const winnerD = lerp(half, REST, smooth(u));
    pose.teamD = teamLost ? loserD : winnerD;
    pose.bossD = teamLost ? winnerD : loserD;
    return pose;
  }

  // 終局：輸家被撞到場邊、減速、搖晃、倒下；贏家留在場中央繼續轉
  const u = t - round.impactMs;
  const frozen = orbit(round.impactMs) + u * 0.0002;
  const loserD = lerp(half, R * 0.8, easeOut(u / 400));
  const winnerD = lerp(half, R * 0.18, smooth(u / 1000));
  const fall = smooth((u - 600) / 500);
  const wobble = smooth((u - 150) / 400) * (1 - fall);
  const spin = 1 - smooth(u / 1100);

  if (teamLost) {
    pose.teamD = loserD;
    pose.teamTheta = frozen;
    pose.teamFall = fall;
    pose.teamWobble = wobble;
    pose.teamSpin = spin;
    pose.bossD = winnerD;
  } else {
    pose.bossD = loserD;
    pose.bossTheta = frozen + Math.PI;
    pose.bossFall = fall;
    pose.bossWobble = wobble;
    pose.bossSpin = spin;
    pose.teamD = winnerD;
  }
  return pose;
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
    const offset = sides.length > 1 ? teamR * FORMATION_FACTOR : 0;
    // 兩顆並排時，要算到斜邊才會剛好碰到魔王
    const contact = Math.sqrt(Math.max((teamR + BOSS_R) ** 2 - offset ** 2, 0));
    const half = contact / 2;

    const events: ArenaEvent[] = script.rounds.flatMap((round) => [
      { t: round.startMs + (round.impactMs - round.startMs) * 0.45, big: false, upset: false },
      { t: round.impactMs, big: true, upset: round.upset },
    ]);

    const particles: Particle[] = [];
    let shakeUntil = 0;
    let shakeAmp = 0;
    let shakeLength = 1;
    let lastT = -1;
    let lastNow = 0;
    const teamAngles = sides.map(() => Math.random() * Math.PI * 2);
    let bossAngle = Math.random() * Math.PI * 2;
    const startedAt = performance.now();

    const positions = (pose: Pose) => {
      const dir = { x: Math.cos(pose.teamTheta), y: Math.sin(pose.teamTheta) };
      const perp = { x: -dir.y, y: dir.x };
      const anchor = { x: C + dir.x * pose.teamD, y: C + dir.y * pose.teamD };
      const offsets = sides.length > 1 ? [-offset, offset] : [0];
      const team = sides.map((_, i) => {
        const o = offsets[i] ?? 0;
        return { x: anchor.x + perp.x * o, y: anchor.y + perp.y * o };
      });
      const bossPos = { x: C + Math.cos(pose.bossTheta) * pose.bossD, y: C + Math.sin(pose.bossTheta) * pose.bossD };
      return { team, anchor, boss: bossPos };
    };

    const spawn = (event: ArenaEvent, t: number, half0: number) => {
      const pos = positions(poseAt(event.t, script, half0));
      const dx = pos.anchor.x - pos.boss.x;
      const dy = pos.anchor.y - pos.boss.y;
      const len = Math.hypot(dx, dy) || 1;
      const hitX = pos.boss.x + (dx / len) * BOSS_R;
      const hitY = pos.boss.y + (dy / len) * BOSS_R;
      const count = event.big ? (event.upset ? 34 : 22) : 8;
      for (let i = 0; i < count; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const speed = (event.big ? 0.5 : 0.3) + Math.random() * 0.6;
        particles.push({
          kind: 'spark',
          x: hitX,
          y: hitY,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          born: t,
          life: 250 + Math.random() * 250,
        });
      }
      if (event.big) {
        particles.push({ kind: 'ring', x: hitX, y: hitY, vx: 0, vy: 0, born: t, life: 420 });
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
          if (event.t > lastT && event.t <= t) spawn(event, t, half);
        });
      }
      lastT = t;

      const pose = poseAt(t, script, half);
      const pos = positions(pose);

      teamAngles.forEach((_, i) => {
        teamAngles[i] += dt * 0.03 * pose.teamSpin;
      });
      bossAngle -= dt * 0.024 * pose.bossSpin;

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
      const teamWob = wobbleAt(pose.teamWobble);
      const bossWob = wobbleAt(pose.bossWobble);

      // 倒下的那一方先畫，贏家壓在上面
      const drawTeam = () => sides.forEach((side, i) => {
        drawTop(
          ctx,
          teamImages[i],
          pos.team[i].x + teamWob.x,
          pos.team[i].y + teamWob.y,
          teamR,
          teamAngles[i],
          teamColorHex(side),
          pose.teamFall,
        );
      });
      const drawBoss = () => {
        drawTop(ctx, bossImage, pos.boss.x + bossWob.x, pos.boss.y + bossWob.y, BOSS_R, bossAngle, boss.color.main, pose.bossFall);
        if (bossImage) drawBossEye(ctx, boss, pos.boss.x + bossWob.x, pos.boss.y + bossWob.y, BOSS_R, pose.bossFall);
      };
      if (pose.teamFall > 0) {
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
