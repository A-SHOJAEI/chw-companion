import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { t } from '../lib/i18n';
import type { DangerSignRow, VisitRow } from '../lib/db';

interface Props {
  visit: VisitRow;
  dangerSigns: DangerSignRow[];
}

export function TriageCard({ visit, dangerSigns }: Props) {
  return (
    <View style={styles.card}>
      <Row label={t('result.patient')} value={visit.patient_name} />
      {visit.gestational_age_weeks != null ? (
        <Row label="GA" value={`${visit.gestational_age_weeks} w`} />
      ) : null}

      <View style={styles.divider} />
      <Text style={styles.section}>{t('result.vitals')}</Text>
      <Row label="BP" value={formatBP(visit.bp_sys, visit.bp_dia)} />
      <Row label="Edema" value={visit.edema_grade ?? '—'} />
      <Row label="Proteinuria" value={visit.proteinuria ?? '—'} />

      {dangerSigns.length ? (
        <>
          <View style={styles.divider} />
          <Text style={styles.section}>{t('result.dangerSigns')}</Text>
          {dangerSigns.map((d) => (
            <View key={d.id} style={styles.signRow}>
              <View style={[styles.dot, dotColor(d.severity)]} />
              <Text style={styles.signText}>{d.sign}</Text>
            </View>
          ))}
        </>
      ) : null}

      {visit.recommended_action ? (
        <>
          <View style={styles.divider} />
          <Text style={styles.section}>{t('result.recommendation')}</Text>
          <Text style={styles.action}>{visit.recommended_action}</Text>
          <View style={styles.metaRow}>
            <Row label={t('result.facility')} value={visit.recommended_facility ?? '—'} compact />
            <Row
              label={t('result.timeframeHours')}
              value={visit.recommended_timeframe_hours != null
                ? `${visit.recommended_timeframe_hours}`
                : '—'}
              compact
            />
          </View>
        </>
      ) : null}
    </View>
  );
}

function dotColor(sev: 'info' | 'warning' | 'urgent'): { backgroundColor: string } {
  switch (sev) {
    case 'urgent':
      return { backgroundColor: colors.clinicRed };
    case 'warning':
      return { backgroundColor: colors.milletOchre };
    default:
      return { backgroundColor: colors.slate };
  }
}

function formatBP(sys: number | null, dia: number | null): string {
  if (sys == null && dia == null) return '—';
  return `${sys ?? '?'} / ${dia ?? '?'} mmHg`;
}

function Row({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radii.lg,
    gap: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  section: { ...typography.label, color: colors.slate, marginBottom: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowCompact: { flex: 1 },
  rowLabel: { ...typography.body, color: colors.slate, marginRight: spacing.md },
  rowValue: { ...typography.body, color: colors.deepIndigo, flexShrink: 1, textAlign: 'right' },
  signRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  signText: { ...typography.body, color: colors.deepIndigo, flexShrink: 1 },
  action: { ...typography.bodyLg, color: colors.deepIndigo, lineHeight: 26 },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
});
