import type { ChapterId } from './data';
import { renderCampaign } from './render';

export type Control =
  'left' | 'right' | 'forward' | 'back' | 'turnLeft' | 'turnRight' | 'jump' | 'dash' | 'interact';
export interface CampaignStats {
  progress: number;
  focus: number;
  score: number;
  found: number;
  near: boolean;
  distance: number;
  surge: number;
  seconds: number;
  resets: number;
}
export interface Platform {
  x: number;
  y: number;
  w: number;
}
export const platforms: Platform[] = [
  { x: 0, y: 470, w: 840 },
  { x: 960, y: 470, w: 770 },
  { x: 1850, y: 470, w: 820 },
  { x: 2800, y: 470, w: 950 },
  { x: 330, y: 366, w: 140 },
  { x: 520, y: 307, w: 120 },
  { x: 1160, y: 365, w: 150 },
  { x: 1410, y: 300, w: 150 },
  { x: 2090, y: 360, w: 130 },
  { x: 2310, y: 305, w: 150 },
  { x: 2920, y: 362, w: 150 },
  { x: 3170, y: 315, w: 140 },
];
export const anchors = [680, 1570, 2440, 3280];
export const crossings = [170, 360, 550, 740];
// Symbolic reconstructed estate, not a historical floor plan.
export const estateMap = [
  '1111111111111111',
  '1000000000000001',
  '1000000222200001',
  '1000000200200001',
  '1000000200000001',
  '1000000222200001',
  '1000000000000001',
  '1033000000333001',
  '1030000000300001',
  '1030000000300001',
  '1033000000333001',
  '1000000000000001',
  '1000004004000001',
  '1000004004000001',
  '1000000000000001',
  '1111111111111111',
];
export const testimonySites = [
  { x: 6, y: 3.5, name: 'Garden fence' },
  { x: 4.5, y: 9, name: 'Stable' },
  { x: 11.5, y: 12.5, name: 'Roadside encounter' },
  { x: 12.5, y: 4, name: 'Listening post' },
];
export const finalSite = { x: 13.4, y: 1.8 };
export const riverRings = Array.from({ length: 18 }, (_, i) => ({
  z: 65 + i * 44,
  x: Math.sin(i * 1.9) * 0.55,
}));
export const riverRocks = Array.from({ length: 17 }, (_, i) => ({
  z: 105 + i * 42,
  x: Math.cos(i * 2.2) * 0.7,
}));
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export const wrapAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
export function wallAt(x: number, y: number) {
  return Number(estateMap[Math.floor(y)]?.[Math.floor(x)] ?? '1');
}
export function castRay(x: number, y: number, angle: number, max = 25) {
  const dx = Math.cos(angle),
    dy = Math.sin(angle);
  let mapX = Math.floor(x),
    mapY = Math.floor(y);
  const deltaX = Math.abs(1 / (dx || 1e-9)),
    deltaY = Math.abs(1 / (dy || 1e-9));
  const stepX = dx < 0 ? -1 : 1,
    stepY = dy < 0 ? -1 : 1;
  let sideX = (dx < 0 ? x - mapX : mapX + 1 - x) * deltaX,
    sideY = (dy < 0 ? y - mapY : mapY + 1 - y) * deltaY;
  let distance = 0,
    side = 0;
  for (let i = 0; i < 70; i++) {
    if (sideX < sideY) {
      distance = sideX;
      sideX += deltaX;
      mapX += stepX;
      side = 0;
    } else {
      distance = sideY;
      sideY += deltaY;
      mapY += stepY;
      side = 1;
    }
    const tile = wallAt(mapX, mapY);
    if (tile || distance > max)
      return {
        distance: Math.min(max, distance),
        tile,
        side,
        hit: side ? x + dx * distance : y + dy * distance,
      };
  }
  return { distance: max, tile: 1, side, hit: 0 };
}
export function canWalk(x: number, y: number) {
  return ![
    [-0.18, -0.18],
    [0.18, -0.18],
    [-0.18, 0.18],
    [0.18, 0.18],
  ].some(([dx, dy]) => wallAt(x + dx, y + dy));
}
export type EngineCallbacks = {
  memory: (index: number) => void;
  complete: (stats: CampaignStats) => void;
  stats: (stats: CampaignStats) => void;
  pause: () => void;
  effect: (kind: 'jump' | 'dash' | 'hit' | 'ring' | 'memory' | 'finish') => void;
};

