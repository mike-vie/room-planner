import * as THREE from 'three';

// --- Helpers ---

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function noise2D(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const n00 = noise2D(ix, iy, seed);
  const n10 = noise2D(ix + 1, iy, seed);
  const n01 = noise2D(ix, iy + 1, seed);
  const n11 = noise2D(ix + 1, iy + 1, seed);

  const nx0 = n00 + sx * (n10 - n00);
  const nx1 = n01 + sx * (n11 - n01);
  return nx0 + sy * (nx1 - nx0);
}

function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * smoothNoise(x * freq, y * freq, seed + i * 100);
    amp *= 0.5;
    freq *= 2;
  }
  return val;
}

// --- Wood Plank Floor Texture ---

export function createFloorTexture(width = 1024, height = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const rand = seededRandom(42);
  const plankCount = 8;
  const plankH = height / plankCount;

  for (let p = 0; p < plankCount; p++) {
    const py = p * plankH;

    // Each plank has a slightly different base color
    const baseR = 170 + (rand() - 0.5) * 30;
    const baseG = 130 + (rand() - 0.5) * 25;
    const baseB = 85 + (rand() - 0.5) * 20;
    const plankSeed = rand() * 1000;

    // Draw plank base
    for (let y = 0; y < plankH; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x / width;
        const ny = (py + y) / height;

        // Wood grain: elongated along x
        const grain = fbm(nx * 3 + plankSeed, ny * 40 + plankSeed, plankSeed, 5);
        const grainDetail = fbm(nx * 8 + plankSeed * 2, ny * 80, plankSeed + 50, 3);

        // Ring pattern (subtle)
        const ringX = nx * 2 + plankSeed;
        const ringY = ny * 0.5;
        const ring = Math.sin((ringX * 3 + grain * 2) * Math.PI * 2) * 0.5 + 0.5;

        const variation = grain * 0.25 + grainDetail * 0.1 + ring * 0.08;

        const r = Math.min(255, Math.max(0, baseR + variation * 60 - 30));
        const g = Math.min(255, Math.max(0, baseG + variation * 50 - 25));
        const b = Math.min(255, Math.max(0, baseB + variation * 35 - 18));

        ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
        ctx.fillRect(x, py + y, 1, 1);
      }
    }

    // Plank gap
    ctx.fillStyle = 'rgba(60, 40, 20, 0.6)';
    ctx.fillRect(0, py, width, 1.5);

    // Staggered vertical seams — 2 per plank
    const seam1 = (rand() * 0.4 + 0.2) * width;
    const seam2 = (rand() * 0.4 + 0.55) * width;
    ctx.fillStyle = 'rgba(60, 40, 20, 0.4)';
    ctx.fillRect(seam1, py, 1.5, plankH);
    ctx.fillRect(seam2, py, 1.5, plankH);
  }

  // Subtle overall varnish overlay
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
  gradient.addColorStop(0, 'rgba(255, 240, 210, 0.04)');
  gradient.addColorStop(1, 'rgba(80, 50, 20, 0.06)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createFloorNormalMap(width = 512, height = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Flat normal = (128, 128, 255) in RGB
  ctx.fillStyle = 'rgb(128, 128, 255)';
  ctx.fillRect(0, 0, width, height);

  const plankCount = 8;
  const plankH = height / plankCount;

  for (let p = 0; p < plankCount; p++) {
    const py = p * plankH;

    // Grain bumps
    for (let y = 0; y < plankH; y++) {
      for (let x = 0; x < width; x++) {
        const grain = fbm(x / width * 4, (py + y) / height * 60, 42 + p * 10, 3);
        const nx = 128 + (grain - 0.5) * 20;
        const ny = 128 + (grain - 0.5) * 8;
        ctx.fillStyle = `rgb(${nx | 0},${ny | 0},240)`;
        ctx.fillRect(x, py + y, 1, 1);
      }
    }

    // Plank gap groove
    ctx.fillStyle = 'rgb(128, 100, 200)';
    ctx.fillRect(0, py, width, 2);
    ctx.fillStyle = 'rgb(128, 156, 200)';
    ctx.fillRect(0, py + 2, width, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createFloorRoughnessMap(width = 512, height = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const n = fbm(x / width * 6, y / height * 6, 77, 3);
      const v = 140 + n * 50; // Roughness ~0.55-0.75
      ctx.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// --- Wall Plaster Texture ---

export function createWallTexture(baseColor: string, width = 512, height = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const [br, bg, bb] = hexToRgb(baseColor);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const n1 = fbm(x / width * 12, y / height * 12, 123, 4);
      const n2 = fbm(x / width * 30, y / height * 30, 456, 2);
      const variation = (n1 - 0.5) * 12 + (n2 - 0.5) * 4;

      const r = Math.min(255, Math.max(0, br + variation));
      const g = Math.min(255, Math.max(0, bg + variation));
      const b = Math.min(255, Math.max(0, bb + variation));

      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createWallNormalMap(width = 512, height = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const n = fbm(x / width * 20, y / height * 20, 789, 4);
      const fine = noise2D(x * 0.5, y * 0.5, 101);
      const nx = 128 + (n - 0.5) * 18 + (fine - 0.5) * 6;
      const ny = 128 + (n - 0.5) * 18 + (fine - 0.5) * 6;
      ctx.fillStyle = `rgb(${nx | 0},${ny | 0},248)`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// --- Color-neutral Wood Grain Texture (for furniture) ---
// Grayscale grain pattern around white — tinted by material.color at render time.
// This way color changes are instant without regenerating textures.

export function createWoodGrainTexture(width = 512, height = 512, seed = 0): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const base = 230; // bright gray base, so material.color controls actual hue

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const ny = y / height;

      // Elongated horizontal grain
      const grain = fbm(nx * 2 + seed, ny * 25 + seed, seed + 11, 4);
      const detail = fbm(nx * 6 + seed, ny * 50 + seed, seed + 22, 3);
      const ring = Math.sin((nx * 4 + grain * 1.5) * Math.PI) * 0.5 + 0.5;

      const variation = (grain - 0.5) * 40 + (detail - 0.5) * 15 + (ring - 0.5) * 12;
      const v = Math.min(255, Math.max(160, base + variation));

      ctx.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createWoodNormalMap(width = 512, height = 512, seed = 0): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const grain = fbm(x / width * 3 + seed, y / height * 30 + seed, seed + 33, 3);
      const nx = 128 + (grain - 0.5) * 14;
      const ny = 128 + (grain - 0.5) * 6;
      ctx.fillStyle = `rgb(${nx | 0},${ny | 0},245)`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// --- Color-neutral Fabric Weave Texture ---
// Grayscale weave pattern — tinted by material.color.

export function createFabricWeaveTexture(width = 256, height = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const base = 235;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const weaveX = Math.sin(x * 0.8) * 0.5 + 0.5;
      const weaveY = Math.sin(y * 0.8) * 0.5 + 0.5;
      const weave = ((x + y) % 4 < 2) ? weaveX : weaveY;

      const n = fbm(x / width * 15, y / height * 15, 555, 3);
      const variation = (weave - 0.5) * 12 + (n - 0.5) * 10;
      const v = Math.min(255, Math.max(190, base + variation));

      ctx.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createFabricNormalMap(width = 256, height = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const weaveX = Math.sin(x * 0.8) * 0.3;
      const weaveY = Math.sin(y * 0.8) * 0.3;
      const crossHatch = ((x + y) % 4 < 2) ? weaveX : weaveY;
      const nx = 128 + crossHatch * 30;
      const ny = 128 + crossHatch * 30;
      ctx.fillStyle = `rgb(${nx | 0},${ny | 0},248)`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// --- Wood Roughness Map ---
// fBm variation: base 0.70, knots brighter (rougher), grain lines darker (smoother)

export function createWoodRoughnessMap(width = 512, height = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const ny = y / height;

      // Base roughness ~0.70 (value ~179)
      const base = 179;
      // Grain lines (elongated along X) are smoother → darker
      const grain = fbm(nx * 2, ny * 25, 77, 4);
      // Knot-like variations are rougher → brighter
      const knot = fbm(nx * 6, ny * 6, 123, 3);

      const variation = (grain - 0.5) * (-40) + (knot - 0.5) * 30;
      const v = Math.min(255, Math.max(80, base + variation));

      ctx.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// --- Fabric Roughness Map ---
// Weave pattern: warp threads slightly smoother than weft threads

export function createFabricRoughnessMap(width = 256, height = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Base roughness ~0.88 (value ~224)
      const base = 224;
      // Warp (x-aligned) vs weft (y-aligned) threads
      const isWarp = ((x + y) % 4 < 2);
      const warpSmooth = isWarp ? -12 : 12; // warp smoother, weft rougher
      const threadSin = Math.sin((isWarp ? x : y) * 0.8) * 8;
      const n = fbm(x / width * 15, y / height * 15, 555, 2);
      const variation = warpSmooth + threadSin + (n - 0.5) * 10;
      const v = Math.min(255, Math.max(160, base + variation));

      ctx.fillStyle = `rgb(${v | 0},${v | 0},${v | 0})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
