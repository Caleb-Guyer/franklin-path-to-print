import type { Enemy } from './world';
import type { WeaponKind } from './loadouts';
import type { PlatformGame } from './platformer';

export function drawWeapon(
  c: CanvasRenderingContext2D,
  kind: WeaponKind,
  x: number,
  y: number,
  facing: number,
  color: string,
  attacking = false,
) {
  c.save();
  c.translate(x, y);
  c.scale(facing, 1);
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = 3;
  c.lineCap = 'round';
  const line = (points: number[]) => {
    c.beginPath();
    c.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
    c.stroke();
  };
  if (kind === 'bow' || kind === 'crossbow') {
    c.beginPath();
    c.moveTo(5, -19);
    c.quadraticCurveTo(27, 0, 5, 19);
    c.stroke();
    c.lineWidth = 1;
    line([5, -19, attacking ? -3 : 5, 0, 5, 19]);
    line([-4, 0, 29, 0, 23, -4]);
    if (kind === 'crossbow') {
      c.lineWidth = 5;
      line([-7, 8, 24, 0]);
    }
  } else if (kind === 'axe' || kind === 'hammer') {
    c.rotate(attacking ? 1.05 : -0.4);
    c.strokeStyle = '#b89370';
    line([0, 16, 9, -24]);
    c.fillStyle = color;
    if (kind === 'axe') {
      c.beginPath();
      c.moveTo(8, -23);
      c.lineTo(23, -26);
      c.lineTo(27, -9);
      c.lineTo(9, -8);
      c.fill();
    } else c.fillRect(-2, -29, 27, 17);
  } else if (kind === 'boomerang') {
    c.rotate(attacking ? -0.6 : 0.4);
    line([2, 16, 8, -13, 27, -5]);
  } else if (kind === 'fan') {
    c.beginPath();
    c.moveTo(0, 12);
    c.arc(0, 12, 30, -1.9, -0.4);
    c.closePath();
    c.fillStyle = color + 'aa';
    c.fill();
    line([0, 12, 17, -10]);
  } else if (kind === 'comet') {
    line([0, 15, 12, -19]);
    c.beginPath();
    c.arc(14, -22, 7, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff6dd';
    c.fillRect(11, -26, 4, 4);
  } else if (kind === 'scatter') {
    line([0, 9, 25, -5]);
    c.lineWidth = 10;
    line([13, 1, 29, -8]);
    c.lineWidth = 4;
    line([27, -13, 33, -3]);
  } else {
    c.rotate(attacking ? -0.1 : -0.6);
    line([0, 4, kind === 'spear' ? 55 : kind === 'glaive' ? 39 : 31, -5]);
    line([10, -5, 12, 10]);
    c.lineWidth = 1;
    line([15, 0, kind === 'spear' ? 57 : 32, -6, 26, 2]);
  }
  c.restore();
}
export function drawEnemy(c: CanvasRenderingContext2D, e: Enemy, camera: number, time: number) {
  if (!e.alive) return;
  const x = e.x - camera,
    y = e.y,
    w = e.w,
    h = e.h;
  const tell = e.state === 'windup',
    color =
      e.hurt > 0
        ? '#f4e8cb'
        : tell
          ? '#ed987e'
          : e.kind === 'guardian'
            ? '#523c71'
            : e.kind === 'sentry'
              ? '#365268'
              : e.kind === 'flyer'
                ? '#725687'
                : '#30475f';
  c.save();
  c.fillStyle = '#07192966';
  c.beginPath();
  c.ellipse(x + w / 2, 520, w * 0.7, 5, 0, 0, Math.PI * 2);
  c.fill();
  if (tell) {
    c.strokeStyle = '#ffd08b';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(x + w / 2, y + h / 2, w * 0.85 + Math.sin(time * 22) * 3, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = '#ffb28c';
    c.fillRect(x + w / 2 - 2, y - 22, 4, 9);
    c.fillRect(x + w / 2 - 2, y - 9, 4, 3);
  }
  if (e.kind === 'flyer') {
    c.fillStyle = '#9c84b8';
    for (const d of [-1, 1]) {
      c.beginPath();
      c.moveTo(x + w / 2, y + 15);
      c.lineTo(x + w / 2 + d * 37, y - 8 + Math.sin(time * 11) * 9);
      c.lineTo(x + w / 2 + d * 24, y + 19);
      c.fill();
    }
  }
  c.fillStyle = color;
  c.strokeStyle = e.kind === 'guardian' ? '#b79ad7' : '#90a9b6';
  c.lineWidth = 2;
  c.beginPath();
  c.roundRect(x, y, w, h, e.kind === 'sentry' ? 5 : 12);
  c.fill();
  c.stroke();
  if (e.kind === 'guardian') {
    c.fillStyle = '#bd9ad2';
    c.fillRect(x - 8, y + 11, 16, 22);
    c.fillRect(x + w - 8, y + 11, 16, 22);
    c.beginPath();
    c.moveTo(x + 5, y);
    c.lineTo(x + 9, y - 18);
    c.lineTo(x + 23, y);
    c.moveTo(x + w - 23, y);
    c.lineTo(x + w - 9, y - 18);
    c.lineTo(x + w - 5, y);
    c.fill();
  }
  const eyes = e.state === 'attack' ? '#ff9285' : '#c8f6ec';
  c.fillStyle = eyes;
  c.fillRect(x + w * 0.21, y + h * 0.28, w * 0.21, 6);
  c.fillRect(x + w * 0.62, y + h * 0.28, w * 0.21, 6);
  c.fillStyle = '#132338';
  c.fillRect(x + w * 0.21 + (e.facing > 0 ? 3 : 0), y + h * 0.28 + 1, 3, 4);
  c.fillRect(x + w * 0.62 + (e.facing > 0 ? 3 : 0), y + h * 0.28 + 1, 3, 4);
  if (e.kind === 'sentry') {
    c.fillStyle = '#a6d5d6';
    c.fillRect(x + (e.facing > 0 ? w - 4 : -14), y + h * 0.6, 18, 8);
  }
  if (e.kind === 'skitter' || e.kind === 'guardian') {
    c.fillStyle = color;
    for (let i = 0; i < 4; i++)
      c.fillRect(x + (i * w) / 4, y + h - 2, w / 5, 5 + Math.sin(time * 9 + i) * 3);
  }
  if (e.hp < e.maxHp && e.kind !== 'guardian') {
    c.fillStyle = '#142333';
    c.fillRect(x, y - 10, w, 3);
    c.fillStyle = '#efb69e';
    c.fillRect(x, y - 10, (w * e.hp) / e.maxHp, 3);
  }
  c.restore();
}
export function drawCombat(c: CanvasRenderingContext2D, g: PlatformGame) {
  const combat = g.combat;
  for (const shot of combat.projectiles) {
    c.save();
    c.translate(shot.x - g.camera, shot.y);
    c.rotate(Math.atan2(shot.vy, shot.vx));
    c.strokeStyle = shot.color;
    c.fillStyle = shot.color;
    c.lineWidth = 2;
    if (shot.kind === 'bow' || shot.kind === 'crossbow' || shot.kind === 'daggers') {
      c.beginPath();
      c.moveTo(-15, 0);
      c.lineTo(11, 0);
      c.lineTo(5, -4);
      c.moveTo(11, 0);
      c.lineTo(5, 4);
      c.stroke();
      c.strokeStyle = shot.color + '66';
      c.beginPath();
      c.moveTo(-30, 0);
      c.lineTo(-16, 0);
      c.stroke();
    } else if (shot.kind === 'boomerang') {
      c.rotate(shot.age * 18);
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(-10, 9);
      c.lineTo(0, -7);
      c.lineTo(14, 3);
      c.stroke();
    } else if (shot.kind === 'hammer') {
      c.lineWidth = 4;
      c.beginPath();
      c.arc(0, 0, 18, -1.5, 1.5);
      c.stroke();
    } else {
      c.shadowColor = shot.color;
      c.shadowBlur = shot.enemy ? 4 : 14;
      c.beginPath();
      c.arc(0, 0, shot.radius, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;
      c.fillStyle = '#fff1d6';
      c.fillRect(-2, -2, 3, 3);
    }
    c.restore();
  }
  for (const swing of combat.swings) {
    const progress = 1 - swing.life / 0.2;
    c.save();
    c.translate(swing.x - g.camera, swing.y);
    c.scale(swing.facing, 1);
    c.globalAlpha = (1 - progress) * 0.85;
    c.strokeStyle = swing.color;
    c.lineWidth = 8 * (1 - progress) + 2;
    c.beginPath();
    if (swing.kind === 'rapier' || swing.kind === 'spear') {
      c.moveTo(12, 0);
      c.lineTo(swing.reach, 0);
    } else if (swing.kind === 'comet' || swing.kind === 'hammer' || swing.kind === 'glaive')
      c.arc(0, 0, swing.reach * (0.45 + progress * 0.55), 0, Math.PI * 2);
    else c.arc(0, 0, swing.reach * 0.85, -1.25 + progress * 0.5, 1.25 + progress * 0.5);
    c.stroke();
    c.restore();
  }
}
