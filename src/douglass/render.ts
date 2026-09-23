import {
  anchors,
  castRay,
  estateMap,
  finalSite,
  platforms,
  riverRings,
  riverRocks,
  testimonySites,
  wrapAngle,
  type CampaignEngine,
} from './engine';

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
function polygon(c: CanvasRenderingContext2D, points: number[], color: string) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
  c.closePath();
  c.fill();
}
function sky(c: CanvasRenderingContext2D, w: number, h: number, time: number, mode: number) {
  const gradient = c.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, ['#121f31', '#203047', '#182635'][mode - 1]);
  gradient.addColorStop(0.65, ['#45605e', '#a28a81', '#686f6b'][mode - 1]);
  gradient.addColorStop(1, '#1e363b');
  c.fillStyle = gradient;
  c.fillRect(0, 0, w, h);
  const mx = w * (mode === 2 ? 0.57 : 0.72),
    my = h * 0.23,
    r = Math.min(w, h) * 0.075;
  const glow = c.createRadialGradient(mx, my, r * 0.5, mx, my, r * 3.7);
  glow.addColorStop(0, '#f4daae26');
  glow.addColorStop(1, '#f4daae00');
  c.fillStyle = glow;
  c.fillRect(mx - r * 4, my - r * 4, r * 8, r * 8);
  c.fillStyle = '#dfd4b9';
  c.beginPath();
  c.arc(mx, my, r, 0, Math.PI * 2);
  c.fill();
  for (let i = 0; i < 42; i++) {
    c.globalAlpha = 0.15 + (Math.sin(i * 2.1 + time * 0.3) + 1) * 0.16;
    c.fillStyle = '#efead9';
    c.fillRect((i * 173.23) % w, (i * 91.63) % (h * 0.55), 1.3, 1.3);
  }
  c.globalAlpha = 1;
  for (let i = 0; i < 3; i++) {
    c.fillStyle = ['#50676370', '#38565488', '#2a454add'][i];
    c.beginPath();
    c.moveTo(0, h);
    for (let x = 0; x <= w + 10; x += 15) {
      const y =
        h * (0.56 + i * 0.12) +
        Math.sin(x * 0.004 + i * 3) * h * 0.05 +
        Math.cos(x * 0.008 + i) * h * 0.025;
      c.lineTo(x, y);
    }
    c.lineTo(w, h);
    c.fill();
  }
}
function tree(
  c: CanvasRenderingContext2D,
  x: number,
  ground: number,
  height: number,
  color: string,
) {
  c.fillStyle = color;
  c.fillRect(x - 3, ground - height * 0.7, 6, height * 0.7);
  for (let i = 0; i < 3; i++) {
    const y = ground - height + i * height * 0.2;
    polygon(
      c,
      [
        x,
        y,
        x - height * (0.22 + i * 0.015),
        y + height * 0.5,
        x + height * (0.22 + i * 0.015),
        y + height * 0.5,
      ],
      color,
    );
  }
}
function lantern(c: CanvasRenderingContext2D, x: number, y: number, lit = true) {
  if (lit) {
    const g = c.createRadialGradient(x, y, 1, x, y, 65);
    g.addColorStop(0, '#f7d7a34a');
    g.addColorStop(1, '#f7d7a300');
    c.fillStyle = g;
    c.fillRect(x - 65, y - 65, 130, 130);
  }
  c.fillStyle = '#172b32';
  c.fillRect(x - 3, y - 5, 6, 90);
  c.fillRect(x - 11, y - 22, 22, 28);
  c.fillStyle = lit ? '#f5cd86' : '#566a6b';
  c.fillRect(x - 7, y - 18, 14, 19);
}
function figure(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  phase: number,
  facing: number,
  ghost = false,
) {
  c.save();
  c.translate(x + 13, y);
  c.scale(facing, 1);
  c.globalAlpha = ghost ? 0.25 : 1;
  const stride = Math.sin(phase) * 6;
  c.strokeStyle = '#15242d';
  c.lineWidth = 8;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-5, 35);
  c.lineTo(-6 + stride, 50);
  c.moveTo(6, 35);
  c.lineTo(6 - stride, 50);
  c.stroke();
  polygon(c, [-11, 19, 10, 19, 14, 38, -14, 38], '#91afad');
  polygon(c, [-3, 20, 4, 20, 4, 37, -2, 37], '#ddcaaa');
  c.fillStyle = '#a77a55';
  c.fillRect(-8, 3, 18, 19);
  c.fillStyle = '#172831';
  c.fillRect(-10, 0, 21, 8);
  c.fillRect(-11, 4, 6, 10);
  c.fillStyle = '#f6e1b6';
  c.fillRect(5, 11, 3, 3);
  c.strokeStyle = '#8da8a4';
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(-7, 23);
  c.lineTo(-13 - stride * 0.4, 35);
  c.moveTo(8, 23);
  c.lineTo(14 + stride * 0.4, 32);
  c.stroke();
  c.restore();
}
function platformScene(c: CanvasRenderingContext2D, g: CampaignEngine) {
  const { w, h } = g;
  sky(c, w, h, g.time, 1);
  const unit = Math.min(h / 620, 1.3),
    view = w / unit,
    cam = Math.max(0, Math.min(3750 - view, g.player.x - view * 0.37));
  for (let layer = 0; layer < 2; layer++)
    for (let i = 0; i < 22; i++) {
      const x = (i * 170 - cam * (0.18 + layer * 0.2)) * unit;
      tree(
        c,
        x,
        h * 0.89,
        (125 + Math.sin(i * 12) * 40 + layer * 80) * unit,
        layer ? '#203b3f' : '#304e4d',
      );
    }
  c.save();
  c.translate(-cam * unit, h - 92 - 470 * unit);
  c.scale(unit, unit);
  for (const p of platforms) {
    c.fillStyle = '#263f42';
    c.fillRect(p.x, p.y, p.w, p.y === 470 ? 180 : 17);
    c.fillStyle = '#71847a';
    c.fillRect(p.x, p.y, p.w, 4);
    c.fillStyle = '#a1a47d';
    for (let x = p.x + 15; x < p.x + p.w; x += 43) c.fillRect(x, p.y - 4, 8, 4);
    if (p.y === 470) {
      c.strokeStyle = '#365156';
      c.lineWidth = 1;
      for (let y = 490; y < 650; y += 28) {
        c.beginPath();
        c.moveTo(p.x, y);
        c.lineTo(p.x + p.w, y);
        c.stroke();
      }
    } else {
      c.fillStyle = '#304347';
      c.fillRect(p.x + 10, p.y + 17, 8, 470 - p.y);
      c.fillRect(p.x + p.w - 18, p.y + 17, 8, 470 - p.y);
    }
  }
  // A low mist moves across the gaps; it is only visual.
  for (let i = 0; i < 3; i++) {
    const x = 855 + i * 925;
    c.fillStyle = '#90b4b32e';
    c.fillRect(x, 515 + Math.sin(g.time + i) * 8, 130, 3);
  }
  anchors.forEach((x, i) => {
    lantern(c, x, 389, i <= g.found);
    if (i === g.found) {
      const pulse = 1 + Math.sin(g.time * 2) * 0.1;
      c.strokeStyle = '#eac693';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, 355, 23 * pulse, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = '#f1d3a6';
      c.font = '15px Georgia';
      c.textAlign = 'center';
      c.fillText(['I', 'II', 'III', 'IV'][i], x, 360);
    }
  });
  for (let i = 0; i < 3; i++) {
    const x = 1040 + i * 850 + Math.sin(g.time * 1.1 + i) * 60,
      y = 410 + Math.sin(g.time * 1.6 + i) * 30;
    c.save();
    c.translate(x, y);
    c.rotate(g.time * 0.4 + i);
    c.strokeStyle = '#adc0e479';
    c.lineWidth = 3;
    for (let j = 0; j < 3; j++) {
      c.beginPath();
      c.ellipse(0, 0, 29 - j * 6, 14 + j * 4, j, 0.2, 5.8);
      c.stroke();
    }
    c.restore();
  }
  if (!g.reduced) for (const t of g.trail) figure(c, t.x, t.y, 0, g.player.facing, true);
  const p = g.player;
  figure(c, p.x, p.y, p.grounded && Math.abs(p.vx) > 0 ? g.time * 14 : 0, p.facing);
  c.fillStyle = '#1a2d34';
  c.fillRect(3560, 344, 95, 126);
  polygon(c, [3545, 344, 3610, 296, 3670, 344], '#26383d');
  c.fillStyle = g.found === 4 ? '#ecd2a0' : '#55656b';
  c.fillRect(3590, 387, 32, 83);
  if (g.found === 4) {
    const glow = c.createRadialGradient(3606, 431, 1, 3606, 431, 100);
    glow.addColorStop(0, '#ecd2a044');
    glow.addColorStop(1, '#ecd2a000');
    c.fillStyle = glow;
    c.fillRect(3506, 331, 200, 200);
  }
  c.restore();
}
function riverScene(c: CanvasRenderingContext2D, g: CampaignEngine) {
  const { w, h, boat } = g;
  sky(c, w, h, g.time, 2);
  const horizon = h * 0.42,
    bottom = h * 0.95;
  const curve = (z: number) => Math.sin(z * 0.009) * 0.34 + Math.sin(z * 0.021) * 0.15;
  const projection = (z: number, x: number) => {
    const depth = 1 / (1 + Math.max(0, z - boat.z) * 0.027);
    return {
      x: w / 2 + (curve(z) - curve(boat.z)) * w * depth + (x - boat.x) * w * 0.7 * depth,
      y: horizon + (bottom - horizon) * depth,
      depth,
    };
  };
  const slices = 75;
  for (let i = slices; i > 0; i--) {
    const a = projection(boat.z + i * 4, 0),
      b = projection(boat.z + (i - 1) * 4, 0),
      aw = w * (0.05 + a.depth * 0.69),
      bw = w * (0.05 + b.depth * 0.69);
    polygon(
      c,
      [a.x - aw, a.y, a.x + aw, a.y, b.x + bw, b.y, b.x - bw, b.y],
      i % 4 < 2 ? '#466d73' : '#42676f',
    );
    polygon(c, [0, a.y, a.x - aw, a.y, b.x - bw, b.y, 0, b.y], i % 5 === 0 ? '#425852' : '#354e48');
    polygon(c, [a.x + aw, a.y, w, a.y, w, b.y, b.x + bw, b.y], i % 5 === 0 ? '#425852' : '#354e48');
    if (i % 5 === 0) {
      c.strokeStyle = '#c7d1bd25';
      c.beginPath();
      c.moveTo(a.x - aw * 0.62, a.y);
      c.lineTo(a.x + aw * 0.5, a.y);
      c.stroke();
    }
  }
  const objects: { z: number; x: number; kind: 'tree' | 'rock' | 'ring'; index: number }[] = [];
  for (let i = Math.floor(boat.z / 18); i < boat.z / 18 + 16; i++) {
    objects.push(
      { z: i * 18, x: 1.4, kind: 'tree', index: i },
      { z: i * 18 + 9, x: -1.45, kind: 'tree', index: i },
    );
  }
  riverRocks.forEach((r, i) => objects.push({ ...r, kind: 'rock', index: i }));
  riverRings.forEach((r, i) => {
    if (!g.rings.has(i)) objects.push({ ...r, kind: 'ring', index: i });
  });
  objects
    .filter((o) => o.z > boat.z - 2 && o.z < boat.z + 250)
    .sort((a, b) => b.z - a.z)
    .forEach((o) => {
      const p = projection(o.z, o.x),
        s = p.depth * Math.min(w, 1100);
      if (o.kind === 'tree') tree(c, p.x, p.y, s * 0.33, '#213d3d');
      if (o.kind === 'rock') {
        polygon(
          c,
          [
            p.x - s * 0.08,
            p.y,
            p.x - s * 0.06,
            p.y - s * 0.045,
            p.x + s * 0.015,
            p.y - s * 0.07,
            p.x + s * 0.07,
            p.y - s * 0.027,
            p.x + s * 0.08,
            p.y,
          ],
          '#394951',
        );
        c.strokeStyle = '#c9d9d580';
        c.beginPath();
        c.ellipse(p.x, p.y, s * 0.09, s * 0.008, 0, 0, Math.PI * 2);
        c.stroke();
      }
      if (o.kind === 'ring') {
        c.strokeStyle = '#cfebd0';
        c.lineWidth = Math.max(1, 4 * p.depth);
        c.beginPath();
        c.ellipse(p.x, p.y - s * 0.035, s * 0.08, s * 0.046, 0, 0, Math.PI * 2);
        c.stroke();
        c.strokeStyle = '#b6e4d344';
        c.lineWidth = 10 * p.depth;
        c.stroke();
      }
    });
  // A distant sail evokes the chapter's river economy without claiming a journey by Douglass.
  const sail = projection(boat.z + 170, 0);
  c.strokeStyle = '#d6c6a9';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(sail.x, sail.y);
  c.lineTo(sail.x, sail.y - 55);
  c.stroke();
  polygon(
    c,
    [sail.x + 4, sail.y - 54, sail.x + 32, sail.y - 13, sail.x + 4, sail.y - 13],
    '#dfceaf',
  );
  c.save();
  c.translate(w / 2, h * 0.96);
  c.rotate(g.reduced ? 0 : boat.tilt * 0.035);
  const bw = Math.min(w * 0.48, 400);
  polygon(c, [-bw * 0.6, 80, 0, -h * 0.22, bw * 0.6, 80], '#533f35');
  polygon(c, [-bw * 0.48, 80, 0, -h * 0.205, bw * 0.48, 80], '#947154');
  c.strokeStyle = '#c49c73';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(0, 60);
  c.lineTo(0, -h * 0.18);
  c.stroke();
  for (let i = 0; i < 4; i++) {
    const y = -h * 0.13 + i * h * 0.057,
      x = bw * (0.12 + i * 0.1);
    c.beginPath();
    c.moveTo(-x, y);
    c.lineTo(x, y);
    c.stroke();
  }
  c.restore();
  if (g.surgeActive && !g.reduced) {
    c.strokeStyle = '#d9e7e04d';
    for (let i = 0; i < 6; i++) {
      c.beginPath();
      c.moveTo(w * 0.1 + i * w * 0.16, h * 0.84);
      c.lineTo(w * 0.04 + i * w * 0.185, h);
      c.stroke();
    }
  }
}
function estateScene(c: CanvasRenderingContext2D, g: CampaignEngine) {
  const { w, h, eye } = g;
  sky(c, w, h, g.time, 3);
  const horizon = h * 0.46;
  const ground = c.createLinearGradient(0, horizon, 0, h);
  ground.addColorStop(0, '#55605b');
  ground.addColorStop(1, '#1d3036');
  c.fillStyle = ground;
  c.fillRect(0, horizon, w, h - horizon);
  for (let i = 1; i < 20; i++) {
    const y = horizon + (h - horizon) / (i * 0.31 + 1);
    c.strokeStyle = '#9da99b13';
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }
  const fov = 1.12,
    projection = w / (2 * Math.tan(fov / 2)),
    column = Math.max(2, Math.ceil(w / 500)),
    depths: number[] = [];
  for (let x = 0; x < w; x += column) {
    const angle = eye.angle + Math.atan((x - w / 2) / projection);
    const ray = castRay(eye.x, eye.y, angle);
    const distance = Math.max(0.12, ray.distance * Math.cos(angle - eye.angle));
    depths[Math.floor(x / column)] = distance;
    const height = (projection * (ray.tile === 2 ? 0.83 : 1.8)) / distance,
      top = horizon - height * 0.6;
    const colors =
      ray.tile === 2
        ? [69, 94, 76]
        : ray.tile === 3
          ? [119, 92, 69]
          : ray.tile === 4
            ? [92, 103, 99]
            : [116, 113, 99];
    const stripe = ray.hit % 1 > 0.92 ? 0.72 : 1,
      shade = Math.max(0.22, 1 / (1 + distance * 0.11)) * (ray.side ? 0.83 : 1) * stripe;
    c.fillStyle = `rgb(${colors.map((v) => Math.floor(v * shade)).join(',')})`;
    c.fillRect(x, top, column, height);
    c.fillStyle = '#0a202524';
    if (ray.tile === 2) {
      for (let yy = top; yy < top + height; yy += Math.max(8, height * 0.13))
        c.fillRect(x, yy, column, Math.max(1, height * 0.02));
    } else {
      c.fillRect(x, top + height * 0.32, column, Math.max(1, height * 0.018));
      c.fillRect(x, top + height * 0.68, column, Math.max(1, height * 0.016));
    }
    c.fillStyle = '#e5d5ac1c';
    c.fillRect(x, top, column, Math.max(1, height * 0.014));
  }
  const s = g.sentinel;
  const props = [
    ...testimonySites.map((p, i) => ({ ...p, kind: 'testimony', index: i })),
    { ...finalSite, kind: 'exit', index: 4 },
    { x: s.x, y: s.y, kind: 'veil', index: 5 },
  ];
  props
    .sort((a, b) => Math.hypot(b.x - eye.x, b.y - eye.y) - Math.hypot(a.x - eye.x, a.y - eye.y))
    .forEach((p) => {
      const distance = Math.hypot(p.x - eye.x, p.y - eye.y),
        angle = wrapAngle(Math.atan2(p.y - eye.y, p.x - eye.x) - eye.angle);
      if (Math.abs(angle) > fov * 0.85 || distance < 0.15) return;
      const corrected = distance * Math.cos(angle),
        x = w / 2 + Math.tan(angle) * projection,
        size = Math.min(h, (projection * 0.7) / corrected),
        y = horizon + size * 0.32;
      const d = depths[Math.floor(Math.max(0, Math.min(w - column, x)) / column)];
      if (corrected > d + 0.1) return;
      c.save();
      c.translate(x, y);
      if (p.kind === 'veil') {
        c.strokeStyle = '#d2b2df55';
        c.lineWidth = Math.max(1, size * 0.018);
        for (let i = 0; i < 4; i++) {
          c.beginPath();
          c.ellipse(0, -size * 0.35, size * 0.2, size * 0.4, g.time + i, 0.5, 5.8);
          c.stroke();
        }
      } else {
        const active = p.index === g.found;
        colorLantern(c, size, active, p.index < g.found);
        if (active) {
          c.fillStyle = '#f1d8ad';
          c.font = `${Math.max(11, Math.min(17, size * 0.13))}px Arial`;
          c.textAlign = 'center';
          c.fillText(
            p.kind === 'exit' ? 'FINAL LIGHT' : testimonySites[p.index].name,
            0,
            -size * 0.9,
          );
        }
      }
      c.restore();
    });
  // Compass points toward the next testimony even when it is outside the view.
  const target = g.found < 4 ? testimonySites[g.found] : finalSite,
    targetAngle = wrapAngle(Math.atan2(target.y - eye.y, target.x - eye.x) - eye.angle);
  const cx =
    w / 2 + Math.max(-w * 0.32, Math.min(w * 0.32, (targetAngle / (Math.PI / 2)) * w * 0.32));
  c.fillStyle = '#eed4a1';
  polygon(c, [cx - 4, 104, cx + 4, 104, cx, 112], '#eed4a1');
  c.strokeStyle = '#eff0df91';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(w / 2 - 5, h * 0.52);
  c.lineTo(w / 2 + 5, h * 0.52);
  c.moveTo(w / 2, h * 0.52 - 5);
  c.lineTo(w / 2, h * 0.52 + 5);
  c.stroke();
  // Held lantern: a physical first-person presence, not a gun in an invented battle.
  const bob = g.reduced
    ? 0
    : Math.sin(g.time * 8) * (g.controls.forward || g.controls.left || g.controls.right ? 3 : 0);
  c.save();
  c.translate(w * 0.82, h * 0.87 + bob);
  c.rotate(-0.08);
  const size = Math.min(w * 0.12, 80);
  c.fillStyle = '#715840';
  c.fillRect(-size * 0.23, size * 0.12, size * 0.45, size);
  c.fillStyle = '#172930';
  c.fillRect(-size * 0.43, -size * 0.67, size * 0.86, size * 0.85);
  c.fillStyle = '#d4b979';
  c.fillRect(-size * 0.3, -size * 0.55, size * 0.6, size * 0.55);
  c.strokeStyle = '#172930';
  c.lineWidth = 5;
  c.beginPath();
  c.arc(0, -size * 0.73, size * 0.23, Math.PI, 0);
  c.stroke();
  c.restore();
  if (g.alert > 0.01) {
    c.strokeStyle = `rgba(238,173,133,${g.alert * 0.65})`;
    c.lineWidth = 6;
    c.strokeRect(3, 3, w - 6, h - 6);
  }
  const mapSize = w < 600 ? 78 : 105,
    cell = mapSize / 16,
    mx = 22,
    my = h - (w < 600 ? 195 : mapSize + 28);
  c.fillStyle = '#11242bd9';
  c.fillRect(mx - 8, my - 8, mapSize + 16, mapSize + 16);
  estateMap.forEach((row, y) =>
    [...row].forEach((tile, x) => {
      if (tile !== '0') {
        c.fillStyle = '#8b9d9560';
        c.fillRect(mx + x * cell, my + y * cell, cell - 0.3, cell - 0.3);
      }
    }),
  );
  c.fillStyle = '#eed2a0';
  c.beginPath();
  c.arc(mx + target.x * cell, my + target.y * cell, 3, 0, Math.PI * 2);
  c.fill();
  c.save();
  c.translate(mx + eye.x * cell, my + eye.y * cell);
  c.rotate(eye.angle);
  polygon(c, [5, 0, -3, -3, -3, 3], '#bde1d7');
  c.restore();
}
function colorLantern(c: CanvasRenderingContext2D, size: number, active: boolean, done: boolean) {
  const color = done ? '#82b8a5' : active ? '#f3d298' : '#778882';
  c.fillStyle = '#20353a';
  c.fillRect(-size * 0.06, -size * 0.48, size * 0.12, size * 0.88);
  c.fillRect(-size * 0.23, -size * 0.75, size * 0.46, size * 0.35);
  c.fillStyle = color;
  c.fillRect(-size * 0.17, -size * 0.7, size * 0.34, size * 0.25);
  if (active) {
    const glow = c.createRadialGradient(0, -size * 0.55, size * 0.1, 0, -size * 0.55, size * 0.8);
    glow.addColorStop(0, '#f8d69a44');
    glow.addColorStop(1, '#f8d69a00');
    c.fillStyle = glow;
    c.fillRect(-size, -size * 1.55, size * 2, size * 2);
  }
}
export function renderCampaign(c: CanvasRenderingContext2D, g: CampaignEngine) {
  c.clearRect(0, 0, g.w, g.h);
  if (g.chapter === 1) platformScene(c, g);
  else if (g.chapter === 2) riverScene(c, g);
  else estateScene(c, g);
  const vignette = c.createRadialGradient(
    g.w / 2,
    g.h * 0.45,
    Math.min(g.w, g.h) * 0.25,
    g.w / 2,
    g.h * 0.45,
    Math.max(g.w, g.h) * 0.75,
  );
  vignette.addColorStop(0, '#09151b00');
  vignette.addColorStop(1, '#09151b85');
  c.fillStyle = vignette;
  c.fillRect(0, 0, g.w, g.h);
  if (g.flash > 0) {
    c.fillStyle = `rgba(211,171,142,${Math.min(0.12, g.flash * 0.3)})`;
    c.fillRect(0, 0, g.w, g.h);
  }
  if (g.notice.life > 0) {
    c.save();
    c.globalAlpha = Math.min(1, g.notice.life * 2);
    c.textAlign = 'center';
    c.font = '11px Arial';
    c.fillStyle = '#e9dbb8';
    c.shadowColor = '#122d36';
    c.shadowBlur = 10;
    c.fillText(g.notice.text, g.w / 2, g.h * 0.64);
    c.restore();
  }
}
