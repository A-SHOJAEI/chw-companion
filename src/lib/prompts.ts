/**
 * Loads the system prompt (system.md) from bundled assets.
 *
 * The .md asset extension is registered in metro.config.js so require() returns
 * a numeric module ID that expo-asset can resolve to a local URI.
 */
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

let cached: string | null = null;

export async function loadSystemPrompt(): Promise<string> {
  if (cached) return cached;
  const asset = Asset.fromModule(require('../assets/prompts/system.md'));
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error('System prompt asset failed to materialize');
  const uri = asset.localUri.startsWith('file://')
    ? asset.localUri
    : `file://${asset.localUri}`;
  const text = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  cached = text;
  return text;
}
