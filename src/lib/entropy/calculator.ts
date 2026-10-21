import type {
  EntropySignal,
  FeatureKey,
  FingerprintPayload,
  ModuleKey,
  ModuleRisk,
  ProfileFeatures,
  Recommendation,
  RecommendationAction,
  RiskAssessmentResult,
  RiskLevel,
  TrackingStatus,
  WeightClass,
} from '@/types/fingerprint';

export const REFERENCE_POPULATION = 5_000_000;
const SMOOTHING_STRENGTH = 40;
const MIN_PROBABILITY = 1e-9;

type Distribution = Record<string, number>;

interface PatternEntry {
  pattern: RegExp;
  probability: number;
}

interface SignalSpec {
  name: string;
  value: string;
  prior: number;
  weight: number;
  referenceEntropy: number;
  feature?: FeatureKey;
}

interface ModuleThresholds {
  high: number;
  standard: number;
}

const MODULE_THRESHOLDS: Record<ModuleKey, ModuleThresholds> = {
  canvas: { high: 7, standard: 3 },
  webgl: { high: 8, standard: 4 },
  audio: { high: 5, standard: 2 },
  fonts: { high: 6, standard: 3 },
  env: { high: 16, standard: 9 },
};

const MODULE_LABELS: Record<ModuleKey, string> = {
  canvas: 'Canvas 2D Rendering',
  webgl: 'WebGL GPU Signature',
  audio: 'AudioContext Signal',
  env: 'System Environment',
  fonts: 'Installed Fonts',
};

const MODULE_WEIGHT_CLASS: Record<ModuleKey, WeightClass> = {
  canvas: 'High',
  webgl: 'High',
  audio: 'High',
  fonts: 'High',
  env: 'Medium',
};

const SCREEN_DISTRIBUTION: Distribution = {
  '1920x1080': 0.22,
  '1366x768': 0.1,
  '1536x864': 0.08,
  '1440x900': 0.05,
  '2560x1440': 0.04,
  '1280x720': 0.03,
  '1600x900': 0.03,
  '1680x1050': 0.02,
  '1280x800': 0.02,
  '3840x2160': 0.02,
  '1512x982': 0.025,
  '1470x956': 0.02,
  '1728x1117': 0.015,
  '2560x1600': 0.01,
  '390x844': 0.03,
  '393x873': 0.02,
  '414x896': 0.02,
  '360x800': 0.03,
  '412x915': 0.025,
  '430x932': 0.015,
};

const AVAIL_OFFSET_DISTRIBUTION: Distribution = {
  '0x40': 0.3,
  '0x48': 0.12,
  '0x0': 0.25,
  '0x25': 0.06,
  '0x33': 0.05,
  '0x38': 0.04,
  '0x30': 0.05,
};

const COLOR_DEPTH_DISTRIBUTION: Distribution = {
  '24': 0.85,
  '30': 0.1,
  '32': 0.03,
};

const PIXEL_RATIO_DISTRIBUTION: Distribution = {
  '1': 0.35,
  '2': 0.3,
  '1.25': 0.1,
  '1.5': 0.08,
  '3': 0.1,
  '2.625': 0.02,
  '1.75': 0.01,
};

const CONCURRENCY_DISTRIBUTION: Distribution = {
  '8': 0.3,
  '4': 0.25,
  '12': 0.1,
  '6': 0.08,
  '2': 0.08,
  '16': 0.07,
  '10': 0.05,
  '20': 0.02,
};

const MEMORY_DISTRIBUTION: Distribution = {
  '8': 0.5,
  '4': 0.18,
  'unavailable': 0.25,
  '2': 0.04,
  '16': 0.02,
};

const TIMEZONE_DISTRIBUTION: Distribution = {
  'America/New_York': 0.07,
  'America/Chicago': 0.04,
  'America/Los_Angeles': 0.05,
  'America/Denver': 0.015,
  'America/Sao_Paulo': 0.03,
  'America/Mexico_City': 0.02,
  'Europe/London': 0.04,
  'Europe/Berlin': 0.03,
  'Europe/Paris': 0.025,
  'Europe/Madrid': 0.015,
  'Europe/Moscow': 0.025,
  'Asia/Kolkata': 0.06,
  'Asia/Calcutta': 0.02,
  'Asia/Shanghai': 0.08,
  'Asia/Tokyo': 0.03,
  'Asia/Jakarta': 0.03,
  'Asia/Bangkok': 0.015,
  'Asia/Ho_Chi_Minh': 0.012,
  'Asia/Manila': 0.015,
  'Asia/Seoul': 0.012,
  'Australia/Sydney': 0.01,
  'UTC': 0.01,
};

