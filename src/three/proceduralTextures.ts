import * as THREE from 'three';

export const LID_REFERENCE_TEX_URL = '/assets/aistudio/image_1620d903.png';
export const PANEL_REFERENCE_TEX_URL = '/assets/aistudio/image_1cec9686.png';

export function createTuftedVelvetTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Soft blush-rose velvet base
  const grad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size * 0.72);
  grad.addColorStop(0, '#fae4ea');
  grad.addColorStop(0.55, '#f2cfd8');
  grad.addColorStop(1, '#e1b4c0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Quilted diamond tufting lines
  const step = 64;
  ctx.strokeStyle = 'rgba(168, 98, 120, 0.22)';
  ctx.lineWidth = 2;
  for (let i = -size; i <= size * 2; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i, size);
    ctx.lineTo(i + size, 0);
    ctx.stroke();
  }

  // Tuft dimples & tiny pearl stitches
  for (let y = 0; y <= size; y += step) {
    for (let x = 0; x <= size; x += step) {
      const rx = (y / step) % 2 === 0 ? x : x + step / 2;
      ctx.beginPath();
      ctx.arc(rx, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(155, 82, 104, 0.28)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(rx - 0.8, y - 0.8, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 250, 252, 0.8)';
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1.4);
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createTurntableTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const cx = size / 2;
  const cy = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm ivory-pearl porcelain disc
  const bg = ctx.createRadialGradient(cx - 60, cy - 60, 40, cx, cy, size * 0.5);
  bg.addColorStop(0, '#fffdf9');
  bg.addColorStop(0.55, '#f9eae5');
  bg.addColorStop(0.88, '#efd4cf');
  bg.addColorStop(1, '#dfc0ba');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Concentric antique gold filigree rings
  const rings = [470, 438, 392, 310, 195];
  rings.forEach((r, idx) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = idx % 2 === 0 ? '#cfa14b' : 'rgba(210, 165, 92, 0.55)';
    ctx.lineWidth = idx === 0 ? 10 : idx === 1 ? 3 : 2;
    if (idx === 2) ctx.setLineDash([8, 12]);
    else ctx.setLineDash([]);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Radial sunburst engravings
  ctx.strokeStyle = 'rgba(208, 165, 90, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI * 2) / 24;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 125, cy + Math.sin(a) * 125);
    ctx.lineTo(cx + Math.cos(a) * 388, cy + Math.sin(a) * 388);
    ctx.stroke();
  }

  // Pearl ring dots
  for (let i = 0; i < 36; i++) {
    const a = (i * Math.PI * 2) / 36;
    const px = cx + Math.cos(a) * 416;
    const py = cy + Math.sin(a) * 416;
    ctx.beginPath();
    ctx.arc(px, py, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff9f4';
    ctx.fill();
    ctx.strokeStyle = '#d3a966';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Center blush-gold rose medallion
  ctx.beginPath();
  ctx.arc(cx, cy, 118, 0, Math.PI * 2);
  ctx.fillStyle = '#f8e0e6';
  ctx.fill();
  ctx.strokeStyle = '#cfa14b';
  ctx.lineWidth = 4;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createLidPlaqueTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 768;
  const h = 480;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.52);
  grad.addColorStop(0, '#fffdf9');
  grad.addColorStop(0.75, '#fdf1f4');
  grad.addColorStop(1, '#f3dce3');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle gold inner oval border
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(1, h / w);
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.44, 0, Math.PI * 2);
  ctx.strokeStyle = '#cfa048';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.restore();

  // Delicate heart icon above text
  ctx.save();
  ctx.translate(w / 2, h * 0.34);
  ctx.fillStyle = '#da889d';
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.bezierCurveTo(-24, -4, -30, -24, -13, -30);
  ctx.bezierCurveTo(-4, -33, 0, -24, 0, -20);
  ctx.bezierCurveTo(0, -24, 4, -33, 13, -30);
  ctx.bezierCurveTo(30, -24, 24, -4, 0, 18);
  ctx.fill();
  ctx.restore();

  // Romantic inscription
  ctx.fillStyle = '#6e3b49';
  ctx.font = 'italic 500 54px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Para siempre juntos', w / 2, h * 0.58);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    10,
    size / 2,
    size / 2,
    size * 0.48
  );
  grad.addColorStop(0, 'rgba(62, 26, 38, 0.45)');
  grad.addColorStop(0.55, 'rgba(62, 26, 38, 0.18)');
  grad.addColorStop(1, 'rgba(62, 26, 38, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function loadReferenceReliefTexture(
  url: string,
  maxAnisotropy: number
): THREE.Texture {
  const loader = new THREE.TextureLoader();
  const tex = loader.load(url, (loaded) => {
    loaded.colorSpace = THREE.SRGBColorSpace;
    loaded.anisotropy = maxAnisotropy;
    loaded.needsUpdate = true;
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}
