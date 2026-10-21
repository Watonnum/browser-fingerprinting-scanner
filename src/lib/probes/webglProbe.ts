import type { WebGLData } from '@/types/fingerprint';
import { sha256Hex } from './hash';

type GLContext = WebGLRenderingContext | WebGL2RenderingContext;

type SerializableParam = string | number | boolean | null | number[];

const PARAMETER_NAMES = [
  'MAX_TEXTURE_SIZE',
  'MAX_CUBE_MAP_TEXTURE_SIZE',
  'MAX_RENDERBUFFER_SIZE',
  'MAX_VIEWPORT_DIMS',
  'MAX_VERTEX_ATTRIBS',
  'MAX_VERTEX_UNIFORM_VECTORS',
  'MAX_FRAGMENT_UNIFORM_VECTORS',
  'MAX_VARYING_VECTORS',
  'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
  'MAX_TEXTURE_IMAGE_UNITS',
  'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
  'ALIASED_LINE_WIDTH_RANGE',
  'ALIASED_POINT_SIZE_RANGE',
  'RED_BITS',
  'GREEN_BITS',
  'BLUE_BITS',
  'ALPHA_BITS',
  'DEPTH_BITS',
  'STENCIL_BITS',
  'SUBPIXEL_BITS',
  'SAMPLES',
  'SAMPLE_BUFFERS',
] as const;

const WEBGL2_PARAMETER_NAMES = [
  'MAX_3D_TEXTURE_SIZE',
  'MAX_ARRAY_TEXTURE_LAYERS',
  'MAX_COLOR_ATTACHMENTS',
  'MAX_DRAW_BUFFERS',
  'MAX_SAMPLES',
  'MAX_UNIFORM_BLOCK_SIZE',
  'MAX_VERTEX_UNIFORM_COMPONENTS',
  'MAX_FRAGMENT_UNIFORM_COMPONENTS',
] as const;

function serialize(value: unknown): SerializableParam {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (value instanceof Float32Array || value instanceof Int32Array || value instanceof Uint32Array) {
    return Array.from(value);
  }
  return String(value);
}

function readConstant(gl: GLContext, name: string): number | undefined {
  const candidate = (gl as unknown as Record<string, unknown>)[name];
  return typeof candidate === 'number' ? candidate : undefined;
}

function readParameter(gl: GLContext, name: string): SerializableParam {
  const constant = readConstant(gl, name);
  if (constant === undefined) {
    return null;
  }
  try {
    return serialize(gl.getParameter(constant));
  } catch {
    return null;
  }
}

function readShaderPrecision(gl: GLContext): number[] {
  const shaders = [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER];
  const precisions = [gl.LOW_FLOAT, gl.MEDIUM_FLOAT, gl.HIGH_FLOAT, gl.LOW_INT, gl.MEDIUM_INT, gl.HIGH_INT];
  const values: number[] = [];
  for (const shader of shaders) {
    for (const precision of precisions) {
      const format = gl.getShaderPrecisionFormat(shader, precision);
      if (format) {
        values.push(format.rangeMin, format.rangeMax, format.precision);
      }
    }
  }
  return values;
}

function createContext(): { gl: GLContext; version: 'webgl2' | 'webgl' } | null {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const gl2 = canvas.getContext('webgl2');
  if (gl2) {
    return { gl: gl2, version: 'webgl2' };
  }
  const gl1 = canvas.getContext('webgl') ?? (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
  if (gl1) {
    return { gl: gl1, version: 'webgl' };
  }
  return null;
}

function emptyWebGLData(): WebGLData {
  return {
    supported: false,
    contextVersion: 'none',
    vendor: 'Unavailable',
    renderer: 'Unavailable',
    unmaskedVendor: 'Unavailable',
    unmaskedRenderer: 'Unavailable',
    version: 'Unavailable',
    shadingLanguageVersion: 'Unavailable',
    extensionsCount: 0,
    maxTextureSize: 0,
    maxViewportDims: [],
    maxRenderbufferSize: 0,
    antialias: false,
    parameterHash: '',
  };
}

export async function probeWebGL(): Promise<WebGLData> {
  try {
    const context = createContext();
    if (!context) {
      return emptyWebGLData();
    }
    const { gl, version } = context;

    const vendor = String(gl.getParameter(gl.VENDOR) ?? 'Unknown');
    const renderer = String(gl.getParameter(gl.RENDERER) ?? 'Unknown');
    const glVersion = String(gl.getParameter(gl.VERSION) ?? 'Unknown');
    const shadingLanguageVersion = String(gl.getParameter(gl.SHADING_LANGUAGE_VERSION) ?? 'Unknown');

    let unmaskedVendor = 'Masked';
    let unmaskedRenderer = 'Masked';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      unmaskedVendor = String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) ?? 'Masked');
      unmaskedRenderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? 'Masked');
    }

    const extensions = (gl.getSupportedExtensions() ?? []).slice().sort();
    const parameters: Record<string, SerializableParam> = {};
    PARAMETER_NAMES.forEach((name) => {
      parameters[name] = readParameter(gl, name);
    });
    if (version === 'webgl2') {
      WEBGL2_PARAMETER_NAMES.forEach((name) => {
        parameters[name] = readParameter(gl, name);
      });
    }

    const attributes = gl.getContextAttributes();
    const antialias = Boolean(attributes?.antialias);
    const precision = readShaderPrecision(gl);

    const maxTextureSize = typeof parameters.MAX_TEXTURE_SIZE === 'number' ? parameters.MAX_TEXTURE_SIZE : 0;
    const maxRenderbufferSize =
      typeof parameters.MAX_RENDERBUFFER_SIZE === 'number' ? parameters.MAX_RENDERBUFFER_SIZE : 0;
    const maxViewportDims = Array.isArray(parameters.MAX_VIEWPORT_DIMS) ? parameters.MAX_VIEWPORT_DIMS : [];

    const parameterHash = await sha256Hex(
      JSON.stringify({
        vendor,
        renderer,
        unmaskedVendor,
        unmaskedRenderer,
        glVersion,
        shadingLanguageVersion,
        extensions,
        parameters,
        precision,
        antialias,
      }),
    );

    gl.getExtension('WEBGL_lose_context')?.loseContext();

    return {
      supported: true,
      contextVersion: version,
      vendor,
      renderer,
      unmaskedVendor,
      unmaskedRenderer,
      version: glVersion,
      shadingLanguageVersion,
      extensionsCount: extensions.length,
      maxTextureSize,
      maxViewportDims,
      maxRenderbufferSize,
      antialias,
      parameterHash,
    };
  } catch {
    return emptyWebGLData();
  }
}