const LANGUAGE_DISTRIBUTION: Distribution = {
  'en-US': 0.35,
  'en-GB': 0.04,
  'en': 0.03,
  'zh-CN': 0.1,
  'es-ES': 0.03,
  'es': 0.03,
  'pt-BR': 0.04,
  'de-DE': 0.03,
  'de': 0.015,
  'fr-FR': 0.03,
  'fr': 0.01,
  'ru-RU': 0.03,
  'ru': 0.015,
  'ja-JP': 0.03,
  'ja': 0.01,
  'id-ID': 0.02,
  'th-TH': 0.01,
  'th': 0.008,
  'vi-VN': 0.01,
  'ko-KR': 0.01,
  'hi-IN': 0.01,
  'it-IT': 0.01,
  'tr-TR': 0.01,
};

const PLATFORM_DISTRIBUTION: Distribution = {
  'Win32': 0.68,
  'MacIntel': 0.15,
  'iPhone': 0.05,
  'Linux armv8l': 0.04,
  'Linux aarch64': 0.02,
  'Linux x86_64': 0.03,
  'iPad': 0.01,
};

const TOUCH_DISTRIBUTION: Distribution = {
  '0': 0.7,
  '10': 0.15,
  '5': 0.1,
  '1': 0.02,
};

const RENDERER_PATTERNS: PatternEntry[] = [
  { pattern: /swiftshader|llvmpipe|softpipe|software|microsoft basic/i, probability: 0.004 },
  { pattern: /^apple gpu$/i, probability: 0.14 },
  { pattern: /apple m1/i, probability: 0.035 },
  { pattern: /apple m2/i, probability: 0.025 },
  { pattern: /apple m[3-9]/i, probability: 0.015 },
  { pattern: /intel.*iris/i, probability: 0.04 },
  { pattern: /intel.*(uhd|hd) graphics/i, probability: 0.09 },
  { pattern: /intel/i, probability: 0.02 },
  { pattern: /nvidia.*rtx/i, probability: 0.03 },
  { pattern: /nvidia.*gtx/i, probability: 0.025 },
  { pattern: /nvidia|geforce|quadro/i, probability: 0.01 },
  { pattern: /radeon|amd/i, probability: 0.02 },
  { pattern: /adreno/i, probability: 0.06 },
  { pattern: /mali/i, probability: 0.04 },
  { pattern: /powervr|img/i, probability: 0.005 },
];
const RENDERER_FALLBACK = 0.002;

const VENDOR_DISTRIBUTION: Distribution = {
  'Google Inc. (Intel)': 0.3,
  'Google Inc. (NVIDIA)': 0.12,
  'Google Inc. (AMD)': 0.06,
  'Google Inc. (Apple)': 0.12,
  'Apple Inc.': 0.15,
  'Intel Inc.': 0.04,
  'Qualcomm': 0.06,
  'ARM': 0.04,
  'Mozilla': 0.04,
  'Masked': 0.03,
};

