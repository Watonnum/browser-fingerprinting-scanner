export type RiskLevel = 'Safe' | 'Standard' | 'High Risk';

export type ModuleKey = 'canvas' | 'webgl' | 'audio' | 'env' | 'fonts';

export type WeightClass = 'High' | 'Medium' | 'Low';

export interface CanvasData {
  supported: boolean;
  hash: string;
  dataUrl: string;
  preview: string;
  dataLength: number;
  stable: boolean;
  winding: boolean;
  width: number;
  height: number;
}

export interface WebGLData {
  supported: boolean;
  contextVersion: 'webgl2' | 'webgl' | 'none';
  vendor: string;
  renderer: string;
  unmaskedVendor: string;
  unmaskedRenderer: string;
  version: string;
  shadingLanguageVersion: string;
  extensionsCount: number;
  maxTextureSize: number;
  maxViewportDims: number[];
  maxRenderbufferSize: number;
  antialias: boolean;
  parameterHash: string;
}

export interface AudioData {
  supported: boolean;
  sampleSum: number;
  hash: string;
  sampleRate: number;
  frames: number;
  stable: boolean;
  samplePreview: number[];
}

export interface EnvData {
  screenWidth: number;
  screenHeight: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelRatio: number;
  hardwareConcurrency: number;
  deviceMemory: number | null;
  timezone: string;
  timezoneOffset: number;
  languages: string[];
  platform: string;
  userAgent: string;
  maxTouchPoints: number;
  cookieEnabled: boolean;
  doNotTrack: string | null;
}

export interface FontData {
  tested: string[];
  detected: string[];
  detectedCount: number;
  hash: string;
}

export interface FingerprintPayload {
  canvas: CanvasData;
  webgl: WebGLData;
  audio: AudioData;
  env: EnvData;
  fonts: FontData;
  compositeHash: string;
  collectionTimeMs: number;
  collectedAt: string;
}

export interface EntropySignal {
  name: string;
  value: string;
  probability: number;
  entropyBits: number;
  referenceEntropyBits: number;
  weight: number;
}

export interface ModuleRisk {
  module: ModuleKey;
  label: string;
  entropyBits: number;
  referenceEntropyBits: number;
  riskLevel: RiskLevel;
  weightClass: WeightClass;
  detail: string;
  signals: EntropySignal[];
}

export interface RecommendationAction {
  label: string;
  value?: string;
  browser?: string;
}

export interface Recommendation {
  id: string;
  module: ModuleKey | 'general';
  priority: RiskLevel;
  title: string;
  rationale: string;
  actions: RecommendationAction[];
}

export type TrackingMatch = 'exact' | 'hardware' | 'none';

export interface TrackingStatus {
  recognized: boolean;
  matchType: TrackingMatch;
  visitCount: number;
  firstSeen: string | null;
  lastSeen: string | null;
  hardwareHash: string;
  knownProfiles: number;
  persisted: boolean;
}

export type FeatureKey =
  | 'canvasHash'
  | 'webglRenderer'
  | 'webglParams'
  | 'audioHash'
  | 'fontsHash'
  | 'screen'
  | 'availOffset'
  | 'colorDepth'
  | 'pixelRatio'
  | 'concurrency'
  | 'memory'
  | 'timezone'
  | 'languages'
  | 'platform'
  | 'touch'
  | 'userAgent';

export type ProfileFeatures = Record<FeatureKey, string>;

export interface RiskAssessmentResult {
  compositeHash: string;
  uniquenessScore: number;
  totalEntropyBits: number;
  riskLevel: RiskLevel;
  anonymitySetSize: number;
  referencePopulation: number;
  modules: ModuleRisk[];
  recommendations: Recommendation[];
  tracking: TrackingStatus;
  collectionTimeMs: number;
  analyzedAt: string;
}
