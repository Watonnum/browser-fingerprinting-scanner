import type { FingerprintPayload, ModuleKey } from '@/types/fingerprint';
import { probeAudio } from './audioProbe';
import { probeCanvas } from './canvasProbe';
import { probeEnv } from './envProbe';
import { probeFonts } from './fontProbe';
import { sha256Hex } from './hash';
import { probeWebGL } from './webglProbe';

export interface CollectOptions {
  onProbeComplete?: (module: ModuleKey, elapsedMs: number) => void;
}

function track<T>(module: ModuleKey, start: number, task: Promise<T>, options: CollectOptions): Promise<T> {
  return task.then((value) => {
    options.onProbeComplete?.(module, performance.now() - start);
    return value;
  });
}

export async function collectFingerprint(options: CollectOptions = {}): Promise<FingerprintPayload> {
  const start = performance.now();

  const [canvas, webgl, audio, env, fonts] = await Promise.all([
    track('canvas', start, probeCanvas(), options),
    track('webgl', start, probeWebGL(), options),
    track('audio', start, probeAudio(), options),
    track('env', start, probeEnv(), options),
    track('fonts', start, probeFonts(), options),
  ]);

  const compositeHash = await sha256Hex(
    JSON.stringify({
      canvas: canvas.stable ? canvas.hash : 'randomized',
      webgl: webgl.parameterHash,
      audio: audio.stable ? audio.hash : 'randomized',
      fonts: fonts.hash,
      env: {
        screen: [env.screenWidth, env.screenHeight, env.availWidth, env.availHeight],
        colorDepth: env.colorDepth,
        pixelRatio: env.pixelRatio,
        hardwareConcurrency: env.hardwareConcurrency,
        deviceMemory: env.deviceMemory,
        timezone: env.timezone,
        languages: env.languages,
        platform: env.platform,
        userAgent: env.userAgent,
        maxTouchPoints: env.maxTouchPoints,
      },
    }),
  );

  const collectionTimeMs = Math.round((performance.now() - start) * 100) / 100;

  return {
    canvas,
    webgl,
    audio,
    env,
    fonts,
    compositeHash,
    collectionTimeMs,
    collectedAt: new Date().toISOString(),
  };
}

export { sha256Hex } from './hash';
