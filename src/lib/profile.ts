/**
 * The CHW's local profile. Stored in expo-secure-store so it survives
 * uninstalls iff the keystore is preserved (it usually isn't on Android, but
 * that's fine — onboarding will re-run).
 *
 * Profile fields are intentionally minimal:
 *   - name: shown in the greeting ("Sannu, Aisha")
 *   - onboardedAt: ISO timestamp; presence is the "have we onboarded" flag
 *   - language: 'ha' | 'en' — the language the CHW picked at onboarding
 */
import * as SecureStore from 'expo-secure-store';
import type { Language } from './i18n';

const KEY = 'chw.profile.v1';

export interface ChwProfile {
  name: string;
  onboardedAt: string;
  language: Language;
}

let cached: ChwProfile | null | undefined; // undefined = not loaded; null = no profile

export async function loadProfile(): Promise<ChwProfile | null> {
  if (cached !== undefined) return cached;
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) {
    cached = null;
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as ChwProfile;
    cached = parsed;
    return parsed;
  } catch {
    cached = null;
    return null;
  }
}

export async function saveProfile(profile: ChwProfile): Promise<void> {
  cached = profile;
  await SecureStore.setItemAsync(KEY, JSON.stringify(profile), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearProfile(): Promise<void> {
  cached = null;
  await SecureStore.deleteItemAsync(KEY);
}

export function getCachedProfile(): ChwProfile | null | undefined {
  return cached;
}
