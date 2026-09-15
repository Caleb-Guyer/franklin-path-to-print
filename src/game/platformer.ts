import {
  makeWorld,
  movePlayer,
  newPlayer,
  overlap,
  type Controls,
  type Player,
  type World,
} from './world';
import { GameAudio } from './audio';
import { drawWorld } from './renderer';
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
}
export interface Trail {
  x: number;
  y: number;
  life: number;
  facing: number;
}
export interface GameStats {
  pages: number;
  total: number;
  hearts: number;
  deaths: number;
  seconds: number;
  near: boolean;
}
export interface GameCallbacks {
  page: (id: string) => void;
  checkpoint: (zone: number) => void;
  talk: (eventId: string) => void;
  finish: (stats: GameStats) => void;
  pause: () => void;
  stats: (stats: GameStats) => void;
}
export class PlatformGame {
  world: World;
  player: Player;
  particles: Particle[] = [];
  trails: Trail[] = [];
  time = 0;
  elapsed = 0;
  camera = 0;
  shake = 0;
  hearts = 3;
  chain = 0;
  chainUntil = 0;
  startedFromBeginning = true;
  deaths = 0;
  checkpoint = 0;
  reducedMotion = false;
  width = 960;
  height = 600;
  running = false;
  started = false;
  finished = false;
  controls: Controls = { left: false, right: false, jump: false, dash: false, interact: false };
  private pressed = { jump: false, dash: false, interact: false };
  private frame = 0;
  private previous = 0;
  private disposed = false;
  private statTime = 0;
  private trailTime = 0;
  private dustTime = 0;
  private audio = new GameAudio();
  private resizeObserver: ResizeObserver;
  private music = true;
  private effects = true;
  private context: CanvasRenderingContext2D;
  constructor(
    private canvas: HTMLCanvasElement,
    level: number,
    collected: string[],
    checkpoint: number,
    private callbacks: GameCallbacks,
  ) {
    this.context = canvas.getContext('2d')!;
    this.world = makeWorld(level, collected);
    this.checkpoint = Math.min(checkpoint, this.world.stops.length - 1);
    this.startedFromBeginning = this.checkpoint === 0;
    this.player = newPlayer(this.checkpoint * 900 + 70);
    this.world.stops.forEach((s, i) => (s.visited = i <= this.checkpoint));
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
    window.addEventListener('keydown', this.keyDown);
    window.addEventListener('keyup', this.keyUp);
    window.addEventListener('blur', this.blur);
    document.addEventListener('visibilitychange', this.visibility);
    this.frame = requestAnimationFrame(this.loop);
    this.publish();
  }
  private resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.height = 600;
    this.width = Math.max(240, (r.width / r.height) * 600);
    this.context.setTransform(this.canvas.width / this.width, 0, 0, this.canvas.height / 600, 0, 0);
    this.context.imageSmoothingEnabled = false;
    this.camera = Math.max(
      0,
      Math.min(this.world.width - this.width, this.player.x - this.width * 0.35),
    );
  }
  start(music: boolean, effects: boolean) {
    this.started = true;
    this.running = true;
    this.music = music;
    this.effects = effects;
    this.audio.start(music, effects, this.world.level);
    this.publish();
  }
  resume() {
    if (this.finished) return;
    this.running = true;
    this.audio.start(this.music, this.effects, this.world.level);
    this.audio.pause(false);
  }
  pause() {
    this.running = false;
    this.controls = { left: false, right: false, jump: false, dash: false, interact: false };
    this.pressed = { jump: false, dash: false, interact: false };
    this.audio.pause(true);
  }
  setMusic(music: boolean) {
    this.music = music;
    this.effects = music;
    this.audio.setMusic(music);
  }
  press(key: keyof Controls) {
    if (!this.running) return;
    if (!this.controls[key] && key in this.pressed)
      this.pressed[key as keyof typeof this.pressed] = true;
    this.controls[key] = true;
  }
  release(key: keyof Controls) {
    this.controls[key] = false;
  }
  private keyDown = (e: KeyboardEvent) => {
    if (
      !this.running ||
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    )
      return;
    if (e.code === 'Escape') {
      e.preventDefault();
      this.pause();
      this.callbacks.pause();
      return;
    }
    const key = this.key(e.code);
    if (key) {
      e.preventDefault();
      this.press(key);
    }
  };
  private keyUp = (e: KeyboardEvent) => {
    const key = this.key(e.code);
    if (key) this.release(key);
  };
  private key(code: string): keyof Controls | undefined {
    return (
      {
        ArrowLeft: 'left',
        KeyA: 'left',
        ArrowRight: 'right',
        KeyD: 'right',
        Space: 'jump',
        ArrowUp: 'jump',
        KeyW: 'jump',
        ShiftLeft: 'dash',
        ShiftRight: 'dash',
        KeyX: 'dash',
        KeyE: 'interact',
        Enter: 'interact',
      } as Record<string, keyof Controls>
    )[code];
  }
  private blur = () => {
    if (this.running) {
      this.pause();
      this.callbacks.pause();
    }
  };
  private visibility = () => {
    if (document.hidden) this.blur();
  };
  private loop = (now: number) => {
    if (this.disposed) return;
    const dt = Math.min((now - (this.previous || now)) / 1000, 0.033);
    this.previous = now;
    this.time += dt;
    if (this.running) this.update(dt);
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      return p.life > 0;
    });
    this.trails = this.trails.filter((p) => {
      p.life -= dt;
      return p.life > 0;
    });
    this.shake = Math.max(0, this.shake - dt * 20);
    const target = Math.max(
      0,
      Math.min(
        this.world.width - this.width,
        this.player.x - this.width * 0.36 + this.player.vx * 0.15,
      ),
    );
    this.camera += (target - this.camera) * Math.min(1, dt * 7);
    drawWorld(this.context, this);
    this.frame = requestAnimationFrame(this.loop);
  };
  private update(dt: number) {
    this.elapsed += dt;
    const p = this.player;
    const oldBottom = p.y + p.h;
    for (const platform of this.world.platforms)
      if (platform.kind === 'moving')
        platform.y = platform.originY! + Math.sin(this.time * 1.5 + platform.phase!) * 34;
    const result = movePlayer(p, this.controls, this.pressed, this.world.platforms, dt);
    if (result.jumped) {
      this.audio.play('jump');
      this.burst(p.x + p.w / 2, p.y + p.h, '#d5bc81', 7);
    }
    if (result.dashed) {
      this.audio.play('dash');
      this.burst(p.x, p.y + 20, '#73e6ec', 12);
    }
    this.trailTime += dt;
    if (!this.reducedMotion && p.dashTime > 0 && this.trailTime > 0.028) {
      this.trails.push({ x: p.x, y: p.y, life: 0.22, facing: p.facing });
      this.trailTime = 0;
    }
    this.dustTime += dt;
    if (p.grounded && Math.abs(p.vx) > 70 && this.dustTime > 0.13) {
      this.burst(p.x + 12, p.y + 42, '#cbb288', 2);
      this.dustTime = 0;
    }
    p.x = Math.min(p.x, this.world.width - p.w);
    for (const spring of this.world.springs)
      if (p.vy >= 0 && overlap(p, spring)) {
        p.vy = -790;
        p.grounded = false;
        p.jumps = 1;
        p.airDash = true;
        this.audio.play('bounce');
        this.burst(spring.x + 13, spring.y, '#82e4c4', 16);
      }
    for (const page of this.world.pages)
      if (!page.collected && Math.hypot(p.x + 12 - page.x, p.y + 22 - page.y) < 32) {
        page.collected = true;
        this.chain = this.elapsed < this.chainUntil ? this.chain + 1 : 1;
        this.chainUntil = this.elapsed + 3;
        this.audio.play('page', this.chain);
        this.burst(page.x, page.y, '#fce28f', 18);
        this.callbacks.page(page.id);
        this.publish();
      }
    for (const enemy of this.world.enemies) {
      if (!enemy.alive) continue;
      enemy.x = enemy.baseX + Math.sin(this.time * 1.7 + enemy.phase) * enemy.range;
      if (overlap(p, enemy)) {
        if (p.dashTime > 0 || (p.vy > 30 && oldBottom <= enemy.y + 14)) {
          enemy.alive = false;
          if (p.dashTime <= 0) p.vy = -450;
          this.audio.play('bounce');
          this.burst(enemy.x + 14, enemy.y + 14, '#9ef0ed', 24);
          this.shake = 2;
        } else this.hurt();
      }
    }
    for (const spike of this.world.spikes) if (overlap(p, spike)) this.hurt(true);
    if (p.y > 660) this.hurt(true);
    for (let i = 0; i < this.world.stops.length; i++) {
      const stop = this.world.stops[i];
      if (p.x >= stop.x && i > this.checkpoint) {
        this.checkpoint = i;
        stop.visited = true;
        this.callbacks.checkpoint(i);
        this.audio.play('checkpoint');
        this.burst(stop.x, stop.y - 55, '#80efc8', 20);
      }
    }
    if (this.pressed.interact) {
      if (Math.abs(p.x - this.world.exit.x) < 100 && p.y > 330) {
        this.finished = true;
        this.pause();
        this.audio.play('clear');
        this.callbacks.finish(this.stats());
      } else {
        const stop = this.world.stops.find((s) => Math.abs(p.x - s.x) < 80 && p.y > 365);
        if (stop) {
          this.pause();
          this.callbacks.talk(stop.eventId);
        }
      }
    }
    this.pressed = { jump: false, dash: false, interact: false };
    this.statTime += dt;
    if (this.statTime > 0.2) {
      this.publish();
      this.statTime = 0;
    }
  }
  private hurt(fall = false) {
    if (this.player.invincible > 0 && !fall) return;
    this.chain = 0;
    this.hearts--;
    this.shake = 6;
    this.audio.play('hit');
    this.burst(this.player.x + 12, this.player.y + 20, '#f79d79', 20);
    if (fall || this.hearts <= 0) {
      if (this.hearts <= 0) {
        this.deaths++;
        this.hearts = 3;
      }
      this.player = newPlayer(this.checkpoint * 900 + 70);
      this.player.invincible = 1.5;
    } else {
      this.player.invincible = 1.4;
      this.player.vy = -350;
      this.player.vx = -this.player.facing * 230;
    }
    this.publish();
  }
  private burst(x: number, y: number, color: string, count: number) {
    if (this.reducedMotion) return;
    for (let i = 0; i < count; i++)
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 200,
        vy: -Math.random() * 170 - 20,
        life: 0.3 + Math.random() * 0.5,
        max: 0.8,
        color,
        size: 2 + Math.random() * 3,
      });
    if (this.particles.length > 220) this.particles.splice(0, this.particles.length - 220);
  }
  stats(): GameStats {
    return {
      pages: this.world.pages.filter((p) => p.collected).length,
      total: this.world.pages.length,
      hearts: this.hearts,
      deaths: this.deaths,
      seconds: Math.floor(this.elapsed),
      near:
        Math.abs(this.player.x - this.world.exit.x) < 100 ||
        this.world.stops.some((s) => Math.abs(this.player.x - s.x) < 80 && this.player.y > 365),
    };
  }
  private publish() {
    this.callbacks.stats(this.stats());
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    window.removeEventListener('keydown', this.keyDown);
    window.removeEventListener('keyup', this.keyUp);
    window.removeEventListener('blur', this.blur);
    document.removeEventListener('visibilitychange', this.visibility);
    this.audio.dispose();
  }
}
