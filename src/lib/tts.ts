import * as Speech from 'expo-speech';

/**
 * Speak an action recommendation back to the CHW. We pick the voice by
 * heuristic — Hausa device locales are rare; on most phones a Hausa string
 * will be read by the default voice with a noticeable accent. That's fine for
 * decision support; future work is to bundle a real Hausa TTS engine.
 */
export async function speak(text: string, lang: 'ha' | 'en' = 'en'): Promise<void> {
  // Hausa locale is "ha-NG"; many TTS engines don't ship it. Fall back to en-NG
  // (Nigerian English) which most Android TTS bundles include.
  const language = lang === 'ha' ? 'ha-NG' : 'en-NG';
  return new Promise((resolve) => {
    Speech.speak(text, {
      language,
      pitch: 1.0,
      rate: 0.9,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}