export class CampaignEngine {
  controls: Record<Control, boolean> = {
    left: false,
    right: false,
    forward: false,
    back: false,
    turnLeft: false,
    turnRight: false,
    jump: false,
    dash: false,
    interact: false,
  };
  pressed = new Set<Control>();
  player = { x: 80, y: 416, vy: 0, vx: 0, w: 27, h: 54, grounded: true, jumps: 0, facing: 1 };
  boat = { x: 0, z: 0, tilt: 0 };
  eye = { x: 2.5, y: 2.5, angle: 0 };
  found = 0;
  time = 0;
  focus = 100;
  score = 0;
  resets = 0;
  surge = 1;
  flash = 0;
  dashTime = 0;
  surgeActive = false;
  notice = { text: '', life: 0 };
  trail: { x: number; y: number; life: number }[] = [];
  rings = new Set<number>();
  rocks = new Set<number>();
  paused = false;
  finished = false;
  pending = false;
  alert = 0;
  w = 1000;
  h = 650;
  scale = 1;
  private previous = 0;
  private frame = 0;
  private accumulator = 0;
  private invulnerable = 0;
  private coyote = 0;
  private dragX: number | null = null;
  private observer: ResizeObserver;
  private context: CanvasRenderingContext2D;
  private keyMap: Record<string, Control> = {
    KeyA: 'left',
    KeyD: 'right',
    KeyW: 'forward',
    KeyS: 'back',
    ArrowUp: 'forward',
    ArrowDown: 'back',
    Space: 'jump',
    ShiftLeft: 'dash',
    ShiftRight: 'dash',
    KeyE: 'interact',
  };
  constructor(
    public canvas: HTMLCanvasElement,
    public chapter: ChapterId,
    public relaxed: boolean,
    public reduced: boolean,
    private callbacks: EngineCallbacks,
    checkpoint = 0,
  ) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is unavailable.');
    this.context = context;
    this.found = Math.max(0, Math.min(4, Math.floor(checkpoint)));
    this.score = this.found * 250;
    if (this.found) {
      this.player.x = anchors[this.found - 1] + 35;
      this.boat.z = crossings[this.found - 1] + 4;
      this.eye.x = testimonySites[this.found - 1].x;
      this.eye.y = testimonySites[this.found - 1].y;
    }
    this.keyMap.ArrowLeft = chapter === 3 ? 'turnLeft' : 'left';
    this.keyMap.ArrowRight = chapter === 3 ? 'turnRight' : 'right';
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    window.addEventListener('blur', this.blur);
    document.addEventListener('visibilitychange', this.hidden);
    canvas.addEventListener('pointerdown', this.pointerDown);
    canvas.addEventListener('pointermove', this.pointerMove);
    canvas.addEventListener('pointerup', this.pointerUp);
    canvas.addEventListener('pointercancel', this.pointerUp);
    this.frame = requestAnimationFrame(this.loop);
    callbacks.stats(this.stats());
  }
  private resize() {
    const r = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.scale = Math.min(devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(this.w * this.scale);
    this.canvas.height = Math.round(this.h * this.scale);
  }
  private keyDown = (e: KeyboardEvent) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    )
      return;
    if (e.code === 'Escape' && !this.paused) {
      e.preventDefault();
      this.callbacks.pause();
      return;
    }
    const key = this.keyMap[e.code];
    if (key && !this.paused) {
      e.preventDefault();
      this.press(key);
    }
  };
  private keyUp = (e: KeyboardEvent) => {
    const key = this.keyMap[e.code];
    if (key) this.release(key);
  };
  private blur = () => {
    this.clearInput();
    if (!this.paused && !this.finished) this.callbacks.pause();
  };
  private hidden = () => {
    if (document.hidden) this.blur();
  };
  private pointerDown = (e: PointerEvent) => {
    if (this.chapter !== 3 || this.paused) return;
    this.dragX = e.clientX;
    this.canvas.setPointerCapture(e.pointerId);
  };
  private pointerMove = (e: PointerEvent) => {
    if (this.dragX === null || this.paused) return;
    this.eye.angle = wrapAngle(this.eye.angle + (e.clientX - this.dragX) * 0.006);
    this.dragX = e.clientX;
  };
  private pointerUp = () => {
    this.dragX = null;
  };
  press(key: Control) {
    if (this.paused || this.finished) return;
    if (!this.controls[key]) this.pressed.add(key);
    this.controls[key] = true;
  }
  release(key: Control) {
    this.controls[key] = false;
  }
  clearInput() {
    for (const key of Object.keys(this.controls) as Control[]) this.controls[key] = false;
    this.pressed.clear();
    this.dragX = null;
  }
  setPaused(paused: boolean) {
    this.paused = paused;
    this.clearInput();
  }
  private loop = (timestamp: number) => {
    const dt = Math.min(0.035, (timestamp - (this.previous || timestamp)) / 1000);
    this.previous = timestamp;
    if (!this.paused && !this.finished) this.update(dt);
    this.context.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    renderCampaign(this.context, this);
    this.accumulator += dt;
    if (this.accumulator > 0.08) {
      this.callbacks.stats(this.stats());
      this.accumulator = 0;
    }
    this.frame = requestAnimationFrame(this.loop);
  };
  update(dt: number) {
    if (this.paused || this.finished) return;
    this.time += dt;
    this.notice.life = Math.max(0, this.notice.life - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    if (this.chapter === 1) this.platform(dt);
    else if (this.chapter === 2) this.river(dt);
    else this.estate(dt);
    this.pressed.clear();
  }
  private encounter(index: number) {
    if (this.pending || index !== this.found) return;
    this.pending = true;
    this.setPaused(true);
    this.callbacks.effect('memory');
    this.callbacks.memory(index);
  }
  acceptMemory() {
    if (!this.pending) return;
    this.found++;
    this.pending = false;
    this.score += 250;
    this.focus = Math.min(100, this.focus + 20);
    this.setPaused(false);
    this.callbacks.stats(this.stats());
  }
  private finish() {
    if (this.finished || this.found !== 4) return;
    this.finished = true;
    this.clearInput();
    this.score += Math.max(0, 500 - this.resets * 80);
    this.callbacks.effect('finish');
    this.callbacks.complete(this.stats());
  }
  private damage(amount: number) {
    if (this.invulnerable > 0) return;
    this.focus = Math.max(0, this.focus - amount * (this.relaxed ? 0.45 : 1));
    this.invulnerable = 1.5;
    this.flash = 0.4;
    this.callbacks.effect('hit');
    if (this.focus === 0) this.reset();
  }
  reset() {
    this.notice = { text: 'BACK AT THE LAST LIGHT', life: 2 };
    this.resets++;
    this.focus = 100;
    this.flash = 0.55;
    this.invulnerable = 2;
    if (this.chapter === 1) {
      this.player.x = this.found ? anchors[this.found - 1] + 35 : 80;
      this.player.y = 400;
      this.player.vy = 0;
      this.player.jumps = 0;
    }
    if (this.chapter === 2) {
      this.boat.z = this.found ? crossings[this.found - 1] + 4 : 0;
      this.boat.x = 0;
    }
    if (this.chapter === 3) {
      const point = this.found ? testimonySites[this.found - 1] : { x: 2.5, y: 2.5 };
      this.eye.x = point.x;
      this.eye.y = point.y;
      this.alert = 0;
    }
  }
  private platform(dt: number) {
    const p = this.player,
      dir = Number(this.controls.right) - Number(this.controls.left);
    this.surge = Math.min(1, this.surge + dt * 0.72);
    this.dashTime = Math.max(0, this.dashTime - dt);
    if (dir) p.facing = dir;
    if (this.pressed.has('dash') && this.surge >= 0.85) {
      this.dashTime = 0.19;
      this.surge = 0;
      this.callbacks.effect('dash');
    }
    if (p.grounded) this.coyote = 0.12;
    else this.coyote -= dt;
    if (this.pressed.has('jump') && (p.jumps < 2 || this.coyote > 0)) {
      p.vy = p.jumps === 0 ? -550 : -495;
      p.jumps++;
      p.grounded = false;
      this.coyote = 0;
      this.callbacks.effect('jump');
    }
    const oldBottom = p.y + p.h;
    p.vx = this.dashTime > 0 ? p.facing * 720 : dir * 285;
    p.x = clamp(p.x + p.vx * dt, 20, 3670);
    p.vy = this.dashTime > 0 ? 0 : p.vy + 1450 * dt;
    p.y += p.vy * dt;
    p.grounded = false;
    for (const platform of platforms) {
      if (
        p.vy >= 0 &&
        oldBottom <= platform.y + 5 &&
        p.y + p.h >= platform.y &&
        p.x + p.w > platform.x &&
        p.x < platform.x + platform.w
      ) {
        p.y = platform.y - p.h;
        p.vy = 0;
        p.grounded = true;
        p.jumps = 0;
      }
    }
    if (p.y > 740) {
      this.reset();
      return;
    }
    // The moving veils are fictional memory obstacles, not people from the text.
    for (let i = 0; i < 3; i++) {
      const x = 1040 + i * 850 + Math.sin(this.time * 1.1 + i) * 60;
      const y = 410 + Math.sin(this.time * 1.6 + i) * 30;
      if (Math.hypot(p.x - x, p.y + 25 - y) < 35 && this.dashTime <= 0) this.damage(20);
    }
    this.trail = this.trail.filter((t) => (t.life -= dt) > 0);
    if (this.dashTime > 0) this.trail.push({ x: p.x, y: p.y, life: 0.17 });
    if (this.found < 4 && Math.abs(p.x - anchors[this.found]) < 60) this.encounter(this.found);
    if (p.x > 3580) {
      if (this.found === 4) this.finish();
      else p.x = 3570;
    }
  }
  private river(dt: number) {
    const b = this.boat,
      dir = Number(this.controls.right) - Number(this.controls.left);
    if (!this.controls.dash || this.surge <= 0) this.surgeActive = false;
    if (this.controls.dash && this.surge > 0.18) this.surgeActive = true;
    const surge = this.surgeActive;
    this.surge = clamp(this.surge + dt * (surge ? -0.28 : 0.16), 0, 1);
    const speed = this.controls.jump ? 7 : surge ? 24 : 15;
    b.z += speed * dt;
    b.x = clamp(
      b.x + dir * dt * 1.1 + Math.sin(b.z * 0.028) * dt * (this.relaxed ? 0.015 : 0.065),
      -0.93,
      0.93,
    );
    b.tilt += (dir - b.tilt) * Math.min(1, dt * 6);
    riverRings.forEach((r, i) => {
      if (!this.rings.has(i) && Math.abs(b.z - r.z) < 3 && Math.abs(b.x - r.x) < 0.24) {
        this.rings.add(i);
        this.notice = { text: 'CLEAN LINE  +70', life: 1.3 };
        this.score += 70;
        this.focus = Math.min(100, this.focus + 4);
        this.callbacks.effect('ring');
      }
    });
    riverRocks.forEach((r, i) => {
      if (!this.rocks.has(i) && Math.abs(b.z - r.z) < 3 && Math.abs(b.x - r.x) < 0.22) {
        this.rocks.add(i);
        this.damage(25);
        b.z -= 2;
      }
    });
    if (this.found < 4 && b.z >= crossings[this.found]) this.encounter(this.found);
    if (b.z >= 840 && this.found === 4) this.finish();
  }
  get sentinel() {
    return {
      x: 8 + Math.sin(this.time * 0.22) * 2,
      y: 7 + Math.cos(this.time * 0.22) * 2,
      angle: this.time * 0.42,
    };
  }
  private estate(dt: number) {
    const e = this.eye;
    e.angle = wrapAngle(
      e.angle + (Number(this.controls.turnRight) - Number(this.controls.turnLeft)) * dt * 1.9,
    );
    const forward = Number(this.controls.forward) - Number(this.controls.back),
      strafe = Number(this.controls.right) - Number(this.controls.left);
    const length = Math.max(1, Math.hypot(forward, strafe)),
      speed = ((this.controls.dash ? 3.5 : 2.15) * dt) / length;
    const dx = (Math.cos(e.angle) * forward - Math.sin(e.angle) * strafe) * speed,
      dy = (Math.sin(e.angle) * forward + Math.cos(e.angle) * strafe) * speed;
    if (canWalk(e.x + dx, e.y)) e.x += dx;
    if (canWalk(e.x, e.y + dy)) e.y += dy;
    const s = this.sentinel,
      dist = Math.hypot(e.x - s.x, e.y - s.y),
      angle = Math.atan2(e.y - s.y, e.x - s.x);
    const seen =
      dist < 4.2 &&
      Math.abs(wrapAngle(angle - s.angle)) < 0.5 &&
      castRay(s.x, s.y, angle, dist + 0.1).distance >= dist;
    this.alert = clamp(this.alert + dt * (seen ? (this.relaxed ? 0.22 : 0.55) : -0.45), 0, 1);
    if (this.alert >= 1) {
      this.damage(25);
      this.alert = 0.4;
    }
    if (this.found < 4) {
      const target = testimonySites[this.found];
      if (Math.hypot(e.x - target.x, e.y - target.y) < 1.25 && this.pressed.has('interact'))
        this.encounter(this.found);
    } else if (Math.hypot(e.x - finalSite.x, e.y - finalSite.y) < 1.1) this.finish();
  }
  stats(): CampaignStats {
    const target = this.found < 4 ? testimonySites[this.found] : finalSite;
    const distance =
      this.chapter === 3
        ? Math.hypot(this.eye.x - target.x, this.eye.y - target.y)
        : this.chapter === 1
          ? Math.abs(this.player.x - (anchors[this.found] ?? 3590))
          : Math.max(0, (crossings[this.found] ?? 840) - this.boat.z);
    return {
      progress:
        this.chapter === 1
          ? this.player.x / 3600
          : this.chapter === 2
            ? this.boat.z / 840
            : this.found / 4,
      focus: this.focus,
      score: this.score,
      found: this.found,
      near: this.chapter === 3 && this.found < 4 && distance < 1.25,
      distance,
      surge: this.surge,
      seconds: this.time,
      resets: this.resets,
    };
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    window.removeEventListener('blur', this.blur);
    document.removeEventListener('visibilitychange', this.hidden);
    this.canvas.removeEventListener('pointerdown', this.pointerDown);
    this.canvas.removeEventListener('pointermove', this.pointerMove);
    this.canvas.removeEventListener('pointerup', this.pointerUp);
    this.canvas.removeEventListener('pointercancel', this.pointerUp);
    this.clearInput();
  }
}