const USER_AGENT_PATTERNS: PatternEntry[] = [
  { pattern: /edg\//i, probability: 0.012 },
  { pattern: /opr\//i, probability: 0.004 },
  { pattern: /samsungbrowser/i, probability: 0.006 },
  { pattern: /firefox\//i, probability: 0.008 },
  { pattern: /chrome\/\d+\.0\.0\.0/i, probability: 0.035 },
  { pattern: /chrome\//i, probability: 0.01 },
  { pattern: /version\/[\d.]+.*safari/i, probability: 0.02 },
];
const USER_AGENT_FALLBACK = 0.001;

export const FONT_PREVALENCE: Record<string, number> = {
  'Arial': 0.97,
  'Calibri': 0.7,
  'Cambria': 0.68,
  'Consolas': 0.68,
  'Courier New': 0.95,
  'Segoe UI': 0.7,
  'Tahoma': 0.8,
  'Verdana': 0.9,
  'Comic Sans MS': 0.78,
  'Lucida Console': 0.7,
  'Helvetica Neue': 0.2,
  'Menlo': 0.16,
  'Monaco': 0.17,
  'Avenir Next': 0.15,
  'Futura': 0.16,
  'Gill Sans': 0.17,
  'Optima': 0.15,
  'Baskerville': 0.2,
  'Apple Chancery': 0.14,
  'DejaVu Sans': 0.06,
  'Ubuntu': 0.025,
  'Liberation Sans': 0.05,
  'Noto Sans': 0.12,
  'Cantarell': 0.02,
  'Droid Sans': 0.03,
};
const FONT_CORRELATION_WEIGHT = 0.55;

const CANVAS_PRIOR = Math.pow(2, -9.5);
const AUDIO_PRIOR = Math.pow(2, -6.2);
const WEBGL_PARAMS_PRIOR = Math.pow(2, -4.5);
const RANDOMIZATION_PRIOR = 0.08;

export function shannonEntropy(probabilities: number[]): number {
  const total = probabilities.reduce((acc, p) => acc + (p > 0 ? p : 0), 0);
  if (total <= 0) {
    return 0;
  }
  return probabilities.reduce((acc, p) => {
    if (p <= 0) {
      return acc;
    }
    const q = p / total;
    return acc - q * Math.log2(q);
  }, 0);
}

export function selfInformation(probability: number): number {
  const clamped = Math.min(1, Math.max(probability, MIN_PROBABILITY));
  return -Math.log2(clamped);
}

export function binaryEntropy(probability: number): number {
  if (probability <= 0 || probability >= 1) {
    return 0;
  }
  return shannonEntropy([probability, 1 - probability]);
}

function withLongTail(probabilities: number[], fallback: number): number[] {
  const known = probabilities.reduce((acc, p) => acc + p, 0);
  const remaining = Math.max(0, 1 - known);
  const buckets = Math.max(0, Math.round(remaining / fallback));
  const tail = buckets > 0 ? new Array<number>(buckets).fill(remaining / buckets) : [];
  return [...probabilities, ...tail];
}

function distributionEntropy(distribution: Distribution, fallback: number): number {
  return shannonEntropy(withLongTail(Object.values(distribution), fallback));
}

function patternEntropy(patterns: PatternEntry[], fallback: number): number {
  return shannonEntropy(withLongTail(patterns.map((entry) => entry.probability), fallback));
}

function lookup(distribution: Distribution, key: string, fallback: number): number {
  return distribution[key] ?? fallback;
}

function lookupPattern(patterns: PatternEntry[], value: string, fallback: number): number {
  const match = patterns.find((entry) => entry.pattern.test(value));
  return match ? match.probability : fallback;
}

function blendProbability(prior: number, matches: number, total: number): number {
  return (matches + SMOOTHING_STRENGTH * prior) / (total + SMOOTHING_STRENGTH);
}

function round(value: number, digits = 2): number {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

function normalizeNumberKey(value: number): string {
  return String(Number(value.toFixed(3)));
}

export function extractFeatures(payload: FingerprintPayload): ProfileFeatures {
  const { env, webgl, canvas, audio, fonts } = payload;
  return {
    canvasHash: canvas.supported ? (canvas.stable ? canvas.hash : 'randomized') : 'blocked',
    webglRenderer: webgl.supported ? webgl.unmaskedRenderer : 'blocked',
    webglParams: webgl.supported ? webgl.parameterHash : 'blocked',
    audioHash: audio.supported ? (audio.stable ? audio.hash : 'randomized') : 'blocked',
    fontsHash: fonts.hash || 'blocked',
    screen: `${env.screenWidth}x${env.screenHeight}`,
    availOffset: `${env.screenWidth - env.availWidth}x${env.screenHeight - env.availHeight}`,
    colorDepth: String(env.colorDepth),
    pixelRatio: normalizeNumberKey(env.pixelRatio),
    concurrency: String(env.hardwareConcurrency),
    memory: env.deviceMemory === null ? 'unavailable' : String(env.deviceMemory),
    timezone: env.timezone,
    languages: env.languages.join(','),
    platform: env.platform,
    touch: String(env.maxTouchPoints),
    userAgent: env.userAgent,
  };
}

class SignalBuilder {
  private readonly counts = new Map<FeatureKey, number>();

  constructor(
    private readonly features: ProfileFeatures,
    private readonly population: ProfileFeatures[],
  ) {}

  private matches(feature: FeatureKey): number {
    const cached = this.counts.get(feature);
    if (cached !== undefined) {
      return cached;
    }
    const target = this.features[feature];
    const count = this.population.reduce((acc, profile) => acc + (profile[feature] === target ? 1 : 0), 0);
    this.counts.set(feature, count);
    return count;
  }

  build(spec: SignalSpec): EntropySignal {
    const probability = spec.feature
      ? blendProbability(spec.prior, this.matches(spec.feature), this.population.length)
      : spec.prior;
    const entropyBits = selfInformation(probability) * spec.weight;
    return {
      name: spec.name,
      value: spec.value,
      probability: Number(probability.toPrecision(4)),
      entropyBits: round(entropyBits),
      referenceEntropyBits: round(spec.referenceEntropy * spec.weight),
      weight: spec.weight,
    };
  }
}

function classify(module: ModuleKey, bits: number): RiskLevel {
  const thresholds = MODULE_THRESHOLDS[module];
  if (bits >= thresholds.high) {
    return 'High Risk';
  }
  if (bits >= thresholds.standard) {
    return 'Standard';
  }
  return 'Safe';
}

function composeModule(module: ModuleKey, signals: EntropySignal[], detail: string, forced?: RiskLevel): ModuleRisk {
  const entropyBits = round(signals.reduce((acc, signal) => acc + signal.entropyBits, 0));
  const referenceEntropyBits = round(signals.reduce((acc, signal) => acc + signal.referenceEntropyBits, 0));
  return {
    module,
    label: MODULE_LABELS[module],
    entropyBits,
    referenceEntropyBits,
    riskLevel: forced ?? classify(module, entropyBits),
    weightClass: MODULE_WEIGHT_CLASS[module],
    detail,
    signals,
  };
}

function randomizationSignal(builder: SignalBuilder, name: string): EntropySignal {
  return builder.build({
    name,
    value: 'Per-read noise detected',
    prior: RANDOMIZATION_PRIOR,
    weight: 0.3,
    referenceEntropy: binaryEntropy(RANDOMIZATION_PRIOR),
  });
}

function assessCanvas(payload: FingerprintPayload, builder: SignalBuilder): ModuleRisk {
  const { canvas } = payload;
  if (!canvas.supported || canvas.dataLength < 100) {
    return composeModule('canvas', [], 'Canvas readback is blocked. No pixel signature could be extracted.', 'Safe');
  }
  if (!canvas.stable) {
    return composeModule(
      'canvas',
      [randomizationSignal(builder, 'Canvas randomization')],
      'Two identical renders produced different pixels. Your browser injects canvas noise, which breaks cross-site linkage.',
      'Safe',
    );
  }
  const signals = [
    builder.build({
      name: 'Pixel hash',
      value: canvas.hash.slice(0, 16),
      prior: CANVAS_PRIOR,
      weight: 1,
      referenceEntropy: 9.5,
      feature: 'canvasHash',
    }),
  ];
  return composeModule(
    'canvas',
    signals,
    'Sub-pixel anti-aliasing, font hinting and GPU compositing produced a stable, reproducible pixel hash.',
  );
}

function assessWebGL(payload: FingerprintPayload, builder: SignalBuilder): ModuleRisk {
  const { webgl } = payload;
  if (!webgl.supported) {
    return composeModule('webgl', [], 'WebGL is disabled or unavailable. GPU details cannot be read.', 'Safe');
  }
  const renderer = webgl.unmaskedRenderer === 'Masked' ? webgl.renderer : webgl.unmaskedRenderer;
  const familyProbability = lookupPattern(RENDERER_PATTERNS, renderer, RENDERER_FALLBACK);
  const hasModelDetail = /\d{3,}|0x[0-9a-f]{4}/i.test(renderer);
  const rendererPrior = hasModelDetail ? familyProbability * 0.3 : familyProbability;
  const vendorPrior = lookup(VENDOR_DISTRIBUTION, webgl.unmaskedVendor, 0.01);
  const extensionsPrior = 1 / 12;

  const signals = [
    builder.build({
      name: 'Unmasked renderer',
      value: renderer,
      prior: rendererPrior,
      weight: 1,
      referenceEntropy: patternEntropy(RENDERER_PATTERNS, RENDERER_FALLBACK),
      feature: 'webglRenderer',
    }),
    builder.build({
      name: 'Unmasked vendor',
      value: webgl.unmaskedVendor,
      prior: vendorPrior,
      weight: 0.2,
      referenceEntropy: distributionEntropy(VENDOR_DISTRIBUTION, 0.01),
    }),
    builder.build({
      name: 'Parameter hash',
      value: webgl.parameterHash.slice(0, 16),
      prior: WEBGL_PARAMS_PRIOR,
      weight: 0.8,
      referenceEntropy: 4.5,
      feature: 'webglParams',
    }),
    builder.build({
      name: 'Extension set size',
      value: `${webgl.extensionsCount} extensions`,
      prior: extensionsPrior,
      weight: 0.4,
      referenceEntropy: selfInformation(extensionsPrior),
    }),
  ];
  const masked = webgl.unmaskedRenderer === 'Masked';
  return composeModule(
    'webgl',
    signals,
    masked
      ? 'Debug renderer info is masked, but capability limits and extensions still form a GPU signature.'
      : 'WEBGL_debug_renderer_info exposes your exact GPU model and driver stack to every site.',
  );
}

function assessAudio(payload: FingerprintPayload, builder: SignalBuilder): ModuleRisk {
  const { audio } = payload;
  if (!audio.supported) {
    return composeModule('audio', [], 'OfflineAudioContext is unavailable. No DSP signature was produced.', 'Safe');
  }
  if (!audio.stable) {
    return composeModule(
      'audio',
      [randomizationSignal(builder, 'Audio randomization')],
      'Repeated renders differ, so your browser is adding noise to audio output.',
      'Safe',
    );
  }
  const signals = [
    builder.build({
      name: 'DSP signature',
      value: audio.sampleSum.toFixed(12),
      prior: AUDIO_PRIOR,
      weight: 0.9,
      referenceEntropy: 6.2,
      feature: 'audioHash',
    }),
  ];
  return composeModule(
    'audio',
    signals,
    'Floating-point differences in the oscillator and compressor pipeline reveal your audio stack and CPU architecture.',
  );
}

function assessFonts(payload: FingerprintPayload, builder: SignalBuilder): ModuleRisk {
  const { fonts } = payload;
  if (fonts.detectedCount === 0) {
    return composeModule(
      'fonts',
      [],
      'No probe fonts were detected. Font enumeration appears to be restricted.',
      'Safe',
    );
  }
  const detectedSet = new Set(fonts.detected);
  const rawBits = fonts.tested.reduce((acc, font) => {
    const prevalence = FONT_PREVALENCE[font] ?? 0.1;
    const probability = detectedSet.has(font) ? prevalence : 1 - prevalence;
    return acc + selfInformation(probability);
  }, 0);
  const referenceBits = fonts.tested.reduce((acc, font) => acc + binaryEntropy(FONT_PREVALENCE[font] ?? 0.1), 0);
  const rare = fonts.detected.filter((font) => (FONT_PREVALENCE[font] ?? 0.1) < 0.1);

  const signals = [
    builder.build({
      name: 'Font combination',
      value: `${fonts.detectedCount}/${fonts.tested.length} detected`,
      prior: Math.pow(2, -rawBits),
      weight: FONT_CORRELATION_WEIGHT,
      referenceEntropy: referenceBits,
      feature: 'fontsHash',
    }),
  ];
  const rareText = rare.length > 0 ? ` Rare fonts present: ${rare.join(', ')}.` : '';
  return composeModule(
    'fonts',
    signals,
    `Your installed font set narrows down OS, locale and installed software.${rareText}`,
  );
}

function assessEnv(payload: FingerprintPayload, features: ProfileFeatures, builder: SignalBuilder): ModuleRisk {
  const { env } = payload;
  const primaryLanguage = env.languages[0] ?? 'unknown';
  const extraLanguages = Math.max(0, env.languages.length - 1);
  const languagePrior = lookup(LANGUAGE_DISTRIBUTION, primaryLanguage, 0.005) * Math.pow(0.45, extraLanguages);

  const signals = [
    builder.build({
      name: 'Screen resolution',
      value: features.screen,
      prior: lookup(SCREEN_DISTRIBUTION, features.screen, 0.004),
      weight: 0.9,
      referenceEntropy: distributionEntropy(SCREEN_DISTRIBUTION, 0.004),
      feature: 'screen',
    }),
    builder.build({
      name: 'Taskbar / dock offset',
      value: features.availOffset,
      prior: lookup(AVAIL_OFFSET_DISTRIBUTION, features.availOffset, 0.02),
      weight: 0.5,
      referenceEntropy: distributionEntropy(AVAIL_OFFSET_DISTRIBUTION, 0.02),
      feature: 'availOffset',
    }),
    builder.build({
      name: 'Color depth',
      value: `${env.colorDepth}-bit`,
      prior: lookup(COLOR_DEPTH_DISTRIBUTION, features.colorDepth, 0.02),
      weight: 0.4,
      referenceEntropy: distributionEntropy(COLOR_DEPTH_DISTRIBUTION, 0.02),
      feature: 'colorDepth',
    }),
    builder.build({
      name: 'Device pixel ratio',
      value: features.pixelRatio,
      prior: lookup(PIXEL_RATIO_DISTRIBUTION, features.pixelRatio, 0.01),
      weight: 0.6,
      referenceEntropy: distributionEntropy(PIXEL_RATIO_DISTRIBUTION, 0.01),
      feature: 'pixelRatio',
    }),
    builder.build({
      name: 'CPU threads',
      value: features.concurrency,
      prior: lookup(CONCURRENCY_DISTRIBUTION, features.concurrency, 0.01),
      weight: 0.7,
      referenceEntropy: distributionEntropy(CONCURRENCY_DISTRIBUTION, 0.01),
      feature: 'concurrency',
    }),
    builder.build({
      name: 'Device memory',
      value: env.deviceMemory === null ? 'Not exposed' : `${env.deviceMemory} GB`,
      prior: lookup(MEMORY_DISTRIBUTION, features.memory, 0.01),
      weight: 0.5,
      referenceEntropy: distributionEntropy(MEMORY_DISTRIBUTION, 0.01),
      feature: 'memory',
    }),
    builder.build({
      name: 'Timezone',
      value: env.timezone,
      prior: lookup(TIMEZONE_DISTRIBUTION, env.timezone, 0.004),
      weight: 0.8,
      referenceEntropy: distributionEntropy(TIMEZONE_DISTRIBUTION, 0.004),
      feature: 'timezone',
    }),
    builder.build({
      name: 'Language list',
      value: features.languages || 'none',
      prior: languagePrior,
      weight: 0.8,
      referenceEntropy: distributionEntropy(LANGUAGE_DISTRIBUTION, 0.005),
      feature: 'languages',
    }),
    builder.build({
      name: 'Platform',
      value: env.platform,
      prior: lookup(PLATFORM_DISTRIBUTION, env.platform, 0.005),
      weight: 0.5,
      referenceEntropy: distributionEntropy(PLATFORM_DISTRIBUTION, 0.005),
      feature: 'platform',
    }),
    builder.build({
      name: 'Touch points',
      value: features.touch,
      prior: lookup(TOUCH_DISTRIBUTION, features.touch, 0.01),
      weight: 0.4,
      referenceEntropy: distributionEntropy(TOUCH_DISTRIBUTION, 0.01),
      feature: 'touch',
    }),
    builder.build({
      name: 'User agent',
      value: env.userAgent,
      prior: lookupPattern(USER_AGENT_PATTERNS, env.userAgent, USER_AGENT_FALLBACK),
      weight: 0.6,
      referenceEntropy: patternEntropy(USER_AGENT_PATTERNS, USER_AGENT_FALLBACK),
      feature: 'userAgent',
    }),
  ];
  return composeModule(
    'env',
    signals,
    'Individually common attributes multiply together into a narrow device profile.',
  );
}

function uniquenessFromBits(bits: number, population: number): number {
  const collisionProbability = Math.pow(2, -bits);
  const unique = Math.exp((population - 1) * Math.log1p(-Math.min(collisionProbability, 0.999999)));
  return Math.min(99.99, round(unique * 100));
}

function overallRisk(uniqueness: number, modules: ModuleRisk[]): RiskLevel {
  const highCount = modules.filter((module) => module.riskLevel === 'High Risk').length;
  if (uniqueness >= 90 || (uniqueness >= 50 && highCount >= 2)) {
    return 'High Risk';
  }
  if (uniqueness >= 50 || highCount >= 1) {
    return 'Standard';
  }
  return 'Safe';
}

const PRIORITY_ORDER: Record<RiskLevel, number> = {
  'High Risk': 0,
  Standard: 1,
  Safe: 2,
};

function buildRecommendations(
  modules: ModuleRisk[],
  payload: FingerprintPayload,
  tracking: TrackingStatus,
  risk: RiskLevel,
): Recommendation[] {
  const byModule = new Map(modules.map((module) => [module.module, module]));
  const recommendations: Recommendation[] = [];
  const level = (key: ModuleKey): RiskLevel => byModule.get(key)?.riskLevel ?? 'Safe';

  if (tracking.recognized) {
    recommendations.push({
      id: 'stateless-tracking',
      module: 'general',
      priority: 'High Risk',
      title: 'You were re-identified without cookies',
      rationale:
        tracking.matchType === 'exact'
          ? `This exact fingerprint has been seen ${tracking.visitCount} times. Clearing cookies, using incognito or switching IPs does not reset it.`
          : 'Your hardware signature matched a previous visit even though some browser attributes changed. Changing timezone, language or VPN alone does not break this link.',
      actions: [
        { label: 'Use a browser that standardises fingerprints across all users', value: 'Tor Browser / Mullvad Browser' },
        { label: 'Enable per-session fingerprint randomisation', browser: 'Brave', value: 'Shields → Block fingerprinting' },
        { label: 'Separate identities with distinct browser profiles on different engines', browser: 'All' },
      ],
    });
  }

  if (level('canvas') !== 'Safe') {
    recommendations.push({
      id: 'canvas-hardening',
      module: 'canvas',
      priority: level('canvas'),
      title: 'Block or randomise Canvas readback',
      rationale: `Your canvas produced a stable hash worth ${byModule.get('canvas')?.entropyBits ?? 0} bits of identifying entropy.`,
      actions: [
        { label: 'Enable built-in fingerprinting resistance', browser: 'Firefox', value: 'privacy.resistFingerprinting = true' },
        { label: 'Install a canvas blocker that spoofs getImageData/toDataURL', browser: 'Firefox', value: 'CanvasBlocker extension' },
        { label: 'Use strict fingerprinting protection', browser: 'Brave', value: 'brave://settings/shields → Strict' },
        { label: 'Enable advanced tracking & fingerprinting protection in all browsing', browser: 'Safari 17+', value: 'Settings → Advanced → Use advanced tracking and fingerprinting protection' },
      ],
    });
  }

  if (level('webgl') !== 'Safe') {
    const exposed = payload.webgl.unmaskedRenderer !== 'Masked';
    recommendations.push({
      id: 'webgl-hardening',
      module: 'webgl',
      priority: level('webgl'),
      title: exposed ? 'Hide your GPU model from WebGL' : 'Reduce WebGL capability exposure',
      rationale: exposed
        ? `Sites can read "${payload.webgl.unmaskedRenderer}" directly via WEBGL_debug_renderer_info.`
        : 'Even with the renderer masked, parameter limits and extensions remain identifying.',
      actions: [
        { label: 'Disable WebGL entirely', browser: 'Firefox', value: 'webgl.disabled = true' },
        { label: 'Stop exposing the unmasked renderer', browser: 'Firefox', value: 'webgl.enable-debug-renderer-info = false' },
        { label: 'Launch with WebGL disabled', browser: 'Chrome / Edge', value: '--disable-webgl --disable-3d-apis' },
        { label: 'Block WebGL per-site with a script blocker', browser: 'All', value: 'NoScript / uBlock Origin (medium mode)' },
      ],
    });
  }

  if (level('audio') !== 'Safe') {
    recommendations.push({
      id: 'audio-hardening',
      module: 'audio',
      priority: level('audio'),
      title: 'Neutralise the AudioContext fingerprint',
      rationale: 'OfflineAudioContext rendered a deterministic DSP signature that identifies your audio stack.',
      actions: [
        { label: 'Enable fingerprinting resistance', browser: 'Firefox', value: 'privacy.resistFingerprinting = true' },
        { label: 'Disable the Web Audio API', browser: 'Firefox', value: 'media.webaudio.enabled = false' },
        { label: 'Use audio farbling', browser: 'Brave', value: 'Shields → Block fingerprinting' },
        { label: 'Add an audio noise extension', browser: 'Chrome', value: 'AudioContext Fingerprint Defender' },
      ],
    });
  }

  if (level('fonts') !== 'Safe') {
    recommendations.push({
      id: 'font-hardening',
      module: 'fonts',
      priority: level('fonts'),
      title: 'Restrict font enumeration',
      rationale: `${payload.fonts.detectedCount} of ${payload.fonts.tested.length} probe fonts are visible to scripts, narrowing your OS and software profile.`,
      actions: [
        { label: 'Limit fonts to the base system set', browser: 'Firefox', value: 'layout.css.font-visibility.level = 1' },
        { label: 'Prevent sites from using local fonts', browser: 'Firefox', value: 'browser.display.use_document_fonts = 0' },
        { label: 'Uninstall rarely used third-party fonts', browser: 'OS' },
        { label: 'Safari already restricts fonts to bundled system fonts', browser: 'Safari' },
      ],
    });
  }

  if (level('env') !== 'Safe') {
    const multiLanguage = payload.env.languages.length > 1;
    const actions: RecommendationAction[] = [
      { label: 'Spoof timezone to UTC and normalise navigator values', browser: 'Firefox', value: 'privacy.resistFingerprinting = true' },
      { label: 'Round window size to common buckets', browser: 'Firefox', value: 'privacy.resistFingerprinting.letterboxing = true' },
      { label: 'Keep browser zoom at 100% to avoid unusual pixel ratios', browser: 'All' },
    ];
    if (multiLanguage) {
      actions.unshift({ label: `Reduce Accept-Language to a single entry (currently ${payload.env.languages.length})`, browser: 'All', value: 'intl.accept_languages = en-US' });
    }
    recommendations.push({
      id: 'env-hardening',
      module: 'env',
      priority: level('env'),
      title: 'Blend in your system environment',
      rationale: 'Screen geometry, hardware concurrency, timezone and language list combine into a narrow cohort.',
      actions,
    });
  }

  if (risk === 'High Risk') {
    recommendations.push({
      id: 'anti-fingerprint-browser',
      module: 'general',
      priority: 'Standard',
      title: 'Switch to an anti-fingerprinting browser for sensitive browsing',
      rationale: 'Blocking individual APIs makes you rarer. Uniform browsers make every user look identical instead.',
      actions: [
        { label: 'Maximum anonymity with uniform fingerprints', value: 'Tor Browser' },
        { label: 'Tor Browser protections without the Tor network', value: 'Mullvad Browser' },
        { label: 'Randomised fingerprints per site and session', value: 'Brave (Strict Shields)' },
      ],
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'maintain-posture',
      module: 'general',
      priority: 'Safe',
      title: 'Your browser blends in well',
      rationale: 'No probe exceeded its risk threshold. Keep protections enabled and avoid installing rare fonts or extensions that alter page rendering.',
      actions: [
        { label: 'Re-scan after browser updates or new extensions' },
        { label: 'Avoid changing defaults that make you stand out', browser: 'All' },
      ],
    });
  }

  return recommendations.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

export function assessRisk(
  payload: FingerprintPayload,
  population: ProfileFeatures[],
  tracking: TrackingStatus,
): RiskAssessmentResult {
  const features = extractFeatures(payload);
  const builder = new SignalBuilder(features, population);
  const modules: ModuleRisk[] = [
    assessCanvas(payload, builder),
    assessWebGL(payload, builder),
    assessAudio(payload, builder),
    assessEnv(payload, features, builder),
    assessFonts(payload, builder),
  ];
  const totalEntropyBits = round(modules.reduce((acc, module) => acc + module.entropyBits, 0));
  const uniquenessScore = uniquenessFromBits(totalEntropyBits, REFERENCE_POPULATION);
  const anonymitySetSize = Math.max(1, Math.round(REFERENCE_POPULATION / Math.pow(2, totalEntropyBits)));
  const riskLevel = overallRisk(uniquenessScore, modules);

  return {
    compositeHash: payload.compositeHash,
    uniquenessScore,
    totalEntropyBits,
    riskLevel,
    anonymitySetSize,
    referencePopulation: REFERENCE_POPULATION,
    modules,
    recommendations: buildRecommendations(modules, payload, tracking, riskLevel),
    tracking,
    collectionTimeMs: payload.collectionTimeMs,
    analyzedAt: new Date().toISOString(),
  };
}
