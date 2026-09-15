import { overlap, type Enemy, type Player, type Rect, type World } from './world';
import type { Weapon, WeaponKind } from './loadouts';

export interface Projectile {
  owner?: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  radius: number;
  damage: number;
  enemy: boolean;
  kind: WeaponKind | 'ink';
  color: string;
  hits: Set<number>;
  returning: boolean;
  gravity: number;
}
export interface Swing {
  x: number;
  y: number;
  facing: number;
  reach: number;
  life: number;
  kind: WeaponKind;
  color: string;
}
export interface DamageNumber {
  x: number;
  y: number;
  amount: number;
  life: number;
}
export interface CombatEvent {
  type: 'attack' | 'hit' | 'kill' | 'enemyshot';
  x: number;
  y: number;
  color: string;
  kind?: WeaponKind;
}
export const freshControls = () => ({
  left: false,
  right: false,
  jump: false,
  dash: false,
  interact: false,
  attack: false,
});

/** Swept collision keeps fast bolts from tunnelling through a target between frames. */
export function segmentHitsRect(
  x: number,
  y: number,
  nextX: number,
  nextY: number,
  r: Rect,
  radius = 0,
) {
  let low = 0,
    high = 1;
  for (const [start, delta, min, max] of [
    [x, nextX - x, r.x - radius, r.x + r.w + radius],
    [y, nextY - y, r.y - radius, r.y + r.h + radius],
  ]) {
    if (Math.abs(delta) < 0.00001) {
      if (start < min || start > max) return false;
    } else {
      const a = (min - start) / delta,
        b = (max - start) / delta;
      low = Math.max(low, Math.min(a, b));
      high = Math.min(high, Math.max(a, b));
      if (low > high) return false;
    }
  }
  return true;
}

