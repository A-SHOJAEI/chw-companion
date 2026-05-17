import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { StatusBanner } from '../components/StatusBanner';
import { TriageCard } from '../components/TriageCard';
import { CaretIcon, InfoIcon } from '../components/Icons';
import { colors, radii, spacing, typography } from '../theme';
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
  const [showWhy, setShowWhy] = useState(false);

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

  const wallSec = wallMs > 0 ? (wallMs / 1000).toFixed(1) : null;
  const protocolIds = Array.from(
    new Set(signs.map((s) => s.protocol_id).filter(Boolean))
  );

  return (
    <View style={styles.wrap}>
      <StatusBanner severity={severity} caption={caption} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <TriageCard visit={visit} dangerSigns={signs} />

        {signs.length > 0 || protocolIds.length > 0 ? (
          <Pressable
            onPress={() => setShowWhy((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={t('result.whyTitle')}
            style={({ pressed }) => [styles.whyHeader, pressed && { opacity: 0.85 }]}
          >
            <InfoIcon size={18} color={colors.deepIndigo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.whyTitle}>{t('result.whyTitle')}</Text>
              <Text style={styles.whyHint}>{t('result.whyHint')}</Text>
            </View>
            <View style={[styles.whyCaret, showWhy && styles.whyCaretOpen]}>
              <CaretIcon size={18} color={colors.deepIndigo} />
            </View>
          </Pressable>
        ) : null}

        {showWhy ? (
          <View style={styles.whyBody}>
            {signs.map((s) => (
              <View key={s.id} style={styles.whyRow}>
                <View style={[styles.whyBullet, whyDotColor(s.severity)]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.whyFinding}>{s.sign}</Text>
                  <Text style={styles.whyProtocol}>{s.protocol_id}</Text>
                </View>
              </View>
            ))}
            {signs.length === 0 ? (
              <Text style={styles.whyEmpty}>
                No danger signs were flagged. The model emitted a clear-severity
                outcome based on the captured audio and photos.
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <View style={styles.deviceDot} />
            <Text style={styles.metaPrimary}>
              On-device inference{wallSec ? ` · ${wallSec}s` : ''}
            </Text>
          </View>
          <Text style={styles.metaSecondary}>{t('footer.who')}</Text>
          <Text style={styles.metaSecondary}>{t('footer.decisionSupport')}</Text>
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

function whyDotColor(sev: 'info' | 'warning' | 'urgent'): { backgroundColor: string } {
  switch (sev) {
    case 'urgent':
      return { backgroundColor: colors.clinicRed };
    case 'warning':
      return { backgroundColor: colors.milletOchre };
    default:
      return { backgroundColor: colors.slate };
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bone },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bone },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  whyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.cardElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  whyTitle: { ...typography.label, color: colors.deepIndigo, fontSize: 15 },
  whyHint: { ...typography.caption, color: colors.slate, marginTop: 1 },
  whyCaret: { transform: [{ rotate: '90deg' }] },
  whyCaretOpen: { transform: [{ rotate: '270deg' }] },
  whyBody: {
    backgroundColor: colors.cardElevated,
    padding: spacing.md,
    borderRadius: radii.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.terracotta,
    gap: spacing.sm,
    marginTop: -spacing.sm,
  },
  whyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  whyBullet: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  whyFinding: { ...typography.body, color: colors.deepIndigo },
  whyProtocol: { ...typography.caption, color: colors.slate, fontFamily: 'Menlo', fontSize: 11 },
  whyEmpty: { ...typography.body, color: colors.slate, fontStyle: 'italic' },
  metaCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    gap: 4,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  deviceDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.okraGreen },
  metaPrimary: { ...typography.caption, color: colors.deepIndigo, fontWeight: '500' },
  metaSecondary: { ...typography.caption, color: colors.slate, fontSize: 12 },
  actions: { gap: spacing.md, marginTop: spacing.lg },
  printError: { ...typography.caption, color: colors.clinicRed, marginTop: spacing.xs },
});
