import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '../components/BigButton';
import {
  BoltIcon,
  CaretIcon,
  DocIcon,
  PlaneIcon,
  ShieldIcon,
} from '../components/Icons';
import { colors, radii, spacing, typography } from '../theme';
import { t, getLanguage, setLanguage, type Language, type StringKey } from '../lib/i18n';
import { countVisitsSince, countUnsyncedVisits } from '../lib/db';
import { on } from '../lib/events';
import { getCachedProfile } from '../lib/profile';
import { tipOfTheDay } from '../lib/tips';

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
  const profile = getCachedProfile();
  // Recompute on every render — cheap, and we want lang switches to flip the
  // tip language immediately without an extra dependency wrapper.
  void lang;
  const tip = tipOfTheDay();

  const refresh = useCallback(async (): Promise<void> => {
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);
    setCount(await countVisitsSince(startOfWeek.toISOString()));
    setUnsynced(await countUnsyncedVisits());
  }, []);

  useEffect(() => {
    void refresh();
    const offCreate = on('visit:created', () => void refresh());
    const offComplete = on('visit:completed', () => void refresh());
    return () => {
      offCreate();
      offComplete();
    };
  }, [refresh]);

  function toggleLang() {
    const next: Language = lang === 'ha' ? 'en' : 'ha';
    setLanguage(next);
    setLang(next);
  }

  const now = new Date();
  const today = now.toLocaleDateString(lang === 'ha' ? 'ha-NG' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const greeting = greetForHour(now.getHours());
  const name = profile?.name && profile.name !== 'CHW' ? profile.name : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>
            {t(greeting)}
            {name ? `, ${name}` : ''}
          </Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <Pressable
          onPress={toggleLang}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={lang === 'ha' ? 'Switch to English' : 'Sauya zuwa Hausa'}
          accessibilityHint="Toggles the app's display language between Hausa and English."
        >
          <Text style={styles.langPill}>{lang === 'ha' ? 'EN' : 'HA'}</Text>
        </Pressable>
      </View>

      <View style={styles.statCard}>
        <View style={styles.statRow}>
          <Text style={styles.statNumber}>{count}</Text>
          <View style={{ flex: 1, paddingLeft: spacing.md }}>
            <Text style={styles.statCaption}>{t('home.visitsThisWeek')}</Text>
            {unsynced > 0 ? (
              <Text style={styles.unsynced}>
                {unsynced} {t('history.syncPending').toLowerCase()}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.chipRow}>
          <StatusChip
            icon={<PlaneIcon size={14} color={colors.okraGreen} />}
            label={t('home.statusOffline')}
            tone="success"
          />
          <StatusChip
            icon={<ShieldIcon size={14} color={colors.deepIndigo} />}
            label={t('home.statusEncrypted')}
          />
          <StatusChip
            icon={<BoltIcon size={14} color={modelReady ? colors.terracotta : colors.slate} />}
            label={t('home.statusModelReady')}
            tone={modelReady ? 'accent' : 'muted'}
          />
        </View>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipLabel}>{t('home.tipLabel')}</Text>
        <Text style={styles.tipBody}>{tip.text}</Text>
        <Text style={styles.tipSource}>{tip.source}</Text>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.buttonStack}>
        <BigButton
          title={t('home.startVisit')}
          variant="primary"
          onPress={onStartVisit}
          disabled={!modelReady}
          accessibilityHint="Begins a new visit: record audio, capture 3 photos, run on-device triage."
        />
        <Pressable
          onPress={onStartSampleVisit}
          disabled={!modelReady}
          style={({ pressed }) => [styles.demoBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={t('home.tryDemo')}
          accessibilityHint={t('home.tryDemoSub')}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.demoTitle}>{t('home.tryDemo')}</Text>
            <Text style={styles.demoSub}>{t('home.tryDemoSub')}</Text>
          </View>
          <CaretIcon size={20} color={colors.deepIndigo} />
        </Pressable>
        <Pressable
          onPress={onOpenHistory}
          hitSlop={12}
          accessibilityRole="link"
          accessibilityLabel={t('home.history')}
          style={styles.historyRow}
        >
          <DocIcon size={18} color={colors.deepIndigo} />
          <Text style={styles.historyLink}>{t('home.history')}</Text>
          <CaretIcon size={16} color={colors.deepIndigo} />
        </Pressable>
        {!modelReady ? (
          <Text style={styles.loadingHint}>{t('error.modelNotReady')}</Text>
        ) : null}
      </View>
    </View>
  );
}

function greetForHour(h: number): StringKey {
  if (h < 12) return 'home.greetingMorning';
  if (h < 17) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

type ChipTone = 'success' | 'accent' | 'muted';

function StatusChip({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  tone?: ChipTone;
}) {
  const palette: { bg: string; fg: string } = (() => {
    switch (tone) {
      case 'success':
        return { bg: 'rgba(46, 125, 91, 0.10)', fg: colors.okraGreen };
      case 'accent':
        return { bg: 'rgba(201, 83, 42, 0.10)', fg: colors.terracotta };
      case 'muted':
        return { bg: colors.divider, fg: colors.slate };
      default:
        return { bg: 'rgba(27, 42, 78, 0.06)', fg: colors.deepIndigo };
    }
  })();
  return (
    <View style={[chipStyles.chip, { backgroundColor: palette.bg }]}>
      {icon}
      <Text style={[chipStyles.label, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  label: { ...typography.caption, fontWeight: '500', fontSize: 12 },
});

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
    backgroundColor: colors.bone,
  },
  topBar: { flexDirection: 'row', alignItems: 'flex-start' },
  greeting: { ...typography.heading, color: colors.deepIndigo, fontSize: 22 },
  date: { ...typography.caption, color: colors.slate, marginTop: 2, letterSpacing: 0.3 },
  langPill: {
    ...typography.label,
    color: colors.terracotta,
    borderColor: colors.terracotta,
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: spacing.md,
  },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statNumber: { ...typography.display, fontSize: 64, lineHeight: 64, color: colors.terracotta, fontWeight: '700' },
  statCaption: { ...typography.bodyLg, color: colors.deepIndigo, lineHeight: 22 },
  unsynced: { ...typography.caption, color: colors.slate, marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tipCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.milletOchre,
    backgroundColor: colors.cardElevated,
    borderRadius: 6,
    gap: 4,
  },
  tipLabel: {
    ...typography.caption,
    color: colors.milletOchre,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
    fontSize: 11,
  },
  tipBody: { ...typography.body, color: colors.deepIndigo, lineHeight: 22 },
  tipSource: { ...typography.caption, color: colors.slate, fontFamily: 'Menlo', fontSize: 11 },
  buttonStack: { gap: spacing.md, alignItems: 'stretch' },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardElevated,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.divider,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    minHeight: 64,
  },
  demoTitle: { ...typography.label, fontSize: 16, color: colors.deepIndigo },
  demoSub: { ...typography.caption, color: colors.slate, marginTop: 2 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  historyLink: { ...typography.label, color: colors.deepIndigo, fontSize: 15 },
  loadingHint: { ...typography.caption, color: colors.slate, textAlign: 'center', marginTop: spacing.sm },
});