export class CombatSystem {
  projectiles: Projectile[] = [];
  swings: Swing[] = [];
  numbers: DamageNumber[] = [];
  events: CombatEvent[] = [];
  cooldown = 0;
  attackTime = 0;
  fury = 0;
  combo = 0;
  bestCombo = 0;
  comboTime = 0;
  kills = 0;
  score = 0;
  constructor(public world: World) {}
  attack(p: Player): boolean {
    if (this.cooldown > 0) return false;
    const w = this.world.weapon,
      damage = w.damage * (this.fury > 0 ? 2 : 1);
    this.cooldown = w.cooldown * (this.fury > 0 ? 0.7 : 1);
    this.attackTime = 0.19;
    this.events.push({ type: 'attack', x: p.x + 12, y: p.y + 22, color: w.color, kind: w.kind });
    const melee = ['axe', 'rapier', 'spear', 'glaive', 'hammer'].includes(w.kind);
    if (melee) {
      this.swings.push({
        x: p.x + 12,
        y: p.y + 22,
        facing: p.facing,
        reach: w.reach,
        life: 0.2,
        kind: w.kind,
        color: w.color,
      });
      const both = w.kind === 'glaive' || w.kind === 'hammer';
      for (const e of this.world.enemies) {
        const dx = e.x + e.w / 2 - p.x - 12,
          dy = e.y + e.h / 2 - p.y - 22;
        if (
          e.alive &&
          Math.abs(dx) < w.reach + e.w / 2 &&
          Math.abs(dy) < (w.kind === 'hammer' ? 85 : 58) + e.h / 2 &&
          (both || dx * p.facing >= -12)
        )
          this.hit(e, damage, p.facing, w.color, w.kind === 'fan' ? 170 : 85);
      }
      if (w.kind !== 'hammer') return true;
    }
    const origin = { x: p.x + 12 + p.facing * 22, y: p.y + 23 };
    const target = this.world.enemies
      .filter(
        (e) =>
          e.alive &&
          (e.x - p.x) * p.facing > 0 &&
          Math.abs(e.x - p.x) < w.reach &&
          Math.abs(e.y + e.h / 2 - origin.y) < 110,
      )
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    const aim = target
      ? Math.atan2(target.y + target.h / 2 - origin.y, Math.abs(target.x + target.w / 2 - origin.x))
      : 0;
    const spread =
      w.kind === 'daggers'
        ? [-0.13, 0, 0.13]
        : w.kind === 'scatter'
          ? [-0.23, -0.115, 0, 0.115, 0.23]
          : w.kind === 'fan'
            ? [-0.27, -0.135, 0, 0.135, 0.27]
            : [0];
    for (const angle of spread)
      this.projectiles.push({
        ...origin,
        vx: Math.cos(aim + angle) * w.speed * p.facing,
        vy: Math.sin(aim + angle) * w.speed + (w.kind === 'comet' ? -55 : 0),
        age: 0,
        life: w.kind === 'boomerang' ? 2.1 : w.reach / w.speed,
        radius: w.kind === 'comet' ? 10 : w.kind === 'fan' ? 9 : 4,
        damage: w.kind === 'hammer' ? 2 : damage,
        enemy: false,
        kind: w.kind,
        color: w.color,
        hits: new Set(),
        returning: false,
        gravity: w.kind === 'comet' ? 160 : 0,
      });
    return true;
  }
  hit(e: Enemy, damage: number, direction: number, color: string, knockback = 85) {
    if (!e.alive) return;
    e.hp = Math.max(0, e.hp - damage);
    e.hurt = 0.15;
    e.vx = direction * knockback;
    this.numbers.push({ x: e.x + e.w / 2, y: e.y - 8, amount: damage, life: 0.65 });
    this.events.push({ type: 'hit', x: e.x + e.w / 2, y: e.y + e.h / 2, color });
    if (e.hp === 0) {
      e.alive = false;
      this.kills++;
      this.combo = this.comboTime > 0 ? this.combo + 1 : 1;
      this.comboTime = 5;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.score += 100 * Math.min(this.combo, 5) * (e.kind === 'guardian' ? 5 : 1);
      this.events.push({ type: 'kill', x: e.x + e.w / 2, y: e.y + e.h / 2, color });
    }
  }
  private enemyShot(e: Enemy, p: Player, offset = 0) {
    const x = e.x + e.w / 2,
      y = e.y + e.h / 2;
    const angle = Math.atan2(p.y + 20 - y, p.x + 12 - x) + offset;
    this.projectiles.push({
      x,
      y,
      vx: Math.cos(angle) * 230,
      vy: Math.sin(angle) * 230,
      age: 0,
      life: 3,
      radius: 7,
      damage: 1,
      enemy: true,
      owner: e.id,
      kind: 'ink',
      color: '#ff9a94',
      hits: new Set(),
      returning: false,
      gravity: 0,
    });
    this.events.push({ type: 'enemyshot', x, y, color: '#ff9a94' });
  }
  update(dt: number, p: Player, hurtPlayer: () => void) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.attackTime = Math.max(0, this.attackTime - dt);
    this.fury = Math.max(0, this.fury - dt);
    this.comboTime = Math.max(0, this.comboTime - dt);
    this.swings = this.swings.filter((s) => (s.life -= dt) > 0);
    this.numbers = this.numbers.filter((n) => {
      n.life -= dt;
      n.y -= 35 * dt;
      return n.life > 0;
    });
    for (const e of this.world.enemies) {
      if (!e.alive) continue;
      e.hurt = Math.max(0, e.hurt - dt);
      e.x = Math.max(e.baseX - e.range, Math.min(e.baseX + e.range, e.x + e.vx * dt));
      e.vx *= Math.max(0, 1 - dt * 12);
      const distance = Math.abs(e.x - p.x),
        active = distance < 650;
      if (!active) continue;
      e.timer -= dt;
      if (e.state === 'patrol') {
        e.facing = p.x > e.x ? 1 : -1;
        if (e.kind === 'flyer') e.y = e.baseY + Math.sin((e.phase += dt * 2)) * 24;
        if (e.kind === 'skitter' || e.kind === 'guardian')
          e.x = Math.max(e.baseX - e.range, Math.min(e.baseX + e.range, e.x + e.facing * 38 * dt));
        if (e.timer <= 0 && distance < (e.kind === 'skitter' ? 200 : 540)) {
          e.state = 'windup';
          e.timer = e.kind === 'guardian' ? 0.8 : 0.6;
        }
      } else if (e.state === 'windup' && e.timer <= 0) {
        e.state = 'attack';
        e.timer = e.kind === 'guardian' ? 0.55 : 0.38;
        if (e.kind === 'sentry' || e.kind === 'flyer') this.enemyShot(e, p);
        if (e.kind === 'guardian') {
          this.enemyShot(e, p, -0.2);
          this.enemyShot(e, p, 0.2);
        }
      } else if (e.state === 'attack') {
        if (e.kind === 'skitter' || e.kind === 'guardian')
          e.x = Math.max(
            e.baseX - e.range,
            Math.min(e.baseX + e.range, e.x + e.facing * (e.kind === 'guardian' ? 280 : 250) * dt),
          );
        if (e.timer <= 0) {
          e.state = 'recover';
          e.timer = e.kind === 'guardian' ? 1.1 : 0.8;
        }
      } else if (e.state === 'recover' && e.timer <= 0) {
        e.state = 'patrol';
        e.timer = 0.8;
      }
    }
    this.projectiles = this.projectiles.filter((shot) => {
      if (shot.enemy && !this.world.enemies.some((e) => e.id === shot.owner && e.alive))
        return false;
      shot.age += dt;
      shot.life -= dt;
      if (shot.kind === 'boomerang' && !shot.returning && shot.age > 0.6) {
        shot.returning = true;
        shot.hits.clear();
      }
      if (shot.returning) {
        const dx = p.x + 12 - shot.x,
          dy = p.y + 22 - shot.y,
          d = Math.hypot(dx, dy);
        if (d < 20) return false;
        shot.vx = (dx / d) * 720;
        shot.vy = (dy / d) * 720;
      }
      const oldX = shot.x,
        oldY = shot.y;
      shot.vy += shot.gravity * dt;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      let remove = shot.life <= 0 || shot.y > 620 || shot.x < 0 || shot.x > this.world.width;
      if (shot.enemy) {
        if (segmentHitsRect(oldX, oldY, shot.x, shot.y, p, shot.radius)) {
          if (p.dashTime <= 0) hurtPlayer();
          remove = true;
        }
      } else {
        for (const e of this.world.enemies) {
          if (!e.alive || shot.hits.has(e.id)) continue;
          if (segmentHitsRect(oldX, oldY, shot.x, shot.y, e, shot.radius)) {
            this.hit(
              e,
              shot.damage,
              Math.sign(shot.vx),
              shot.color,
              shot.kind === 'fan' ? 200 : 85,
            );
            shot.hits.add(e.id);
            if (!['crossbow', 'boomerang', 'hammer', 'fan'].includes(shot.kind)) {
              remove = true;
              break;
            }
          }
        }
        if (shot.kind === 'comet' && (shot.y >= 510 || remove)) {
          for (const e of this.world.enemies)
            if (
              e.alive &&
              !shot.hits.has(e.id) &&
              Math.hypot(e.x + e.w / 2 - shot.x, e.y + e.h / 2 - shot.y) < 100
            )
              this.hit(e, shot.damage, Math.sign(shot.vx), shot.color);
          this.swings.push({
            x: shot.x,
            y: shot.y,
            facing: 1,
            reach: 95,
            life: 0.2,
            kind: 'comet',
            color: shot.color,
          });
          remove = true;
        }
      }
      return !remove;
    });
    for (const gate of this.world.gates)
      gate.open = !this.world.enemies.some((e) => e.alive && e.zone === gate.zone);
    for (const gate of this.world.gates) if (!gate.open && overlap(p, gate)) p.x = gate.x - p.w;
  }
}
