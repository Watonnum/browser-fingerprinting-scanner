import type { CanvasData } from '@/types/fingerprint';
import { sha256Hex } from './hash';

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 140;

interface CanvasRender {
  dataUrl: string;
  winding: boolean;
}

function drawScene(ctx: CanvasRenderingContext2D): void {
  const background = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  background.addColorStop(0, '#0f172a');
  background.addColorStop(0.45, '#1e1b4b');
  background.addColorStop(1, '#042f2e');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const radial = ctx.createRadialGradient(250, 40, 4, 250, 40, 90);
  radial.addColorStop(0, 'rgba(34, 211, 238, 0.95)');
  radial.addColorStop(0.5, 'rgba(168, 85, 247, 0.55)');
  radial.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = radial;
  ctx.fillRect(140, 0, 180, 140);

  ctx.globalCompositeOperation = 'multiply';
  const colors = ['rgb(255, 0, 255)', 'rgb(0, 255, 255)', 'rgb(255, 255, 0)'];
  const centers: Array<[number, number]> = [
    [60, 55],
    [95, 55],
    [77, 85],
  ];
  centers.forEach(([x, y], index) => {
    ctx.fillStyle = colors[index];
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';

  ctx.strokeStyle = 'rgba(52, 211, 153, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(10, 130);
  ctx.bezierCurveTo(80, 60, 160, 160, 310, 90);
  ctx.stroke();

  ctx.fillStyle = 'rgba(244, 63, 94, 0.75)';
  ctx.beginPath();
  ctx.moveTo(200, 120);
  ctx.lineTo(240, 70);
  ctx.lineTo(280, 125);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = 'rgba(34, 211, 238, 0.8)';
  ctx.shadowBlur = 6;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f8fafc';
  ctx.font = '600 20px Arial, sans-serif';
  ctx.fillText('Fingerprint \u00e7\u00e9\u00df \u03a9\u2248', 132, 34);
  ctx.shadowBlur = 0;

  ctx.font = 'italic 16px "Times New Roman", serif';
  ctx.fillStyle = 'rgba(250, 204, 21, 0.92)';
  ctx.fillText('Cwm fjordbank glyphs vext quiz', 8, 118);

  ctx.font = '15px "Courier New", monospace';
  ctx.fillStyle = 'rgba(129, 140, 248, 0.95)';
  ctx.fillText('0x7F3A\u2122 \u00bd \u221e', 150, 62);

  ctx.font = '26px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.fillText('\ud83e\udd8a\ud83d\udd12\ud83e\uddec\ud83d\udee1\ufe0f', 150, 102);

  ctx.textBaseline = 'top';
  ctx.font = '11px Georgia, serif';
  ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
  ctx.fillText('\u4f60\u597d \u0645\u0631\u062d\u0628\u0627 \u05e9\u05dc\u05d5\u05dd \u0928\u092e\u0938\u094d\u0924\u0947', 8, 6);
}

function renderOnce(): CanvasRender | null {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }
  ctx.rect(0, 0, 10, 10);
  ctx.rect(2, 2, 6, 6);
  const winding = ctx.isPointInPath(5, 5, 'evenodd') === false;
  ctx.beginPath();
  drawScene(ctx);
  return { dataUrl: canvas.toDataURL('image/png'), winding };
}

function emptyCanvasData(): CanvasData {
  return {
    supported: false,
    hash: '',
    dataUrl: '',
    preview: '',
    dataLength: 0,
    stable: true,
    winding: false,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  };
}

export async function probeCanvas(): Promise<CanvasData> {
  try {
    const first = renderOnce();
    if (!first || first.dataUrl.length < 32 || !first.dataUrl.startsWith('data:image')) {
      return emptyCanvasData();
    }
    const second = renderOnce();
    const [hash, secondHash] = await Promise.all([
      sha256Hex(first.dataUrl),
      second ? sha256Hex(second.dataUrl) : Promise.resolve(''),
    ]);
    return {
      supported: true,
      hash,
      dataUrl: first.dataUrl,
      preview: first.dataUrl.slice(0, 96),
      dataLength: first.dataUrl.length,
      stable: hash === secondHash,
      winding: first.winding,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    };
  } catch {
    return emptyCanvasData();
  }
}
