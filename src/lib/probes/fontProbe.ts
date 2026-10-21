import type { FontData } from '@/types/fingerprint';
import { sha256Hex } from './hash';

export const FONT_GROUPS: Readonly<Record<'Windows' | 'macOS' | 'Linux', readonly string[]>> = {
  Windows: [
    'Arial',
    'Calibri',
    'Cambria',
    'Consolas',
    'Courier New',
    'Segoe UI',
    'Tahoma',
    'Verdana',
    'Comic Sans MS',
    'Lucida Console',
  ],
  macOS: [
    'Helvetica Neue',
    'Menlo',
    'Monaco',
    'Avenir Next',
    'Futura',
    'Gill Sans',
    'Optima',
    'Baskerville',
    'Apple Chancery',
  ],
  Linux: ['DejaVu Sans', 'Ubuntu', 'Liberation Sans', 'Noto Sans', 'Cantarell', 'Droid Sans'],
};

export const FONT_CANDIDATES: readonly string[] = [...FONT_GROUPS.Windows, ...FONT_GROUPS.macOS, ...FONT_GROUPS.Linux];

const BASE_FONTS = ['monospace', 'sans-serif', 'serif'] as const;
const TEST_STRING = 'mmmmmmmmmmlli1WQ@#$%&jgy\u00e6\u00f8';
const TEST_SIZE = '72px';

interface Dimensions {
  width: number;
  height: number;
}

function createSpan(fontFamily: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.textContent = TEST_STRING;
  span.style.position = 'absolute';
  span.style.left = '-9999px';
  span.style.top = '-9999px';
  span.style.fontSize = TEST_SIZE;
  span.style.fontStyle = 'normal';
  span.style.fontWeight = 'normal';
  span.style.letterSpacing = 'normal';
  span.style.lineHeight = 'normal';
  span.style.whiteSpace = 'nowrap';
  span.style.fontFamily = fontFamily;
  return span;
}

function measure(span: HTMLSpanElement): Dimensions {
  return { width: span.offsetWidth, height: span.offsetHeight };
}

export async function probeFonts(): Promise<FontData> {
  const tested = [...FONT_CANDIDATES];
  if (typeof document === 'undefined' || !document.body) {
    return { tested, detected: [], detectedCount: 0, hash: '' };
  }

  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.visibility = 'hidden';
  container.style.pointerEvents = 'none';

  const baseSpans = BASE_FONTS.map((base) => createSpan(base));
  baseSpans.forEach((span) => container.appendChild(span));

  const candidateSpans = tested.map((font) =>
    BASE_FONTS.map((base) => {
      const span = createSpan(`'${font}', ${base}`);
      container.appendChild(span);
      return span;
    }),
  );

  document.body.appendChild(container);

  try {
    const baseDimensions = baseSpans.map(measure);
    const detected = tested.filter((_, fontIndex) =>
      candidateSpans[fontIndex].some((span, baseIndex) => {
        const dims = measure(span);
        const base = baseDimensions[baseIndex];
        return dims.width !== base.width || dims.height !== base.height;
      }),
    );
    const hash = await sha256Hex(detected.join('|'));
    return { tested, detected, detectedCount: detected.length, hash };
  } finally {
    container.remove();
  }
}
