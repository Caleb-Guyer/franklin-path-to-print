import type { PlatformGame } from './platformer';
import type { Theme } from './world';
const palettes: Record<
  Theme,
  {
    top: string;
    bottom: string;
    far: string;
    near: string;
    stone: string;
    edge: string;
    glow: string;
  }
> = {
  garden: {
    top: '#172e46',
    bottom: '#64978a',
    far: '#315653',
    near: '#2e4a43',
    stone: '#334b40',
    edge: '#a4bc68',
    glow: '#ffdb8d',
  },
  boston: {
    top: '#142237',
    bottom: '#806477',
    far: '#343650',
    near: '#354355',
    stone: '#414c54',
    edge: '#a6b2b3',
    glow: '#ffce8a',
  },
  harbor: {
    top: '#121e3b',
    bottom: '#4f8191',
    far: '#294f64',
    near: '#234252',
    stone: '#4e4244',
    edge: '#b9936e',
    glow: '#98ede0',
  },
  london: {
    top: '#18182f',
    bottom: '#795578',
    far: '#303049',
    near: '#413a52',
    stone: '#493f51',
    edge: '#b596ac',
    glow: '#ffd88a',
  },
  philadelphia: {
    top: '#203044',
    bottom: '#c39480',
    far: '#515262',
    near: '#51535b',
    stone: '#514c4a',
    edge: '#d6b582',
    glow: '#ffe49e',
  },
  library: {
    top: '#141e32',
    bottom: '#646381',
    far: '#303347',
    near: '#3a3c4c',
    stone: '#414344',
    edge: '#c5a975',
    glow: '#f5d08f',
  },
};
const pixel = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) => {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};
function text(
  c: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size = 11,
  color = '#ffebbc',
  align: CanvasTextAlign = 'center',
) {
  c.font = `600 ${size}px system-ui`;
  c.textAlign = align;
  c.fillStyle = color;
  c.fillText(value, x, y);
}
function building(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  lit: boolean,
  seed: number,
) {
  pixel(c, x, y, w, h, color);
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x - 8, y + 1);
  c.lineTo(x + w / 2, y - 26 - (seed % 20));
  c.lineTo(x + w + 8, y + 1);
  c.fill();
  pixel(c, x + w * 0.7, y - 36, 11, 38, color);
  for (let row = 0; row < Math.floor(h / 38) - 1; row++)
    for (let col = 0; col < Math.floor(w / 27); col++) {
      const wx = x + 12 + col * 27,
        wy = y + 18 + row * 35;
      pixel(c, wx, wy, 10, 16, lit && (row + col + seed) % 3 ? '#c6966570' : '#0d233b65');
      pixel(c, wx + 4, wy, 2, 16, color);
      pixel(c, wx, wy + 7, 10, 2, color);
    }
}
function lantern(c: CanvasRenderingContext2D, x: number, y: number, glow: string) {
  const halo = c.createRadialGradient(x, y, 0, x, y, 43);
  halo.addColorStop(0, glow + '45');
  halo.addColorStop(1, glow + '00');
  c.fillStyle = halo;
  c.fillRect(x - 43, y - 43, 86, 86);
  pixel(c, x - 2, y - 8, 4, 52, '#192a35');
  pixel(c, x - 6, y - 12, 12, 18, '#302c38');
  pixel(c, x - 4, y - 9, 8, 11, glow);
  pixel(c, x - 8, y - 15, 16, 3, '#192a35');
}
export function drawFranklin(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  stride: number,
  air: boolean,
  alpha = 1,
  coat = '#527aaf',
  npc = false,
) {
  c.save();
  c.globalAlpha = alpha;
  c.translate(Math.round(x + 12), Math.round(y));
  c.scale(facing, 1);
  const leg = air ? 3 : Math.sin(stride) * 4,
    arm = air ? -5 : Math.cos(stride) * 3;
  pixel(c, -10, 22, 20, 14, coat);
  pixel(c, -12, 30, 9, 8, coat);
  pixel(c, 5, 30, 7, 8, coat);
  pixel(c, -7, 34 + leg, 5, 8, '#172637');
  pixel(c, 3, 34 - leg, 5, 8, '#172637');
  pixel(c, -8, 40 + leg, 8, 3, '#111b2b');
  pixel(c, 3, 40 - leg, 8, 3, '#111b2b');
  pixel(c, -7, 17, 14, 16, coat);
  pixel(c, -3, 18, 6, 15, '#f0d69f');
  pixel(c, -3, 25, 6, 2, '#b09976');
  pixel(c, -12, 20 + arm, 5, 12, coat);
  pixel(c, -12, 31 + arm, 5, 4, '#dfaa7a');
  pixel(c, 8, 19 - arm, 5, 12, coat);
  pixel(c, 8, 30 - arm, 5, 4, '#dfaa7a');
  pixel(c, -7, 3, 16, 14, '#e3b888');
  pixel(c, -7, 3, 16, 3, '#f1c99b');
  pixel(c, -10, 4, 5, 12, npc ? '#8a664e' : '#d6d1c1');
  pixel(c, -11, 14, 6, 6, npc ? '#604d43' : '#ddd8c6');
  pixel(c, -13, 18, 6, 3, '#253446');
  pixel(c, 6, 10, 5, 4, '#e4b687');
  pixel(c, -2, 8, 4, 4, '#293749');
  pixel(c, 5, 8, 4, 4, '#293749');
  pixel(c, -1, 9, 2, 2, '#bbd1c9');
  pixel(c, 6, 9, 2, 2, '#bbd1c9');
  pixel(c, 2, 9, 3, 1, '#293749');
  pixel(c, 3, 15, 5, 1, '#aa765a');
  pixel(c, -4, 17, 10, 3, '#f4e7c4');
  c.restore();
}
export function drawWorld(c: CanvasRenderingContext2D, g: PlatformGame) {
  const { world: w, width, height, camera } = g,
    p = palettes[w.theme],
    time = g.reducedMotion ? 0 : g.time;
  c.save();
  c.clearRect(0, 0, width, height);
  const sky = c.createLinearGradient(0, 0, 0, 600);
  sky.addColorStop(0, p.top);
  sky.addColorStop(1, p.bottom);
  c.fillStyle = sky;
  c.fillRect(0, 0, width, 600);
  for (let i = 0; i < 55; i++) {
    const x = (((i * 173.3 - camera * 0.1) % (width + 40)) + width + 40) % (width + 40),
      y = 22 + ((i * 79.7) % 245);
    c.globalAlpha = 0.2 + Math.sin(time * 0.7 + i) * 0.14;
    pixel(c, x, y, i % 5 === 0 ? 2 : 1, 2, '#e5e8d1');
  }
  c.globalAlpha = 1;
  const moonX = width * 0.78 - camera * 0.025;
  c.fillStyle = '#e3d5bd';
  c.beginPath();
  c.arc(moonX, 103, 31, 0, Math.PI * 2);
  c.fill();
  const glow = c.createRadialGradient(moonX, 103, 15, moonX, 103, 100);
  glow.addColorStop(0, '#edda9b24');
  glow.addColorStop(1, '#edda9b00');
  c.fillStyle = glow;
  c.fillRect(moonX - 100, 3, 200, 200);
  for (let layer = 0; layer < 2; layer++) {
    const parallax = layer === 0 ? 0.2 : 0.42,
      spacing = layer === 0 ? 137 : 173;
    const start = Math.floor((camera * parallax) / spacing) - 1;
    for (let i = start; i < start + Math.ceil(width / spacing) + 3; i++) {
      const x = i * spacing - camera * parallax,
        seed = Math.abs(i * 7919) % 83,
        h = 100 + seed + (layer === 0 ? 0 : 80),
        y = 520 - h;
      if (w.theme === 'garden') {
        const leaves = layer === 0 ? p.far : p.near;
        pixel(c, x + 30, y + 13, 16, h, layer === 0 ? '#284e4d' : '#203e3c');
        pixel(c, x + 22, y + 92, 8, 11, leaves);
        pixel(c, x + 12, y + 82, 14, 10, leaves);
        pixel(c, x + 45, y + 62, 19, 9, leaves);
        for (let tier = 0; tier < 4; tier++) {
          const spread = 27 + tier * 10,
            cy = y - 8 + tier * 27;
          pixel(c, x + 38 - spread, cy, spread * 2, 21, leaves);
          pixel(c, x + 44 - spread, cy - 9, spread * 2 - 12, 12, leaves);
          if (layer === 1) pixel(c, x + 44 - spread, cy - 9, spread - 8, 3, '#73977523');
        }
        pixel(c, x + 34, y + 129, 3, Math.max(12, h - 129), '#a1ad7330');
      } else if (w.theme === 'harbor') {
        c.fillStyle = layer === 0 ? p.far : p.near;
        c.beginPath();
        c.moveTo(x, 460);
        c.lineTo(x + 125, 460);
        c.lineTo(x + 100, 487);
        c.lineTo(x + 25, 487);
        c.fill();
        pixel(c, x + 56, 310, 4, 160, p.near);
        c.fillStyle = layer === 0 ? '#5a667465' : '#b5b8a449';
        c.beginPath();
        c.moveTo(x + 53, 322);
        c.lineTo(x + 7, 425);
        c.lineTo(x + 53, 425);
        c.fill();
        c.beginPath();
        c.moveTo(x + 65, 334);
        c.lineTo(x + 112, 420);
        c.lineTo(x + 65, 420);
        c.fill();
      } else building(c, x, y, spacing - 15, h, layer === 0 ? p.far : p.near, layer === 1, seed);
    }
  }
  if (w.theme === 'library') {
    for (let i = 0; i < Math.ceil(width / 180) + 2; i++) {
      const x = i * 180 - ((camera * 0.55) % 180);
      pixel(c, x, 145, 10, 360, '#262b3c');
      for (let j = 0; j < 4; j++) {
        pixel(c, x, 200 + j * 71, 160, 5, '#967c6355');
        for (let k = 0; k < 13; k++)
          pixel(
            c,
            x + 12 + k * 10,
            162 + j * 71 + (k % 3) * 5,
            7,
            38 - (k % 3) * 5,
            ['#c896695c', '#669a9b70', '#a66e8270'][k % 3],
          );
      }
    }
  }
  c.fillStyle = w.theme === 'harbor' ? '#12324b' : '#14283b';
  c.fillRect(0, 555, width, 45);
  for (let i = 0; i < 18; i++) {
    const x =
      (((i * 99 + time * 15 - camera * 0.35) % (width + 100)) + width + 100) % (width + 100);
    pixel(c, x, 558 + (i % 4) * 11, 30 + (i % 3) * 15, 2, '#77b0b137');
  }
  c.save();
  if (g.shake && !g.reducedMotion)
    c.translate(Math.sin(time * 99) * g.shake, Math.cos(time * 87) * g.shake * 0.6);
  for (const platform of w.platforms) {
    const x = platform.x - camera;
    if (x > width + 40 || x + platform.w < -40) continue;
    if (platform.kind === 'ground') {
      pixel(c, x, platform.y, platform.w, platform.h, p.stone);
      pixel(c, x, platform.y, platform.w, 5, p.edge);
      pixel(c, x, platform.y + 5, platform.w, 6, '#1a233741');
      for (let row = 0; row < 4; row++)
        for (let col = 0; col < platform.w / 32; col++) {
          const bx = x + col * 32 + (row % 2) * 16;
          pixel(c, bx, platform.y + 18 + row * 22, 27, 1, '#afaa9430');
          pixel(c, bx, platform.y + 18 + row * 22, 1, 18, '#18273355');
        }
      if (w.theme === 'garden')
        for (let i = 0; i < platform.w; i += 19) {
          pixel(c, x + i, platform.y - 4, 3 + (i % 4), 6, '#91af68');
          if (i % 57 === 0) {
            pixel(c, x + i + 5, platform.y - 10, 2, 10, '#647c54');
            pixel(c, x + i + 3, platform.y - 12, 6, 4, '#d8b785');
          }
        }
      if (platform.w > 200) {
        pixel(c, x + 85, platform.y - 8, 19, 8, '#54675a');
        pixel(c, x + 89, platform.y - 12, 11, 4, '#6a7d6a');
      }
    } else {
      pixel(
        c,
        x,
        platform.y,
        platform.w,
        platform.h,
        platform.kind === 'wood' ? '#956f58' : '#56616d',
      );
      pixel(c, x, platform.y, platform.w, 4, platform.kind === 'moving' ? '#a7e0d3' : p.edge);
      for (let i = 8; i < platform.w; i += 21)
        pixel(c, x + i, platform.y + 5, 2, platform.h - 5, '#192a3b78');
      if (platform.kind === 'roof') {
        c.fillStyle = '#384052';
        c.beginPath();
        c.moveTo(x - 6, platform.y + 2);
        c.lineTo(x + platform.w / 2, platform.y - 13);
        c.lineTo(x + platform.w + 6, platform.y + 2);
        c.fill();
        pixel(c, x - 5, platform.y + 1, platform.w + 10, 3, p.edge);
      }
    }
  }
  for (const stop of w.stops) {
    const x = stop.x - camera;
    if (x < -120 || x > width + 120) continue;
    lantern(c, x + 16, 466, p.glow);
    pixel(c, x - 17, 469, 3, 51, '#192c38');
    pixel(c, x - 14, 470, 23, 14, stop.visited ? '#8fd2ad' : '#998373');
    pixel(c, x - 12, 474, 12, 2, '#f0dfb1');
    drawFranklin(c, x - 5, 478, g.player.x > stop.x ? 1 : -1, time, false, 1, '#a67e68', true);
    if (g.started && Math.abs(g.player.x - stop.x) < 80 && g.player.y > 365) {
      pixel(c, x + 9, 419, 63, 21, '#0d2035df');
      text(c, 'E · TALK', x + 40, 434, 10);
    }
  }
  for (const spring of w.springs) {
    const x = spring.x - camera;
    pixel(c, x, spring.y + 8, spring.w, 7, '#304555');
    pixel(c, x + 3, spring.y + 3, spring.w - 6, 4, '#73d0b6');
    pixel(c, x, spring.y, spring.w, 4, '#c0f4cf');
  }
  for (const spike of w.spikes) {
    const x = spike.x - camera;
    c.fillStyle = '#8edcde';
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      c.moveTo(x + k * 9, spike.y + 14);
      c.lineTo(x + k * 9 + 4, spike.y);
      c.lineTo(x + k * 9 + 9, spike.y + 14);
      c.fill();
    }
  }
  for (const page of w.pages) {
    if (page.collected) continue;
    const x = page.x - camera,
      y = page.y + Math.sin(time * 3 + page.x) * 4;
    if (x < -30 || x > width + 30) continue;
    const halo = c.createRadialGradient(x, y, 0, x, y, 26);
    halo.addColorStop(0, '#ffe3a343');
    halo.addColorStop(1, '#ffe3a300');
    c.fillStyle = halo;
    c.fillRect(x - 26, y - 26, 52, 52);
    c.save();
    c.translate(x, y);
    c.rotate(Math.sin(time * 2 + page.x) * 0.08);
    pixel(c, -7, -10, 15, 21, '#7d5b42');
    pixel(c, -8, -11, 14, 20, '#f7dc9b');
    pixel(c, -5, -6, 8, 1, '#a78154');
    pixel(c, -5, -2, 7, 1, '#a78154');
    pixel(c, -5, 2, 5, 1, '#a78154');
    pixel(c, 3, -11, 3, 4, '#fff0c1');
    c.restore();
  }
  for (const enemy of w.enemies) {
    if (!enemy.alive) continue;
    const x = enemy.x - camera,
      y = enemy.y + Math.sin(time * 5 + enemy.phase) * 3;
    if (x < -50 || x > width + 50) continue;
    c.fillStyle = '#112034';
    c.beginPath();
    c.ellipse(x + 14, y + 17, 17, 14, Math.sin(time * 3) * 0.2, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < 5; i++)
      pixel(c, x + i * 6 - 2, y + 23 + Math.sin(time * 5 + i) * 4, 6, 8, '#112034');
    pixel(c, x + 6, y + 10, 6, 6, '#d3b8f0');
    pixel(c, x + 18, y + 10, 6, 6, '#d3b8f0');
    pixel(c, x + 8, y + 12, 2, 3, '#202039');
    pixel(c, x + 20, y + 12, 2, 3, '#202039');
  }
  const ex = w.exit.x - camera;
  if (ex < width + 150) {
    lantern(c, ex - 18, 442, p.glow);
    pixel(c, ex, w.exit.y, 77, 106, '#162b3b');
    pixel(c, ex - 5, w.exit.y - 7, 87, 8, '#b18e64');
    pixel(c, ex + 7, w.exit.y + 9, 63, 97, '#273d46');
    pixel(c, ex + 14, w.exit.y + 31, 48, 5, '#f1ca89');
    pixel(c, ex + 35, w.exit.y + 13, 7, 62, '#aa936f');
    pixel(c, ex + 20, w.exit.y + 70, 40, 8, '#c7ab7e');
    pixel(c, ex + 15, w.exit.y + 91, 48, 7, '#dcc69b');
    text(c, 'PRINT SHOP', ex + 38, w.exit.y - 16, 10);
    if (g.started && Math.abs(g.player.x - w.exit.x) < 100) {
      pixel(c, ex - 2, w.exit.y - 58, 82, 23, '#0d2035ef');
      text(c, 'E · ENTER', ex + 39, w.exit.y - 42, 11);
    }
  }
  for (const t of g.trails)
    drawFranklin(
      c,
      t.x - camera,
      t.y,
      t.facing,
      time * 14,
      true,
      (t.life / 0.22) * 0.35,
      '#84dfd4',
    );
  const player = g.player;
  c.globalAlpha = 0.2;
  c.fillStyle = '#071828';
  c.beginPath();
  c.ellipse(player.x + 12 - camera, player.y + 43, 15, 4, 0, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
  const blinking = player.invincible > 0 && Math.floor(time * 16) % 2 === 0;
  if (g.running && g.chain >= 2 && g.elapsed < g.chainUntil)
    text(c, `${g.chain} page streak`, player.x + 12 - camera, player.y - 13, 10, '#c1f1cc');
  drawFranklin(
    c,
    player.x - camera,
    player.y,
    player.facing,
    Math.abs(player.vx) > 20 ? time * 15 : 0,
    !player.grounded,
    blinking ? 0.35 : 1,
  );
  for (const part of g.particles) {
    c.globalAlpha = Math.min(1, (part.life / part.max) * 2);
    pixel(c, part.x - camera, part.y, part.size, part.size, part.color);
  }
  c.globalAlpha = 1;
  c.restore();
  if (!g.reducedMotion && (w.theme === 'london' || w.theme === 'harbor')) {
    c.strokeStyle = '#b8d9e218';
    c.lineWidth = 1;
    for (let i = 0; i < 45; i++) {
      const x = (i * 47 + time * 85) % width,
        y = (i * 83 + time * 230) % 600;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x - 4, y + 12);
      c.stroke();
    }
  }
  const vignette = c.createLinearGradient(0, 0, 0, 600);
  vignette.addColorStop(0, '#1015256b');
  vignette.addColorStop(0.3, '#10152500');
  vignette.addColorStop(0.83, '#10152500');
  vignette.addColorStop(1, '#101525b0');
  c.fillStyle = vignette;
  c.fillRect(0, 0, width, 600);
  c.restore();
}
