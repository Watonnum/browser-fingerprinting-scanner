import type { AudioData } from '@/types/fingerprint';
import { sha256Hex } from './hash';

const SAMPLE_RATE = 44100;
const FRAMES = 5000;
const PREVIEW_POINTS = 96;
const RENDER_TIMEOUT_MS = 4000;

type OfflineContextConstructor = typeof OfflineAudioContext;

function resolveConstructor(): OfflineContextConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const scope = window as unknown as {
    OfflineAudioContext?: OfflineContextConstructor;
    webkitOfflineAudioContext?: OfflineContextConstructor;
  };
  return scope.OfflineAudioContext ?? scope.webkitOfflineAudioContext ?? null;
}

function renderContext(context: OfflineAudioContext): Promise<AudioBuffer> {
  return new Promise<AudioBuffer>((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Audio rendering timed out'));
      }
    }, RENDER_TIMEOUT_MS);

    const finish = (buffer: AudioBuffer) => {
      if (!settled) {
        settled = true;
        window.clearTimeout(timer);
        resolve(buffer);
      }
    };

    context.oncomplete = (event: OfflineAudioCompletionEvent) => finish(event.renderedBuffer);

    const result = context.startRendering() as Promise<AudioBuffer> | undefined;
    if (result && typeof result.then === 'function') {
      result.then(finish).catch((error: unknown) => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          reject(error instanceof Error ? error : new Error('Audio rendering failed'));
        }
      });
    }
  });
}

async function renderSignal(Ctor: OfflineContextConstructor): Promise<Float32Array> {
  const context = new Ctor(1, FRAMES, SAMPLE_RATE);
  const oscillator = context.createOscillator();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(10000, context.currentTime);

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-50, context.currentTime);
  compressor.knee.setValueAtTime(40, context.currentTime);
  compressor.ratio.setValueAtTime(12, context.currentTime);
  compressor.attack.setValueAtTime(0, context.currentTime);
  compressor.release.setValueAtTime(0.25, context.currentTime);

  oscillator.connect(compressor);
  compressor.connect(context.destination);
  oscillator.start(0);

  const buffer = await renderContext(context);
  return buffer.getChannelData(0).slice();
}

function sumSamples(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += Math.abs(samples[i]);
  }
  return sum;
}

function buildPreview(samples: Float32Array): number[] {
  const preview: number[] = [];
  const start = Math.floor(samples.length * 0.1);
  const span = samples.length - start;
  const step = Math.max(1, Math.floor(span / PREVIEW_POINTS));
  for (let i = 0; i < PREVIEW_POINTS; i++) {
    const index = start + i * step;
    if (index >= samples.length) {
      break;
    }
    preview.push(Number(samples[index].toFixed(6)));
  }
  return preview;
}

function emptyAudioData(): AudioData {
  return {
    supported: false,
    sampleSum: 0,
    hash: '',
    sampleRate: SAMPLE_RATE,
    frames: FRAMES,
    stable: true,
    samplePreview: [],
  };
}

export async function probeAudio(): Promise<AudioData> {
  const Ctor = resolveConstructor();
  if (!Ctor) {
    return emptyAudioData();
  }
  try {
    const [first, second] = await Promise.all([renderSignal(Ctor), renderSignal(Ctor)]);
    const sampleSum = sumSamples(first);
    const secondSum = sumSamples(second);
    if (!Number.isFinite(sampleSum) || sampleSum === 0) {
      return emptyAudioData();
    }
    const hash = await sha256Hex(sampleSum.toPrecision(17));
    return {
      supported: true,
      sampleSum,
      hash,
      sampleRate: SAMPLE_RATE,
      frames: FRAMES,
      stable: sampleSum === secondSum,
      samplePreview: buildPreview(first),
    };
  } catch {
    return emptyAudioData();
  }
}
