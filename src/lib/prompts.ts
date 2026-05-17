/**
 * Loads the system prompt (system.md) from bundled assets.
 *
 * The .md asset extension is registered in metro.config.js so require() returns
 * a numeric module ID that expo-asset can resolve to a local URI.
 */
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

type PromptVariant = 'full' | 'slim';

const cached: Partial<Record<PromptVariant, string>> = {};

/**
 * Variants:
 *   - 'full' — the production system prompt with verbatim WHO MCPC §3,
 *             3 few-shot examples (~6,500 tokens). Use on real devices
 *             where NPU offloading keeps weights out of main RAM.
 *   - 'slim' — a 1,000-token version preserving the severity rules,
 *             tool schema, and a single example. Use on memory-constrained
 *             demos (CPU emulators) where the full prompt's prefill forces
 *             too many weight pages resident.
 *
 * On Android, expo-asset's `localUri` for a bundled `.md` is `asset:///...`
 * which `FileSystem.readAsStringAsync` accepts directly.
 */
export async function loadSystemPrompt(variant: PromptVariant = 'full'): Promise<string> {
  if (cached[variant]) return cached[variant]!;
  const mod = variant === 'slim'
    ? require('../assets/prompts/system-slim.md')
    : require('../assets/prompts/system.md');
  const asset = Asset.fromModule(mod);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('System prompt asset failed to materialize');
  const uri = asset.localUri.startsWith('file://') || asset.localUri.startsWith('asset:')
    ? asset.localUri
    : `file://${asset.localUri}`;
  const text = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  cached[variant] = text;
  return text;
}
