import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { colors, radii, spacing, typography, severityColors } from '../theme';
import { t } from '../lib/i18n';
import { listVisits, type VisitRow } from '../lib/db';

interface Props {
  onBack: () => void;
  onOpenVisit?: (id: string) => void;
}

export function HistoryScreen({ onBack, onOpenVisit }: Props) {
  const [rows, setRows] = useState<VisitRow[]>([]);

  useEffect(() => {
    void (async () => {
      setRows(await listVisits());
    })();
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{t('history.title')}</Text>
      {rows.length === 0 ? (
        <Text style={styles.empty}>{t('history.empty')}</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onOpenVisit?.(item.id)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.severityBar, severityBg(item.severity)]} />
              <View style={styles.rowBody}>
                <Text style={styles.patient}>{item.patient_name}</Text>
                <Text style={styles.meta}>
                  {new Date(item.created_at).toLocaleDateString()} ·{' '}
                  {item.bp_sys && item.bp_dia ? `${item.bp_sys}/${item.bp_dia}` : '—'} ·{' '}
                  {item.synced_at ? t('history.synced') : t('history.syncPending')}
                </Text>
                {item.recommended_action ? (
                  <Text style={styles.action} numberOfLines={2}>
                    {item.recommended_action}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          )}
          contentContainerStyle={{ gap: spacing.sm }}
        />
      )}
      <View style={{ height: spacing.lg }} />
      <BigButton title="←" variant="secondary" onPress={onBack} />
    </View>
  );
}

function severityBg(sev: VisitRow['severity']): { backgroundColor: string } {
  if (sev) return { backgroundColor: severityColors[sev].bg };
  return { backgroundColor: colors.divider };
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.lg, paddingTop: spacing.xxxl, backgroundColor: colors.bone },
  heading: { ...typography.display, color: colors.deepIndigo, marginBottom: spacing.lg },
  empty: { ...typography.body, color: colors.slate, textAlign: 'center', marginTop: spacing.xxl },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    minHeight: 80,
  },
  severityBar: { width: 8 },
  rowBody: { flex: 1, padding: spacing.md },
  patient: { ...typography.heading, fontSize: 18, color: colors.deepIndigo },
  meta: { ...typography.caption, color: colors.slate },
  action: { ...typography.body, color: colors.deepIndigo, marginTop: spacing.xs },
});
