import { chapters } from '../data/chapters';
import { weapons, type Weapon } from './loadouts';
export type Theme = 'garden' | 'boston' | 'harbor' | 'london' | 'philadelphia' | 'library';
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Platform extends Rect {
  kind: 'ground' | 'roof' | 'wood' | 'moving';
  originY?: number;
  phase?: number;
}
export type EnemyKind = 'skitter' | 'sentry' | 'flyer' | 'guardian';
export interface Enemy extends Rect {
  id: number;
  kind: EnemyKind;
  baseX: number;
  baseY: number;
  range: number;
  phase: number;
  alive: boolean;
  hp: number;
  maxHp: number;
  facing: number;
  state: 'patrol' | 'windup' | 'attack' | 'recover';
  timer: number;
  hurt: number;
  zone: number;
  vx: number;
}
export interface Stop {
  x: number;
  y: number;
  eventId: string;
  name: string;
  visited: boolean;
}
export interface Pickup {
  x: number;
  y: number;
  kind: 'heart' | 'power';
  collected: boolean;
}
export interface Gate extends Rect {
  zone: number;
  open: boolean;
}
export interface World {
  level: number;
  title: string;
  theme: Theme;
  width: number;
  weapon: Weapon;
  platforms: Platform[];
  enemies: Enemy[];
  springs: Rect[];
  stops: Stop[];
  checkpoints: number[];
  pickups: Pickup[];
  gates: Gate[];
  exit: Rect;
}
export function makeWorld(level: number): World {
  const theme: Theme = (
    [
      'garden',
      'boston',
      'harbor',
      'philadelphia',
      'london',
      'london',
      'harbor',
      'philadelphia',
      'library',
      'boston',
      'philadelphia',
      'library',
    ] as const
  )[level];
  const platforms: Platform[] = [],
    enemies: Enemy[] = [],
    springs: Rect[] = [],
    pickups: Pickup[] = [];
  function enemy(kind: EnemyKind, x: number, y: number, zone: number) {
    const boss = kind === 'guardian',
      size = boss ? 62 : kind === 'flyer' ? 30 : 32;
    const hp = boss ? 12 + level : kind === 'sentry' ? 3 : 2;
    enemies.push({
      id: enemies.length,
      kind,
      x,
      y: y - size,
      w: size,
      h: size,
      baseX: x,
      baseY: y - size,
      range: boss ? 135 : 55,
      phase: enemies.length * 1.3,
      alive: true,
      hp,
      maxHp: hp,
      facing: -1,
      state: 'patrol',
      timer: 1 + enemies.length * 0.17,
      hurt: 0,
      zone,
      vx: 0,
    });
  }
  for (let zone = 0; zone < 3; zone++) {
    const x = zone * 900;
    if (zone === 1) platforms.push({ x, y: 520, w: 900, h: 100, kind: 'ground' });
    else
      platforms.push(
        { x, y: 520, w: 380, h: 100, kind: 'ground' },
        { x: x + 450, y: 520, w: 270, h: 100, kind: 'ground' },
        { x: x + 795, y: 520, w: 105, h: 100, kind: 'ground' },
      );
    const heights = [
      [435, 348, 300, 400],
      [430, 357, 285, 381],
      [419, 338, 280, 370],
    ][(level + zone) % 3];
    [190, 325, 490, 660].forEach((offset, i) =>
      platforms.push({
        x: x + offset,
        y: heights[i],
        w: 110,
        h: 16,
        kind: i % 2 ? 'roof' : 'wood',
      }),
    );
    if (zone !== 1) springs.push({ x: x + 146, y: 505, w: 27, h: 15 });
    if (level > 1)
      platforms.push({
        x: x + 378,
        y: 443,
        w: 62,
        h: 15,
        kind: 'moving',
        originY: 443,
        phase: zone * 1.4,
      });
    pickups.push({
      x: x + 530,
      y: heights[2] - 25,
      kind: zone === 2 ? 'power' : 'heart',
      collected: false,
    });
    enemy(zone === 0 ? 'skitter' : (level + zone) % 2 ? 'sentry' : 'skitter', x + 550, 520, zone);
    if (zone > 0) enemy('skitter', x + 290, 520, zone);
    if (zone === 1) enemy('sentry', x + 690, 520, zone);
    if (zone === 2 && level > 0) enemy('flyer', x + 655, 408, zone);
  }
  platforms.push(
    { x: 2700, y: 520, w: 800, h: 100, kind: 'ground' },
    { x: 2850, y: 412, w: 100, h: 16, kind: 'wood' },
    { x: 3140, y: 398, w: 105, h: 16, kind: 'wood' },
  );
  enemy('guardian', 3090, 520, 3);
  pickups.push({ x: 2780, y: 491, kind: 'heart', collected: false });
  return {
    level,
    title: chapters[level].title,
    theme,
    width: 3500,
    weapon: weapons[level],
    platforms,
    enemies,
    springs,
    stops: [{ x: 110, y: 520, eventId: `guide-${level}`, name: 'Story guide', visited: true }],
    checkpoints: [70, 970, 1870, 2770],
    pickups,
    gates: [
      { x: 1745, y: 0, w: 22, h: 520, zone: 1, open: false },
      { x: 3320, y: 0, w: 24, h: 520, zone: 3, open: false },
    ],
    exit: { x: 3380, y: 414, w: 77, h: 106 },
  };
}
export const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export const canEnterExit = (world: World, player: Rect) =>
  world.gates.every((gate) => gate.open) &&
  Math.abs(player.x - world.exit.x) < 100 &&
  player.y > 330;
