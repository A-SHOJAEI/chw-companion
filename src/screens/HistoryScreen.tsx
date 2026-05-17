import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { ClipboardIllustration } from '../components/Icons';
import { colors, radii, spacing, typography, severityColors } from '../theme';
import { t } from '../lib/i18n';
import { listVisits, type VisitRow } from '../lib/db';
import { seedDemoData } from '../lib/demo-seed';

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

  async function refresh(): Promise<void> {
    setRows(await listVisits());
  }

  async function onLongPressHeader(): Promise<void> {
    const r = await seedDemoData();
    if (r.visitsCreated > 0) await refresh();
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onLongPress={() => void onLongPressHeader()}
        delayLongPress={1200}
        accessibilityRole="header"
        accessibilityLabel={t('history.title')}
        accessibilityHint="Long-press for 1.2 seconds to seed demo data (debug only)."
      >
        <Text style={styles.heading}>{t('history.title')}</Text>
      </Pressable>
      {rows.length === 0 ? (
        <View style={styles.emptyWrap}>
          <ClipboardIllustration size={140} />
          <Text style={styles.emptyTitle}>{t('history.empty')}</Text>
          <Text style={styles.emptyHint}>{t('history.emptyHint')}</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onOpenVisit?.(item.id)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel={`Visit for ${formatPatient(item.patient_name)}, severity ${item.severity ?? 'clear'}, ${new Date(item.created_at).toLocaleDateString()}`}
              accessibilityHint="Opens the full record for this visit."
            >
              <View style={[styles.severityBar, severityBg(item.severity)]} />
              <View style={styles.rowBody}>
                <Text style={styles.patient}>{formatPatient(item.patient_name)}</Text>
                <Text style={styles.meta}>
                  {new Date(item.created_at).toLocaleDateString()}
                  {item.bp_sys && item.bp_dia ? ` · BP ${item.bp_sys}/${item.bp_dia}` : ''}
                  {' · '}
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
      <BigButton title="←" variant="secondary" onPress={onBack} accessibilityLabel="Back to home" />
    </View>
  );
}

function formatPatient(name: string): string {
  if (!name || name === 'Pending') return t('result.unknownPatient');
  return name;
}

function severityBg(sev: VisitRow['severity']): { backgroundColor: string } {
  if (sev) return { backgroundColor: severityColors[sev].bg };
  return { backgroundColor: colors.divider };
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.lg, paddingTop: spacing.xxxl, backgroundColor: colors.bone },
  heading: { ...typography.display, color: colors.deepIndigo, marginBottom: spacing.lg },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  emptyTitle: { ...typography.heading, color: colors.deepIndigo, marginTop: spacing.lg },
  emptyHint: { ...typography.body, color: colors.slate, textAlign: 'center', maxWidth: 280 },
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
  meta: { ...typography.caption, color: colors.slate, marginTop: 2 },
  action: { ...typography.body, color: colors.deepIndigo, marginTop: spacing.xs },
});
