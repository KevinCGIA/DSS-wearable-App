// Regenerates every logo/icon PNG in assets/ from one definition.
// Run: node scripts/generate-logo.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (name) => path.join(root, 'assets', name);

// Theme palette (src/theme/colors.ts)
const BLUE50 = [0xea, 0xf3, 0xff];
const BLUE400 = [0x4f, 0x94, 0xf2];
const BLUE500 = [0x2b, 0x7b, 0xe4];
const WHITE = [0xff, 0xff, 0xff];

// Chevron in a unit square: two capsules meeting at the apex.
const APEX = [0.5, 0.345];
const LEFT = [0.315, 0.655];
const RIGHT = [0.685, 0.655];
const STROKE = 0.066;

function segmentDistance(px, py, [ax, ay], [bx, by]) {
  const vx = bx - ax;
  const vy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}

function chevronDistance(x, y, scale) {
  // scale shrinks the mark around the centre (Android adaptive icons need a safe zone)
  const ux = 0.5 + (x - 0.5) / scale;
  const uy = 0.5 + (y - 0.5) / scale;
  const d = Math.min(segmentDistance(ux, uy, APEX, LEFT), segmentDistance(ux, uy, APEX, RIGHT)) - STROKE;
  return d * scale;
}

function roundedSquareDistance(x, y, radius) {
  const qx = Math.abs(x - 0.5) - (0.5 - radius);
  const qy = Math.abs(y - 0.5) - (0.5 - radius);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
}

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const coverage = (distance, px) => Math.max(0, Math.min(1, 0.5 - distance / px));

function render(size, { background, cornerRadius = 0, scale = 1, mark = 'gradient' }) {
  const png = new PNG({ width: size, height: size });
  const px = 1 / size;

  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const x = (i + 0.5) / size;
      const y = (j + 0.5) / size;

      let rgb = [0, 0, 0];
      let alpha = 0;

      if (background) {
        const a = cornerRadius > 0 ? coverage(roundedSquareDistance(x, y, cornerRadius), px) : 1;
        rgb = background;
        alpha = a;
      }

      const c = coverage(chevronDistance(x, y, scale), px);
      if (c > 0) {
        const t = Math.max(0, Math.min(1, (y - (0.5 - 0.22 * scale)) / (0.44 * scale)));
        const markRgb = mark === 'white' ? WHITE : mark === 'black' ? [0, 0, 0] : mix(BLUE500, BLUE400, t);
        const outA = c + alpha * (1 - c);
        rgb = outA > 0 ? mix(rgb, markRgb, c / outA) : markRgb;
        alpha = outA;
      }

      const k = (j * size + i) * 4;
      png.data[k] = Math.round(rgb[0]);
      png.data[k + 1] = Math.round(rgb[1]);
      png.data[k + 2] = Math.round(rgb[2]);
      png.data[k + 3] = Math.round(alpha * 255);
    }
  }
  return png;
}

function write(name, png, { opaque = false } = {}) {
  const buffer = PNG.sync.write(png, opaque ? { colorType: 2 } : {});
  fs.writeFileSync(out(name), buffer);
  console.log(`wrote assets/${name} (${png.width}×${png.height})`);
}

// iOS app icon: full-bleed square, no transparency (iOS applies its own mask).
write('icon.png', render(1024, { background: BLUE50 }), { opaque: true });
// In-app logo: rounded square with transparent corners.
write('logo.png', render(512, { background: BLUE50, cornerRadius: 0.24 }));
// Splash: mark only on transparent.
write('splash-icon.png', render(1024, { scale: 0.6 }));
// Web favicon.
write('favicon.png', render(48, { background: BLUE50, cornerRadius: 0.24 }));
// Android adaptive icon layers (mark inside the 66% safe zone).
write('android-icon-foreground.png', render(512, { scale: 0.62 }));
write('android-icon-background.png', render(512, { background: BLUE50 }), { opaque: true });
write('android-icon-monochrome.png', render(432, { scale: 0.62, mark: 'black' }));
