import { chapters, events } from '../data/chapters';
import { characters } from '../data/characters';
import { factById } from '../data/facts';
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
export interface PagePickup {
  x: number;
  y: number;
  id: string;
  collected: boolean;
}
export interface Enemy extends Rect {
  baseX: number;
  range: number;
  phase: number;
  alive: boolean;
}
export interface Stop {
  x: number;
  y: number;
  eventId: string;
  name: string;
  visited: boolean;
}
export interface World {
  level: number;
  title: string;
  theme: Theme;
  width: number;
  platforms: Platform[];
  pages: PagePickup[];
  enemies: Enemy[];
  spikes: Rect[];
  springs: Rect[];
  stops: Stop[];
  exit: Rect;
}
export function makeWorld(level: number, collected: string[] = []): World {
  const chapter = chapters[level];
  const scenes = events.filter((e) => e.chapter === chapter.id);
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
    pages: PagePickup[] = [],
    enemies: Enemy[] = [],
    spikes: Rect[] = [],
    springs: Rect[] = [],
    stops: Stop[] = [];
  const width = scenes.length * 900 + 480;
  // Every zone has a traversable ground route, an optional upper route, and a safe checkpoint.
  for (let zone = 0; zone < scenes.length; zone++) {
    const scene = scenes[zone],
      x = zone * 900;
    const heights = [
      [432, 344, 292, 377],
      [450, 366, 287, 396],
      [408, 333, 268, 354],
    ][(zone + level) % 3];
    platforms.push(
      { x, y: 520, w: 350, h: 100, kind: 'ground' },
      { x: x + 425, y: 520, w: 255, h: 100, kind: 'ground' },
      { x: x + 755, y: 520, w: 145, h: 100, kind: 'ground' },
    );
    platforms.push(
      { x: x + 180, y: heights[0], w: 115, h: 17, kind: 'wood' },
      { x: x + 310, y: heights[1], w: 115, h: 17, kind: 'roof' },
      { x: x + 468, y: heights[2], w: 112, h: 17, kind: 'roof' },
      { x: x + 630, y: heights[3], w: 110, h: 17, kind: 'wood' },
    );
    if (level >= 2)
      platforms.push({
        x: x + 350,
        y: 440,
        w: 66,
        h: 15,
        kind: 'moving',
        originY: 440,
        phase: zone * 1.7,
      });
    springs.push({ x: x + 141, y: 505, w: 27, h: 15 });
    const fs = scene.factIds.map((id) => factById[id]);
    const slots = [
      [75, 469],
      [244, heights[0] - 44],
      [367, heights[1] - 43],
      [522, heights[2] - 43],
      [683, heights[3] - 44],
      [800, 466],
    ];
    fs.forEach((f, i) => {
      const [px, py] = slots[i % slots.length];
      pages.push({
        id: f.id,
        x: x + px + Math.floor(i / slots.length) * 31,
        y: py - Math.floor(i / slots.length) * 22,
        collected: collected.includes(f.id),
      });
    });
    if (zone > 0 || level > 0)
      enemies.push({
        x: x + 560,
        y: 470,
        w: 28,
        h: 28,
        baseX: x + 558,
        range: 48,
        phase: zone * 2.3,
        alive: true,
      });
    if (level > 2 && zone % 2 === 1)
      enemies.push({
        x: x + 450,
        y: heights[2] - 38,
        w: 26,
        h: 26,
        baseX: x + 505,
        range: 37,
        phase: zone,
        alive: true,
      });
    if (level >= 1) spikes.push({ x: x + 702, y: 566, w: 37, h: 14 });
    const person = characters.find((c) => c.factIds.some((id) => scene.factIds.includes(id)));
    stops.push({
      x: x + 30,
      y: 520,
      eventId: scene.id,
      name: scene.dialogue?.speaker.replace(/\s*\(.*?\)/g, '') ?? person?.name ?? scene.title,
      visited: zone === 0,
    });
  }
  platforms.push({ x: width - 480, y: 520, w: 480, h: 100, kind: 'ground' });
  return {
    level,
    title: chapter.title,
    theme,
    width,
    platforms,
    pages,
    enemies,
    spikes,
    springs,
    stops,
    exit: { x: width - 140, y: 414, w: 77, h: 106 },
  };
}
export const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export interface Controls {
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
  interact: boolean;
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
