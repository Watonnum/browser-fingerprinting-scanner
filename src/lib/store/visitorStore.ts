import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import type { ProfileFeatures, TrackingMatch, TrackingStatus } from '@/types/fingerprint';

interface VisitorRecord {
  compositeHash: string;
  hardwareHash: string;
  features: ProfileFeatures;
  firstSeen: string;
  lastSeen: string;
  visits: number;
}

interface StoreFile {
  version: 1;
  records: VisitorRecord[];
}

interface StoreState {
  loaded: boolean;
  persisted: boolean;
  records: VisitorRecord[];
  queue: Promise<unknown>;
}

export interface VisitRegistration {
  tracking: TrackingStatus;
  population: ProfileFeatures[];
}

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'visitors.json');
const MAX_RECORDS = 5000;

const globalScope = globalThis as typeof globalThis & { __fingerprintStore?: StoreState };

function getState(): StoreState {
  if (!globalScope.__fingerprintStore) {
    globalScope.__fingerprintStore = {
      loaded: false,
      persisted: true,
      records: [],
      queue: Promise.resolve(),
    };
  }
  return globalScope.__fingerprintStore;
}

function isVisitorRecord(value: unknown): value is VisitorRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Partial<VisitorRecord>;
  return (
    typeof record.compositeHash === 'string' &&
    typeof record.hardwareHash === 'string' &&
    typeof record.features === 'object' &&
    record.features !== null &&
    typeof record.firstSeen === 'string' &&
    typeof record.lastSeen === 'string' &&
    typeof record.visits === 'number'
  );
}

async function ensureLoaded(state: StoreState): Promise<void> {
  if (state.loaded) {
    return;
  }
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreFile>;
    state.records = Array.isArray(parsed.records) ? parsed.records.filter(isVisitorRecord) : [];
  } catch {
    state.records = [];
  }
  state.loaded = true;
}

async function persist(state: StoreState): Promise<void> {
  try {
    await fs.mkdir(STORE_DIR, { recursive: true });
    const body: StoreFile = { version: 1, records: state.records };
    const tempFile = `${STORE_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(body), 'utf8');
    await fs.rename(tempFile, STORE_FILE);
    state.persisted = true;
  } catch {
    state.persisted = false;
  }
}

export function computeHardwareHash(features: ProfileFeatures): string {
  const hardware = [
    features.canvasHash,
    features.webglRenderer,
    features.webglParams,
    features.audioHash,
    features.screen,
    features.colorDepth,
    features.pixelRatio,
    features.concurrency,
    features.memory,
    features.platform,
    features.touch,
  ];
  return createHash('sha256').update(JSON.stringify(hardware)).digest('hex');
}

function runExclusive<T>(state: StoreState, task: () => Promise<T>): Promise<T> {
  const next = state.queue.then(task, task);
  state.queue = next.catch(() => undefined);
  return next;
}

export function registerVisit(
  compositeHash: string,
  hardwareHash: string,
  features: ProfileFeatures,
): Promise<VisitRegistration> {
  const state = getState();
  return runExclusive(state, async () => {
    await ensureLoaded(state);
    const now = new Date().toISOString();

    const population = state.records
      .filter((record) => record.compositeHash !== compositeHash)
      .map((record) => record.features);

    const exact = state.records.find((record) => record.compositeHash === compositeHash);
    const hardwareMatches = state.records.filter(
      (record) => record.hardwareHash === hardwareHash && record.compositeHash !== compositeHash,
    );

    let matchType: TrackingMatch = 'none';
    let visitCount = 1;
    let firstSeen: string | null = null;
    let lastSeen: string | null = null;

    if (exact) {
      matchType = 'exact';
      firstSeen = exact.firstSeen;
      lastSeen = exact.lastSeen;
      exact.visits += 1;
      exact.lastSeen = now;
      exact.hardwareHash = hardwareHash;
      exact.features = features;
      visitCount = exact.visits + hardwareMatches.reduce((acc, record) => acc + record.visits, 0);
    } else {
      if (hardwareMatches.length > 0) {
        matchType = 'hardware';
        firstSeen = hardwareMatches.reduce(
          (earliest, record) => (record.firstSeen < earliest ? record.firstSeen : earliest),
          hardwareMatches[0].firstSeen,
        );
        lastSeen = hardwareMatches.reduce(
          (latest, record) => (record.lastSeen > latest ? record.lastSeen : latest),
          hardwareMatches[0].lastSeen,
        );
        visitCount = 1 + hardwareMatches.reduce((acc, record) => acc + record.visits, 0);
      }
      state.records.push({
        compositeHash,
        hardwareHash,
        features,
        firstSeen: now,
        lastSeen: now,
        visits: 1,
      });
      if (state.records.length > MAX_RECORDS) {
        state.records.sort((a, b) => (a.lastSeen < b.lastSeen ? 1 : -1));
        state.records.length = MAX_RECORDS;
      }
    }

    await persist(state);

    const tracking: TrackingStatus = {
      recognized: matchType !== 'none',
      matchType,
      visitCount,
      firstSeen,
      lastSeen,
      hardwareHash,
      knownProfiles: state.records.length,
      persisted: state.persisted,
    };

    return { tracking, population };
  });
}
