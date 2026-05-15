import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { BigButton } from './BigButton';
import { Waveform } from './Waveform';
import { colors, spacing, typography } from '../theme';
import { t } from '../lib/i18n';

interface Props {
  maxSeconds?: number;
  onCaptured: (uri: string, durationSec: number) => void;
}

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: false,
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
  },
  ios: {
    extension: '.wav',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: { mimeType: 'audio/wav', bitsPerSecond: 256000 },
};

export function AudioRecorder({ maxSeconds = 60, onCaptured }: Props) {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })().catch((e) => setError(e instanceof Error ? e.message : String(e)));
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(RECORDING_OPTIONS);
      await rec.startAsync();
      setRecording(rec);
      setElapsed(0);
      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        const s = (Date.now() - startedAt) / 1000;
        setElapsed(s);
        if (s >= maxSeconds) {
          void stop();
        }
      }, 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    // stop is defined below; bind via local ref-style closure
    async function stop() {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      try {
        const r = recording;
        if (!r) return;
        await r.stopAndUnloadAsync();
        const uri = r.getURI();
        if (uri) onCaptured(uri, Math.min(elapsed, maxSeconds));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setRecording(null);
      }
    }
  }, [maxSeconds, onCaptured, recording, elapsed]);

  const stop = useCallback(async () => {
    if (!recording) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) onCaptured(uri, Math.min(elapsed, maxSeconds));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRecording(null);
    }
  }, [recording, elapsed, onCaptured, maxSeconds]);

  const isRecording = !!recording;

  return (
    <View style={styles.wrap}>
      <Waveform active={isRecording} />
      <Text style={styles.timer}>
        {isRecording
          ? `${t('visit.recording')}  ${elapsed.toFixed(1).padStart(4, '0')} / ${maxSeconds}s`
          : t('visit.listenHint')}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ height: spacing.md }} />
      <BigButton
        title={isRecording ? '■' : '●'}
        variant={isRecording ? 'danger' : 'primary'}
        onPress={isRecording ? () => void stop() : () => void start()}
        disabled={permissionGranted === false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'stretch', gap: spacing.sm },
  timer: { ...typography.body, color: colors.deepIndigo, textAlign: 'center' },
  error: { ...typography.caption, color: colors.clinicRed, textAlign: 'center' },
});
