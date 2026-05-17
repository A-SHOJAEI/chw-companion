import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { AudioRecorder } from '../components/AudioRecorder';
import { PhotoCapture } from '../components/PhotoCapture';
import { colors, radii, spacing, typography } from '../theme';
import { t } from '../lib/i18n';
import { Gemma4Engine, materializeImage, materializeWav, materializeWavBytes, readBytes } from '../lib/cactus';
import { loadSystemPrompt } from '../lib/prompts';
import { pickToolSet, recordToolDecodeOutcome, startVisitAndApply } from '../lib/tools';
import { useVisitMachine, canProceedToReason } from '../lib/visit-state';

interface Props {
  onResult: (visitId: string, wallMs: number) => void;
  onCancel: () => void;
  useSampleData?: boolean;
}

export function VisitScreen({ onResult, onCancel, useSampleData = false }: Props) {
  const [state, dispatch] = useVisitMachine();
  const [busy, setBusy] = useState(false);
  const [statusLine, setStatusLine] = useState<string>(t('status.idle'));

  // Pre-load sample data into the state machine when "Try sample visit" is used.
  useEffect(() => {
    if (!useSampleData) return;
    void prepareSample();
    async function prepareSample(): Promise<void> {
      try {
        // Use materializeWav for the audio path so the helper copies the
        // bundled asset into cacheDirectory before we read it.
        const audioUri = await materializeWav(require('../assets/sample-data/sample_audio.wav'));
        const sampleImage = await materializeImage(require('../assets/sample-data/sample_ankle.jpg'));
        dispatch({ type: 'AUDIO_CAPTURED', uri: audioUri, seconds: 5 });
        dispatch({ type: 'PHOTO_CAPTURED', slot: 'face', uri: sampleImage });
        dispatch({ type: 'PHOTO_CAPTURED', slot: 'ankle', uri: sampleImage });
        dispatch({ type: 'PHOTO_CAPTURED', slot: 'dipstick', uri: sampleImage });
      } catch (e) {
        dispatch({
          type: 'INFERENCE_ERROR',
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }, [useSampleData, dispatch]);

  // Auto-advance from `see` → `reason` once all photos + audio are captured.
  // Without this, Step 3's Reason button never appears.
  useEffect(() => {
    if (state.step === 'see' && canProceedToReason(state)) {
      dispatch({ type: 'PROCEED_TO_REASON' });
    }
  }, [state, dispatch]);

  const runInference = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setStatusLine(t('status.thinking'));
    const t0 = Date.now();
    try {
      // Sample-visit mode uses the slim system prompt to stay within emulator
      // memory; live visits on real devices use the full WHO-grounded prompt.
      const systemPrompt = await loadSystemPrompt(useSampleData ? 'slim' : 'full');
      let audioBytes: number[];
      if (useSampleData) {
        audioBytes = await materializeWavBytes(require('../assets/sample-data/sample_audio.wav'));
      } else {
        if (!state.audioUri) throw new Error('No audio captured');
        audioBytes = await readBytes(state.audioUri);
      }
      const imagePaths = [state.photos.face, state.photos.ankle, state.photos.dipstick].filter(
        (p): p is string => !!p
      );

      const { tools, minimal } = pickToolSet();
      const result = await Gemma4Engine.infer({
        systemPrompt: minimal
          ? systemPrompt + '\n\n[Constrained mode active — only `record_vitals` and `recommend_action` are available. Skip flag_danger_sign and schedule_followup.]'
          : systemPrompt,
        userText: '',
        imagePaths,
        audioBytes,
        tools,
        maxTokens: 768,
        temperature: 0.0,
      });

      if (!result.ok) {
        recordToolDecodeOutcome(false);
        dispatch({ type: 'INFERENCE_ERROR', message: result.error });
        return;
      }
      // We treat "got at least one valid tool call" as a decode success.
      recordToolDecodeOutcome(result.toolCalls.length > 0);

      const { visit } = await startVisitAndApply({
        patient_name_hint: 'Pending',
        rawCalls: result.toolCalls,
        audioSeconds: state.audioSeconds,
        imageCount: imagePaths.length,
        rawJson: JSON.stringify(result.raw),
      });

      const wallMs = Date.now() - t0;
      dispatch({ type: 'INFERENCE_DONE', visitId: visit.id, ms: wallMs });
      onResult(visit.id, wallMs);
    } catch (e) {
      dispatch({
        type: 'INFERENCE_ERROR',
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setBusy(false);
      setStatusLine(t('status.idle'));
    }
  }, [busy, useSampleData, state, dispatch, onResult]);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.heading}>Ziyara</Text>

      <Step
        index={1}
        title={t('visit.step1Title')}
        done={!!state.audioUri}
        active={state.step === 'listen'}
      >
        {state.step === 'listen' && !state.audioUri && !useSampleData ? (
          <AudioRecorder
            onCaptured={(uri, sec) => dispatch({ type: 'AUDIO_CAPTURED', uri, seconds: sec })}
          />
        ) : state.audioUri ? (
          <Text style={styles.recap}>
            {t('visit.recordingDone')} · {state.audioSeconds.toFixed(1)}s
          </Text>
        ) : null}
      </Step>

      <Step
        index={2}
        title={t('visit.step2Title')}
        done={
          !!state.photos.face && !!state.photos.ankle && !!state.photos.dipstick
        }
        active={state.step === 'see'}
      >
        <View style={styles.photoRow}>
          <PhotoCapture
            label={t('visit.photoFace')}
            uri={state.photos.face}
            onCaptured={(uri) => dispatch({ type: 'PHOTO_CAPTURED', slot: 'face', uri })}
            onCleared={() => dispatch({ type: 'PHOTO_REMOVED', slot: 'face' })}
          />
          <PhotoCapture
            label={t('visit.photoAnkle')}
            uri={state.photos.ankle}
            onCaptured={(uri) => dispatch({ type: 'PHOTO_CAPTURED', slot: 'ankle', uri })}
            onCleared={() => dispatch({ type: 'PHOTO_REMOVED', slot: 'ankle' })}
          />
          <PhotoCapture
            label={t('visit.photoDipstick')}
            uri={state.photos.dipstick}
            onCaptured={(uri) =>
              dispatch({ type: 'PHOTO_CAPTURED', slot: 'dipstick', uri })
            }
            onCleared={() => dispatch({ type: 'PHOTO_REMOVED', slot: 'dipstick' })}
          />
        </View>
      </Step>

      <Step
        index={3}
        title={t('visit.step3Title')}
        done={state.step === 'result'}
        active={state.step === 'reason'}
      >
        {busy ? (
          <View style={styles.thinkingRow}>
            <ActivityIndicator color={colors.terracotta} />
            <Text style={styles.thinkingText}>{statusLine}</Text>
          </View>
        ) : (
          <BigButton
            title={t('visit.thinking')}
            onPress={() => void runInference()}
            disabled={!canProceedToReason(state)}
            variant="primary"
          />
        )}
      </Step>

      {state.error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>{t('error.title')}</Text>
          <Text style={styles.errorBody}>{state.error}</Text>
        </View>
      ) : null}

      <BigButton title={t('error.tryAgain')} variant="secondary" onPress={onCancel} />
    </ScrollView>
  );
}

function Step({
  index,
  title,
  done,
  active,
  children,
}: {
  index: number;
  title: string;
  done: boolean;
  active: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={[stepStyles.card, active && stepStyles.cardActive, done && stepStyles.cardDone]}>
      <View style={stepStyles.headerRow}>
        <View style={[stepStyles.dot, done && stepStyles.dotDone, active && stepStyles.dotActive]}>
          <Text style={stepStyles.dotText}>{done ? '✓' : index}</Text>
        </View>
        <Text style={stepStyles.title}>{title}</Text>
      </View>
      {(active || done) && children ? <View style={stepStyles.body}>{children}</View> : null}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.divider,
    marginBottom: spacing.md,
  },
  cardActive: { borderColor: colors.terracotta },
  cardDone: { borderColor: colors.okraGreen },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { backgroundColor: colors.terracotta },
  dotDone: { backgroundColor: colors.okraGreen },
  dotText: { ...typography.label, color: colors.invertedText },
  title: { ...typography.heading, color: colors.deepIndigo, flex: 1 },
  body: { marginTop: spacing.lg, gap: spacing.md },
});

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, paddingTop: spacing.xxxl, backgroundColor: colors.bone, flexGrow: 1 },
  heading: { ...typography.display, color: colors.deepIndigo, marginBottom: spacing.lg },
  photoRow: { flexDirection: 'row', gap: spacing.sm },
  recap: { ...typography.body, color: colors.okraGreen },
  thinkingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  thinkingText: { ...typography.bodyLg, color: colors.deepIndigo },
  errorBox: {
    backgroundColor: '#FAE0E0',
    borderRadius: radii.md,
    padding: spacing.lg,
    marginVertical: spacing.md,
  },
  errorTitle: { ...typography.label, color: colors.clinicRed, marginBottom: spacing.xs },
  errorBody: { ...typography.body, color: colors.deepIndigo },
});
