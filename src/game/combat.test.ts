import { describe, expect, it } from 'vitest';
import { CombatSystem, segmentHitsRect } from './combat';
import { makeWorld, newPlayer, canEnterExit, type Enemy } from './world';

function target(id: number, x: number, hp = 2): Enemy {
  return {
    id,
    kind: 'sentry',
    x,
    y: 488,
    w: 32,
    h: 32,
    baseX: x,
    baseY: 488,
    range: 0,
    phase: 0,
    alive: true,
    hp,
    maxHp: hp,
    facing: -1,
    state: 'patrol',
    timer: 50,
    hurt: 0,
    zone: 1,
    vx: 0,
  };
}
describe('responsive combat', () => {
  it('blocks interaction with an exit until every required encounter is cleared', () => {
    const world = makeWorld(0),
      p = newPlayer(world.exit.x - 60);
    expect(canEnterExit(world, p)).toBe(false);
    world.gates[0].open = true;
    expect(canEnterExit(world, p)).toBe(false);
    world.gates[1].open = true;
    expect(canEnterExit(world, p)).toBe(true);
    p.x = 100;
    expect(canEnterExit(world, p)).toBe(false);
  });
  it('lets every loadout defeat a target using its attack and normal cooldown', () => {
    for (let level = 0; level < 12; level++) {
      const world = makeWorld(level),
        p = newPlayer(170),
        enemy = target(0, 260);
      world.enemies = [enemy];
      const combat = new CombatSystem(world);
      for (let frame = 0; frame < 180 && enemy.alive; frame++) {
        combat.attack(p);
        combat.update(1 / 60, p, () => {});
      }
      expect(enemy.alive, world.weapon.name).toBe(false);
      expect(combat.kills).toBe(1);
      expect(combat.score).toBe(100);
    }
  });
  it('rejects attack spam during cooldown and allows another attack when ready', () => {
    const combat = new CombatSystem(makeWorld(0)),
      p = newPlayer();
    expect(combat.attack(p)).toBe(true);
    for (let i = 0; i < 8; i++) expect(combat.attack(p)).toBe(false);
    combat.update(0.3, p, () => {});
    expect(combat.attack(p)).toBe(true);
  });
  it('handles fast bolts without tunnelling and lets the crossbow pierce targets', () => {
    expect(segmentHitsRect(0, 10, 300, 10, { x: 150, y: 0, w: 5, h: 20 })).toBe(true);
    expect(segmentHitsRect(0, 30, 300, 30, { x: 150, y: 0, w: 5, h: 20 })).toBe(false);
    const world = makeWorld(7),
      p = newPlayer(170);
    world.enemies = [target(0, 260), target(1, 320)];
    const combat = new CombatSystem(world);
    combat.attack(p);
    for (let i = 0; i < 30; i++) combat.update(1 / 60, p, () => {});
    expect(combat.kills).toBe(2);
    expect(combat.bestCombo).toBe(2);
  });
  it('allows a boomerang to hit on both its outward and return journeys', () => {
    const world = makeWorld(3),
      p = newPlayer(170),
      enemy = target(0, 290, 10);
    world.enemies = [enemy];
    const combat = new CombatSystem(world);
    combat.attack(p);
    for (let i = 0; i < 125; i++) combat.update(1 / 60, p, () => {});
    expect(enemy.hp).toBe(6);
    expect(combat.projectiles).toHaveLength(0);
  });
  it('telegraphs sentry fire and opens an arena only when its enemies are defeated', () => {
    const world = makeWorld(0),
      p = newPlayer(1200),
      enemy = target(0, 1300);
    enemy.timer = 0.1;
    world.enemies = [enemy];
    const combat = new CombatSystem(world);
    combat.update(0.11, p, () => {});
    expect(enemy.state).toBe('windup');
    expect(combat.projectiles).toHaveLength(0);
    expect(world.gates[0].open).toBe(false);
    combat.update(0.3, p, () => {});
    expect(combat.projectiles).toHaveLength(0);
    combat.update(0.31, p, () => {});
    expect(combat.projectiles.some((s) => s.enemy)).toBe(true);
    combat.hit(enemy, 2, 1, '#ffffff');
    combat.update(0.01, p, () => {});
    expect(world.gates[0].open).toBe(true);
  });
});
