import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { t } from '../lib/i18n';
import type { DangerSignRow, VisitRow } from '../lib/db';

interface Props {
  visit: VisitRow;
  dangerSigns: DangerSignRow[];
}

export function TriageCard({ visit, dangerSigns }: Props) {
  const knownPatient = visit.patient_name && visit.patient_name !== 'Pending';
  const hasVitals = visit.bp_sys != null || visit.bp_dia != null ||
    visit.edema_grade != null || visit.proteinuria != null;

  return (
    <View style={styles.card}>
      <Row
        label={t('result.patient')}
        value={knownPatient ? visit.patient_name : t('result.unknownPatient')}
        muted={!knownPatient}
      />
      {visit.gestational_age_weeks != null && visit.gestational_age_weeks > 0 ? (
        <Row label="GA" value={`${visit.gestational_age_weeks} ${t('result.gaWeeks')}`} />
      ) : null}

      <View style={styles.divider} />
      <Text style={styles.section}>{t('result.vitals')}</Text>
      {hasVitals ? (
        <>
          {visit.bp_sys != null || visit.bp_dia != null ? (
            <Row label="BP" value={formatBP(visit.bp_sys, visit.bp_dia)} />
          ) : null}
          {visit.edema_grade ? (
            <Row label="Edema" value={visit.edema_grade} />
          ) : null}
          {visit.proteinuria ? (
            <Row label="Proteinuria" value={visit.proteinuria} />
          ) : null}
        </>
      ) : (
        <Text style={styles.empty}>{t('result.noVitals')}</Text>
      )}

      {dangerSigns.length ? (
        <>
          <View style={styles.divider} />
          <Text style={styles.section}>{t('result.dangerSigns')}</Text>
          {dangerSigns.map((d) => (
            <View key={d.id} style={styles.signRow}>
              <View style={[styles.dot, dotColor(d.severity)]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.signText}>{d.sign}</Text>
                {d.protocol_id ? (
                  <Text style={styles.protocolTag}>{d.protocol_id}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </>
      ) : null}

      <View style={styles.divider} />
      <Text style={styles.section}>{t('result.recommendation')}</Text>
      {visit.recommended_action ? (
        <>
          <Text style={styles.action}>{visit.recommended_action}</Text>
          <View style={styles.metaRow}>
            <Row
              label={t('result.facility')}
              value={visit.recommended_facility ?? '—'}
              compact
            />
            <Row
              label={t('result.timeframe')}
              value={
                visit.recommended_timeframe_hours != null
                  ? `${visit.recommended_timeframe_hours}`
                  : '—'
              }
              compact
            />
          </View>
        </>
      ) : (
        <Text style={styles.empty}>{t('result.noRecommendation')}</Text>
      )}
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

function Row({
  label,
  value,
  compact,
  muted,
}: {
  label: string;
  value: string;
  compact?: boolean;
  muted?: boolean;
}) {
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[styles.rowValue, muted && styles.rowValueMuted]}
        numberOfLines={2}
      >
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
  section: {
    ...typography.label,
    color: colors.slate,
    marginBottom: spacing.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowCompact: { flex: 1 },
  rowLabel: { ...typography.body, color: colors.slate, marginRight: spacing.md },
  rowValue: { ...typography.body, color: colors.deepIndigo, flexShrink: 1, textAlign: 'right' },
  rowValueMuted: { color: colors.slate, fontStyle: 'italic' },
  signRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginVertical: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 7 },
  signText: { ...typography.body, color: colors.deepIndigo },
  protocolTag: {
    ...typography.caption,
    color: colors.slate,
    fontFamily: 'Menlo',
    fontSize: 11,
    marginTop: 2,
  },
  action: { ...typography.bodyLg, color: colors.deepIndigo, lineHeight: 26 },
  empty: { ...typography.body, color: colors.slate, fontStyle: 'italic' },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
});