export interface Controls {
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
  interact: boolean;
  attack: boolean;
}
export interface Player extends Rect {
  vx: number;
  vy: number;
  grounded: boolean;
  jumps: number;
  coyote: number;
  jumpBuffer: number;
  dashTime: number;
  dashCooldown: number;
  airDash: boolean;
  facing: number;
  invincible: number;
}
export function newPlayer(x = 70, y = 478): Player {
  return {
    x,
    y,
    w: 24,
    h: 42,
    vx: 0,
    vy: 0,
    grounded: false,
    jumps: 0,
    coyote: 0,
    jumpBuffer: 0,
    dashTime: 0,
    dashCooldown: 0,
    airDash: true,
    facing: 1,
    invincible: 0,
  };
}
export interface PhysicsResult {
  jumped: boolean;
  dashed: boolean;
  landed: boolean;
}
export function movePlayer(
  player: Player,
  controls: Controls,
  pressed: { jump: boolean; dash: boolean },
  platforms: Platform[],
  dt: number,
): PhysicsResult {
  const p = player,
    result = { jumped: false, dashed: false, landed: false };
  p.invincible = Math.max(0, p.invincible - dt);
  p.dashCooldown = Math.max(0, p.dashCooldown - dt);
  p.coyote = Math.max(0, p.coyote - dt);
  p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
  if (pressed.jump) p.jumpBuffer = 0.13;
  const direction = Number(controls.right) - Number(controls.left);
  if (direction) p.facing = direction;
  if (pressed.dash && p.dashCooldown === 0 && (p.grounded || p.airDash)) {
    p.dashTime = 0.17;
    p.dashCooldown = 0.7;
    p.airDash = false;
    p.vy = 0;
    result.dashed = true;
  }
  if (p.jumpBuffer > 0 && (p.grounded || p.coyote > 0 || p.jumps < 2)) {
    p.vy = p.grounded || p.coyote > 0 ? -580 : -505;
    p.jumps = p.grounded || p.coyote > 0 ? 1 : 2;
    p.grounded = false;
    p.coyote = 0;
    p.jumpBuffer = 0;
    result.jumped = true;
  }
  const oldBottom = p.y + p.h;
  if (p.dashTime > 0) {
    p.dashTime = Math.max(0, p.dashTime - dt);
    p.vx = p.facing * 650;
    p.vy = 0;
  } else {
    const target = direction * 265;
    p.vx += (target - p.vx) * Math.min(1, dt * (direction ? 13 : 17));
    p.vy += 1750 * dt;
    if (!controls.jump && p.vy < -210) p.vy += 1600 * dt;
  }
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.grounded = false;
  for (const plat of platforms) {
    if (
      p.vy >= 0 &&
      oldBottom <= plat.y + 9 &&
      p.y + p.h >= plat.y &&
      p.x + p.w > plat.x + 1 &&
      p.x < plat.x + plat.w - 1
    ) {
      p.y = plat.y - p.h;
      p.vy = 0;
      p.grounded = true;
      p.jumps = 0;
      p.coyote = 0.12;
      p.airDash = true;
      result.landed = true;
    }
  }
  p.x = Math.max(0, p.x);
  return result;
}
