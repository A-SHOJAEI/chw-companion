/**
 * Gemma4Engine — singleton wrapper around cactus-react-native's CactusLM.
 *
 * Responsibilities:
 *  - Load gemma-4-E4B-it weights once; reuse for the life of the app
 *  - Decode bundled WAV → PCM bytes for the audio modality
 *  - Resolve bundled image asset URIs to filesystem paths
 *  - Run a single multimodal forward pass that returns tool calls
 *
 * Loading strategy:
 *  - First, look for a sideloaded absolute path at MODEL_LOCAL_PATH (set by
 *    a packaged installer / adb push for demo builds). If present, use it —
 *    CactusLM.download() is a no-op for absolute paths (see CactusLM.ts L70
 *    in cactus-react-native: isModelPath returns true for paths starting
 *    with `/`).
 *  - Otherwise fall back to the registry slug — the user's first launch
 *    will trigger CactusLM.download() which pulls from HF.
 *
 * IMPORTANT: never throw from infer() — callers depend on getting a result
 * object even when the model errors.
 */
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import {
  CactusLM,
  type CactusLMCompleteResult,
  type CactusLMMessage,
  type CactusLMTool,
} from 'cactus-react-native';
import { emit } from './events';

export interface ModelLoadConfig {
  /** Absolute path to a directory of `.weights` files (sideload). */
  localModelPath?: string;
  /** HF registry slug (e.g. 'gemma-4-e4b-it'). Used when localModelPath is unset. */
  registrySlug?: string;
  /** Quantization choice. */
  quantization?: 'int4' | 'int8';
  onDownloadProgress?: (fraction: number) => void;
}

export interface InferInput {
  /** System prompt — large, loaded once and cached client-side. */
  systemPrompt: string;
  /** User text utterance (e.g. transcript hint, or empty if audio-only). */
  userText: string;
  /** Absolute filesystem paths to image files (JPEG/PNG). */
  imagePaths: string[];
  /** Raw PCM bytes from a WAV (full file with header — Cactus parses it). */
  audioBytes: number[] | null;
  /** Tool schemas. */
  tools: CactusLMTool[];
  /** Inference options (passed through to CactusLM). */
  maxTokens?: number;
  temperature?: number;
}

export interface InferOk {
  ok: true;
  raw: CactusLMCompleteResult;
  toolCalls: Array<{ name: string; arguments: Record<string, unknown> }>;
  wallSeconds: number;
}

export interface InferErr {
  ok: false;
  error: string;
  raw: Partial<CactusLMCompleteResult> | null;
  wallSeconds: number;
}

export type InferResult = InferOk | InferErr;

class Gemma4EngineImpl {
  private lm: CactusLM | null = null;
  private loaded = false;
  private loading: Promise<void> | null = null;
  private loadStart = 0;

  isReady(): boolean {
    return this.loaded;
  }

  async init(config: ModelLoadConfig = {}): Promise<void> {
    if (this.loaded) return;
    if (this.loading) {
      await this.loading;
      return;
    }
    this.loadStart = Date.now();
    this.loading = (async () => {
      const modelRef = config.localModelPath ?? config.registrySlug ?? 'gemma-4-e4b-it';
      const lm = new CactusLM({
        model: modelRef,
        options: {
          quantization: config.quantization ?? 'int4',
        },
      });

      // For absolute paths, download() short-circuits (returns 1.0 immediately).
      // For registry slugs, it actually fetches.
      await lm.download({ onProgress: (p: number) => config.onDownloadProgress?.(p) });
      await lm.init();

      this.lm = lm;
      this.loaded = true;
      emit('model:ready', { totalLoadMs: Date.now() - this.loadStart });
    })();
    try {
      await this.loading;
    } catch (e) {
      this.loading = null;
      const message = e instanceof Error ? e.message : String(e);
      emit('model:error', { message });
      throw e;
    }
    this.loading = null;
  }

  async infer(input: InferInput): Promise<InferResult> {
    const t0 = Date.now();
    if (!this.lm || !this.loaded) {
      return {
        ok: false,
        error: 'Engine not initialized. Call init() first.',
        raw: null,
        wallSeconds: 0,
      };
    }
    try {
      const messages: CactusLMMessage[] = [
        { role: 'system', content: input.systemPrompt },
        {
          role: 'user',
          content: input.userText,
          images: input.imagePaths.length ? input.imagePaths : undefined,
        },
      ];
      const result = await this.lm.complete({
        messages,
        tools: input.tools,
        audio: input.audioBytes ?? undefined,
        options: {
          maxTokens: input.maxTokens ?? 512,
          temperature: input.temperature ?? 0.0,
          forceTools: true,
        },
      });
      return {
        ok: true,
        raw: result,
        toolCalls: result.functionCalls ?? [],
        wallSeconds: (Date.now() - t0) / 1000,
      };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        raw: null,
        wallSeconds: (Date.now() - t0) / 1000,
      };
    }
  }

  async dispose(): Promise<void> {
    // CactusLM doesn't expose an explicit dispose in 1.13.x — set null to free
    // our reference and let the native side reclaim when GC fires.
    this.lm = null;
    this.loaded = false;
  }
}

export const Gemma4Engine = new Gemma4EngineImpl();

// -----------------------------------------------------------------------------
// Asset helpers — bundle a WAV/JPEG via require() and surface what infer() needs
// -----------------------------------------------------------------------------

/**
 * In Metro-dev mode, expo-asset materializes a require()'d asset to a
 * `file://` URI under cacheDirectory. In a release/embedded-bundle build the
 * `localUri` can be `asset://...` (Android resource) which the Cactus native
 * lib cannot mmap — it needs a real filesystem path. So when the URI isn't
 * already `file://`, we copy the asset into cacheDirectory and hand that path
 * back instead.
 */
async function ensureFilesystemPath(asset: Asset, suggestedExt: string): Promise<string> {
  if (!asset.localUri) throw new Error('Asset materialization failed (no localUri)');
  if (asset.localUri.startsWith('file://')) return asset.localUri.slice('file://'.length);

  const ext = (asset.type || suggestedExt).replace(/^\./, '');
  const hash = asset.hash ?? `mod${asset.name}`;
  const dest = `${FileSystem.cacheDirectory}cactus-asset-${hash}.${ext}`;
  const info = await FileSystem.getInfoAsync(dest).catch(() => ({ exists: false }));
  if (!info.exists) {
    await FileSystem.copyAsync({ from: asset.localUri, to: dest });
  }
  return dest.startsWith('file://') ? dest.slice('file://'.length) : dest;
}

/** Resolve a require()'d image asset to an absolute filesystem path. */
export async function materializeImage(mod: number): Promise<string> {
  const asset = Asset.fromModule(mod);
  await asset.downloadAsync();
  return ensureFilesystemPath(asset, 'jpg');
}

/** Resolve a require()'d WAV asset and read it as a JS number[] of bytes. */
export async function materializeWavBytes(mod: number): Promise<number[]> {
  const path = await materializeWav(mod);
  return readBytes(path);
}

/** Resolve a require()'d WAV asset to a real filesystem path. */
export async function materializeWav(mod: number): Promise<string> {
  const asset = Asset.fromModule(mod);
  await asset.downloadAsync();
  return ensureFilesystemPath(asset, 'wav');
}

/** Read a file (any URI) as a number[] of bytes — used for live recordings too. */
export async function readBytes(uriOrPath: string): Promise<number[]> {
  const uri = uriOrPath.startsWith('file://') ? uriOrPath : `file://${uriOrPath}`;
  const b64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bin = globalThis.atob(b64);
  const out = new Array<number>(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
