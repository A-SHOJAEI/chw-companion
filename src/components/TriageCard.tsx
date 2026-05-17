import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { t } from '../lib/i18n';
import type { DangerSignRow, VisitRow } from '../lib/db';
import { CalendarIcon, DropIcon, FootIcon, HeartIcon } from './Icons';

interface Props {
  visit: VisitRow;
  dangerSigns: DangerSignRow[];
}

export function TriageCard({ visit, dangerSigns }: Props) {
  const knownPatient = visit.patient_name && visit.patient_name !== 'Pending';
  const hasVitals =
    visit.bp_sys != null ||
    visit.bp_dia != null ||
    visit.edema_grade != null ||
    visit.proteinuria != null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.patientName}>
          {knownPatient ? visit.patient_name : t('result.unknownPatient')}
        </Text>
        {visit.gestational_age_weeks != null && visit.gestational_age_weeks > 0 ? (
          <View style={styles.gaPill}>
            <CalendarIcon size={14} color={colors.deepIndigo} />
            <Text style={styles.gaText}>
              {visit.gestational_age_weeks} {t('result.gaWeeks')}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.divider} />
      <Text style={styles.section}>{t('result.vitals')}</Text>
      {hasVitals ? (
        <View style={styles.vitalsGrid}>
          {visit.bp_sys != null || visit.bp_dia != null ? (
            <Vital
              icon={<HeartIcon size={18} color={colors.terracotta} />}
              label="BP"
              value={formatBP(visit.bp_sys, visit.bp_dia)}
              unit="mmHg"
            />
          ) : null}
          {visit.edema_grade ? (
            <Vital
              icon={<FootIcon size={18} color={colors.terracotta} />}
              label="Edema"
              value={visit.edema_grade}
            />
          ) : null}
          {visit.proteinuria ? (
            <Vital
              icon={<DropIcon size={18} color={colors.terracotta} />}
              label="Proteinuria"
              value={visit.proteinuria}
            />
          ) : null}
        </View>
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
            {visit.recommended_facility ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>{t('result.facility')}</Text>
                <Text style={styles.metaChipValue}>{visit.recommended_facility}</Text>
              </View>
            ) : null}
            {visit.recommended_timeframe_hours != null ? (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>{t('result.timeframe')}</Text>
                <Text style={styles.metaChipValue}>
                  {visit.recommended_timeframe_hours}h
                </Text>
              </View>
            ) : null}
          </View>
        </>
      ) : (
        <Text style={styles.empty}>{t('result.noRecommendation')}</Text>
      )}
    </View>
  );
}

function Vital({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View style={styles.vitalCell}>
      <View style={styles.vitalIcon}>{icon}</View>
      <Text style={styles.vitalLabel}>{label}</Text>
      <Text style={styles.vitalValue}>
        {value}
        {unit ? <Text style={styles.vitalUnit}> {unit}</Text> : null}
      </Text>
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
  return `${sys ?? '?'}/${dia ?? '?'}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radii.lg,
    gap: spacing.xs,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  patientName: { ...typography.heading, color: colors.deepIndigo, flex: 1, fontSize: 20 },
  gaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bone,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gaText: { ...typography.caption, color: colors.deepIndigo, fontWeight: '500' },
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
    fontSize: 11,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 2,
  },
  vitalCell: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: colors.bone,
    borderRadius: 10,
    padding: spacing.sm,
    gap: 2,
  },
  vitalIcon: { marginBottom: 2 },
  vitalLabel: {
    ...typography.caption,
    color: colors.slate,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  vitalValue: { ...typography.heading, color: colors.deepIndigo, fontSize: 16 },
  vitalUnit: { ...typography.caption, color: colors.slate, fontSize: 11 },
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
  metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  metaChip: {
    backgroundColor: colors.bone,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
  },
  metaChipLabel: {
    ...typography.caption,
    color: colors.slate,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  metaChipValue: { ...typography.label, color: colors.deepIndigo, fontSize: 13 },
});
