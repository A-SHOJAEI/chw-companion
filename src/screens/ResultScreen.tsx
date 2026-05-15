import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { StatusBanner } from '../components/StatusBanner';
import { TriageCard } from '../components/TriageCard';
import { colors, spacing, typography } from '../theme';
import { t, getLanguage } from '../lib/i18n';
import { speak, stopSpeaking } from '../lib/tts';
import { getVisit, listDangerSigns, type DangerSignRow, type VisitRow } from '../lib/db';
import { generateAndSharePdf } from '../lib/triage-pdf';

interface Props {
  visitId: string;
  wallMs: number;
  onDone: () => void;
}

export function ResultScreen({ visitId, wallMs, onDone }: Props) {
  const [visit, setVisit] = useState<VisitRow | null>(null);
  const [signs, setSigns] = useState<DangerSignRow[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const v = await getVisit(visitId);
      const s = await listDangerSigns(visitId);
      setVisit(v);
      setSigns(s);
    })();
    return () => stopSpeaking();
  }, [visitId]);

  if (!visit) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={typography.body}>…</Text>
      </View>
    );
  }

  const severity = visit.severity ?? 'clear';
  const caption =
    severity === 'urgent'
      ? signs.find((s) => s.severity === 'urgent')?.sign ?? ''
      : '';

  const handleSpeak = async () => {
    if (!visit.recommended_action) return;
    setSpeaking(true);
    try {
      await speak(visit.recommended_action, getLanguage());
    } finally {
      setSpeaking(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    setPrintError(null);
    const r = await generateAndSharePdf(visit.id);
    setPrinting(false);
    if (!r.ok) setPrintError(r.error ?? 'Could not generate form');
  };

  return (
    <View style={styles.wrap}>
      <StatusBanner severity={severity} caption={caption} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <TriageCard visit={visit} dangerSigns={signs} />

        <View style={styles.metaRow}>
          <Text style={styles.meta}>Inference {(wallMs / 1000).toFixed(1)}s</Text>
          {visit.recommended_timeframe_hours != null && visit.recommended_facility ? (
            <Text style={styles.meta}>
              → {visit.recommended_facility} · {visit.recommended_timeframe_hours}h
            </Text>
          ) : null}
        </View>

        {printError ? <Text style={styles.printError}>{printError}</Text> : null}

        <View style={styles.actions}>
          <BigButton
            title={speaking ? '…' : t('result.speakAloud')}
            variant="secondary"
            onPress={() => void handleSpeak()}
            disabled={!visit.recommended_action}
          />
          <BigButton
            title={printing ? '…' : t('result.printForm')}
            variant="secondary"
            onPress={() => void handlePrint()}
            disabled={printing}
          />
          <BigButton
            title={t('result.done')}
            variant={severity === 'urgent' ? 'danger' : 'success'}
            onPress={onDone}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bone },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bone },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { ...typography.caption, color: colors.slate },
  actions: { gap: spacing.md, marginTop: spacing.lg },
  printError: { ...typography.caption, color: colors.clinicRed, marginTop: spacing.xs },
});
