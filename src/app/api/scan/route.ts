import { NextResponse } from 'next/server';
import { assessRisk, extractFeatures } from '@/lib/entropy/calculator';
import { computeHardwareHash, registerVisit } from '@/lib/store/visitorStore';
import type { FingerprintPayload } from '@/types/fingerprint';

const HASH_PATTERN = /^[a-f0-9]{64}$/;
const MAX_BODY_BYTES = 256 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasTypes(source: Record<string, unknown>, schema: Record<string, 'string' | 'number' | 'boolean'>): boolean {
  return Object.entries(schema).every(([key, type]) => typeof source[key] === type);
}

function isFingerprintPayload(value: unknown): value is FingerprintPayload {
  if (!isRecord(value)) {
    return false;
  }
  const { canvas, webgl, audio, env, fonts, compositeHash, collectionTimeMs, collectedAt } = value;
  if (typeof compositeHash !== 'string' || !HASH_PATTERN.test(compositeHash)) {
    return false;
  }
  if (typeof collectionTimeMs !== 'number' || typeof collectedAt !== 'string') {
    return false;
  }
  if (!isRecord(canvas) || !hasTypes(canvas, { supported: 'boolean', hash: 'string', dataLength: 'number', stable: 'boolean' })) {
    return false;
  }
  if (
    !isRecord(webgl) ||
    !hasTypes(webgl, {
      supported: 'boolean',
      unmaskedVendor: 'string',
      unmaskedRenderer: 'string',
      renderer: 'string',
      extensionsCount: 'number',
      parameterHash: 'string',
    })
  ) {
    return false;
  }
  if (!isRecord(audio) || !hasTypes(audio, { supported: 'boolean', sampleSum: 'number', hash: 'string', stable: 'boolean' })) {
    return false;
  }
  if (
    !isRecord(env) ||
    !hasTypes(env, {
      screenWidth: 'number',
      screenHeight: 'number',
      availWidth: 'number',
      availHeight: 'number',
      colorDepth: 'number',
      pixelRatio: 'number',
      hardwareConcurrency: 'number',
      timezone: 'string',
      platform: 'string',
      userAgent: 'string',
      maxTouchPoints: 'number',
    }) ||
    !Array.isArray(env.languages) ||
    !env.languages.every((language) => typeof language === 'string') ||
    !(env.deviceMemory === null || typeof env.deviceMemory === 'number')
  ) {
    return false;
  }
  if (
    !isRecord(fonts) ||
    !Array.isArray(fonts.tested) ||
    !Array.isArray(fonts.detected) ||
    !hasTypes(fonts, { detectedCount: 'number', hash: 'string' })
  ) {
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (!isFingerprintPayload(body)) {
    return NextResponse.json({ error: 'Malformed fingerprint payload' }, { status: 422 });
  }

  try {
    const features = extractFeatures(body);
    const hardwareHash = computeHardwareHash(features);
    const { tracking, population } = await registerVisit(body.compositeHash, hardwareHash, features);
    const result = assessRisk(body, population, tracking);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown analysis failure';
    return NextResponse.json({ error: `Risk analysis failed: ${message}` }, { status: 500 });
  }
}
