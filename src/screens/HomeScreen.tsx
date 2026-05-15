import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import { colors, spacing, typography } from '../theme';
import { t, getLanguage, setLanguage, type Language } from '../lib/i18n';
import { countVisitsSince, countUnsyncedVisits } from '../lib/db';
import { on } from '../lib/events';

interface Props {
  onStartVisit: () => void;
  onStartSampleVisit: () => void;
  onOpenHistory: () => void;
  modelReady: boolean;
}

export function HomeScreen({ onStartVisit, onStartSampleVisit, onOpenHistory, modelReady }: Props) {
  const [count, setCount] = useState(0);
  const [unsynced, setUnsynced] = useState(0);
  const [lang, setLang] = useState<Language>(getLanguage());

  useEffect(() => {
    void refresh();
    const offCreate = on('visit:created', () => void refresh());
    const offComplete = on('visit:completed', () => void refresh());
    return () => {
      offCreate();
      offComplete();
    };
  }, []);

  async function refresh(): Promise<void> {
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);
    setCount(await countVisitsSince(startOfWeek.toISOString()));
    setUnsynced(await countUnsyncedVisits());
  }

  function toggleLang() {
    const next: Language = lang === 'ha' ? 'en' : 'ha';
    setLanguage(next);
    setLang(next);
  }

  const today = new Date().toLocaleDateString(lang === 'ha' ? 'ha-NG' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.todayLabel}>{t('home.today')}</Text>
          <Text style={styles.todayDate}>{today}</Text>
        </View>
        <Pressable onPress={toggleLang} hitSlop={12} accessibilityRole="button">
          <Text style={styles.langSwitch}>{lang === 'ha' ? 'EN' : 'HA'}</Text>
        </Pressable>
      </View>

      <View style={styles.statBlock}>
        <Text style={styles.statNumber}>{count}</Text>
        <Text style={styles.statCaption}>{t('home.visitsThisWeek')}</Text>
        {unsynced > 0 ? (
          <Text style={styles.unsynced}>
            {unsynced} {t('history.syncPending').toLowerCase()}
          </Text>
        ) : null}
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.buttonStack}>
        <BigButton
          title={t('home.startVisit')}
          variant="primary"
          onPress={onStartVisit}
          disabled={!modelReady}
        />
        <View style={{ height: spacing.md }} />
        <BigButton
          title="Try sample visit"
          variant="secondary"
          onPress={onStartSampleVisit}
          disabled={!modelReady}
        />
        <Pressable onPress={onOpenHistory} hitSlop={12} accessibilityRole="link">
          <Text style={styles.historyLink}>{t('home.history')} →</Text>
        </Pressable>
        {!modelReady ? (
          <Text style={styles.loadingHint}>{t('error.modelNotReady')}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
    backgroundColor: colors.bone,
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  todayLabel: { ...typography.caption, color: colors.slate, textTransform: 'uppercase', letterSpacing: 1 },
  todayDate: { ...typography.heading, color: colors.deepIndigo },
  langSwitch: {
    ...typography.label,
    color: colors.terracotta,
    borderColor: colors.terracotta,
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statBlock: { marginTop: spacing.xxl },
  statNumber: { ...typography.display, fontSize: 64, lineHeight: 70, color: colors.terracotta },
  statCaption: { ...typography.bodyLg, color: colors.deepIndigo },
  unsynced: { ...typography.caption, color: colors.slate, marginTop: spacing.xs },
  buttonStack: { gap: spacing.md, alignItems: 'stretch' },
  historyLink: { ...typography.label, color: colors.deepIndigo, marginTop: spacing.lg, textAlign: 'center' },
  loadingHint: { ...typography.caption, color: colors.slate, textAlign: 'center', marginTop: spacing.sm },
});
