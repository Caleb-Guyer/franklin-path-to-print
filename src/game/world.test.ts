import { describe, expect, it } from 'vitest';
import { facts } from '../data/facts';
import { events } from '../data/chapters';
import { freshSave, parseSave } from '../lib/game';
import { makeWorld, movePlayer, newPlayer, type Controls, type Platform } from './world';

const controls: Controls = { left: false, right: false, jump: true, dash: false, interact: false };
const floor: Platform[] = [{ x: 0, y: 520, w: 10000, h: 100, kind: 'ground' }];
const tick = (
  p: ReturnType<typeof newPlayer>,
  jump = false,
  dash = false,
  input = controls,
  platforms = floor,
) => movePlayer(p, input, { jump, dash }, platforms, 1 / 60);

describe('playable source worlds', () => {
  it('places every source fact and all 60 events exactly once across twelve worlds', () => {
    const worlds = Array.from({ length: 12 }, (_, i) => makeWorld(i));
    const pickups = worlds.flatMap((w) => w.pages.map((p) => p.id));
    expect(pickups.sort()).toEqual(facts.map((f) => f.id).sort());
    expect(worlds.flatMap((w) => w.stops.map((s) => s.eventId)).sort()).toEqual(
      events.map((e) => e.id).sort(),
    );
    for (const world of worlds) {
      expect(world.pages.every((p) => p.x > 0 && p.x < world.width && p.y > 0)).toBe(true);
      expect(
        world.platforms.some(
          (p) => p.x <= world.exit.x && p.x + p.w >= world.exit.x + world.exit.w,
        ),
      ).toBe(true);
      expect(
        world.stops.every((s) =>
          world.platforms.some((p) => p.kind === 'ground' && s.x >= p.x && s.x < p.x + p.w),
        ),
      ).toBe(true);
    }
  });
  it('retains collected pages on replay without removing other chapter pages', () => {
    const initial = makeWorld(0);
    const restored = makeWorld(0, [initial.pages[0].id, 'invalid']);
    expect(restored.pages.filter((p) => p.collected)).toHaveLength(1);
    expect(restored.pages).toHaveLength(initial.pages.length);
  });
  it('lets the movement physics traverse every full level and its gaps', () => {
    for (let level = 0; level < 12; level++) {
      const world = makeWorld(level),
        p = newPlayer();
      for (let frame = 0; frame < 6000 && p.x < world.exit.x; frame++) {
        const standing = world.platforms.find(
          (platform) =>
            Math.abs(platform.y - p.y - p.h) < 2 &&
            p.x + p.w > platform.x &&
            p.x < platform.x + platform.w,
        );
        const jump = p.grounded && !!standing && standing.x + standing.w - p.x < 100;
        tick(p, jump, false, { ...controls, right: true }, world.platforms);
        expect(p.y, `level ${level + 1}, x=${p.x}`).toBeLessThan(660);
      }
      expect(p.x, `level ${level + 1}`).toBeGreaterThanOrEqual(world.exit.x);
    }
  });
});

describe('responsive movement', () => {
  it('lands, double jumps, rejects a third jump, and restores jumps on landing', () => {
    const p = newPlayer();
    for (let i = 0; i < 30; i++) tick(p);
    expect(p.grounded).toBe(true);
    expect(tick(p, true).jumped).toBe(true);
    for (let i = 0; i < 12; i++) tick(p);
    expect(tick(p, true).jumped).toBe(true);
    expect(tick(p, true).jumped).toBe(false);
    for (let i = 0; i < 100; i++) tick(p);
    expect(p.grounded).toBe(true);
    expect(tick(p, true).jumped).toBe(true);
  });
  it('allows a late jump after stepping off an edge', () => {
    const p = newPlayer(320, 478);
    p.grounded = true;
    p.coyote = 0.1;
    p.jumps = 1;
    const result = tick(p, true, false, { ...controls, right: true }, []);
    expect(result.jumped).toBe(true);
    expect(p.vy).toBeLessThan(-540);
  });
  it('dashes forward, enforces cooldown, and permits only one dash in the air', () => {
    const p = newPlayer(100, 100);
    expect(tick(p, false, true, { ...controls, right: true }, []).dashed).toBe(true);
    const start = p.x;
    for (let i = 0; i < 8; i++) tick(p, false, false, controls, []);
    expect(p.x - start).toBeGreaterThan(80);
    expect(tick(p, false, true, controls, []).dashed).toBe(false);
    p.dashCooldown = 0;
    expect(tick(p, false, true, controls, []).dashed).toBe(false);
  });
  it('keeps short taps lower than held jumps', () => {
    function height(held: boolean) {
      const p = newPlayer(50, 478);
      p.grounded = true;
      tick(p, true);
      let highest = p.y;
      for (let i = 0; i < 50; i++) {
        tick(p, false, false, { ...controls, jump: held });
        highest = Math.min(highest, p.y);
      }
      return highest;
    }
    expect(height(true)).toBeLessThan(height(false) - 30);
  });
});

describe('save migration', () => {
  it('preserves earlier study saves while adding platformer defaults', () => {
    const { platformer: _old, ...old } = freshSave();
    old.xp = 520;
    old.unlockedCards = ['f001'];
    const parsed = parseSave(JSON.stringify(old));
    expect(parsed.xp).toBe(520);
    expect(parsed.unlockedCards).toEqual(['f001']);
    expect(parsed.platformer.level).toBe(0);
    expect(parsed.settings.music).toBe(true);
  });
  it('round trips progress and rejects invalid checkpoints and card IDs', () => {
    const save = freshSave();
    save.platformer = {
      level: 3,
      unlocked: 3,
      collected: ['f001', 'fake'],
      checkpoints: { 3: 2, 55: 4, 1: -2 },
      completed: [0, 1, 2],
      bestTimes: { 0: 35, 2: 42 },
    };
    const parsed = parseSave(JSON.stringify(save));
    expect(parsed.platformer.collected).toEqual(['f001']);
    expect(parsed.platformer.checkpoints).toEqual({ 3: 2 });
    expect(parsed.platformer.bestTimes[2]).toBe(42);
    expect(parsed.platformer.unlocked).toBe(3);
  });
});
