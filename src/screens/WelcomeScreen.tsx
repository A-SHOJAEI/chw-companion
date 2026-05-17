import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BigButton } from '../components/BigButton';
import { BrandMark, BoltIcon, ShieldIcon, PlaneIcon } from '../components/Icons';
import { colors, radii, spacing, typography } from '../theme';
import { t, getLanguage, setLanguage, type Language } from '../lib/i18n';
import { saveProfile } from '../lib/profile';

interface Props {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: Props) {
  const [lang, setLang] = useState<Language>(getLanguage());
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleLang() {
    const next: Language = lang === 'ha' ? 'en' : 'ha';
    setLanguage(next);
    setLang(next);
  }

  async function persist(useName: string): Promise<void> {
    setSaving(true);
    try {
      await saveProfile({
        name: useName.trim() || 'CHW',
        onboardedAt: new Date().toISOString(),
        language: lang,
      });
      onComplete();
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.langRow}>
          <Pressable
            onPress={toggleLang}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={lang === 'ha' ? 'Switch to English' : 'Sauya zuwa Hausa'}
          >
            <Text style={styles.langPill}>{lang === 'ha' ? 'EN' : 'HA'}</Text>
          </Pressable>
        </View>

        <View style={styles.heroBlock}>
          <BrandMark size={88} />
          <Text style={styles.heroTitle}>{t('welcome.title')}</Text>
          <Text style={styles.heroBrand}>{t('app.name')}</Text>
          <Text style={styles.heroTag}>{t('app.tagline')}</Text>
        </View>

        <Text style={styles.lead}>{t('welcome.lead')}</Text>

        <View style={styles.cards}>
          <ValueCard
            icon={<BoltIcon size={28} color={colors.terracotta} />}
            title={t('welcome.point1Title')}
            body={t('welcome.point1Body')}
          />
          <ValueCard
            icon={<PlaneIcon size={28} color={colors.terracotta} />}
            title={t('welcome.point2Title')}
            body={t('welcome.point2Body')}
          />
          <ValueCard
            icon={<ShieldIcon size={28} color={colors.terracotta} />}
            title={t('welcome.point3Title')}
            body={t('welcome.point3Body')}
          />
        </View>

        <View style={styles.nameBlock}>
          <Text style={styles.nameLabel}>{t('welcome.nameLabel')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('welcome.namePlaceholder')}
            placeholderTextColor={colors.slate}
            style={styles.nameInput}
            returnKeyType="done"
            autoCapitalize="words"
            autoComplete="name"
            onSubmitEditing={() => void persist(name)}
            accessibilityLabel={t('welcome.nameLabel')}
          />
        </View>

        <View style={styles.actions}>
          <BigButton
            title={t('welcome.continue')}
            variant="primary"
            onPress={() => void persist(name)}
            disabled={saving}
            accessibilityLabel={t('welcome.continue')}
            accessibilityHint="Saves your name on this device and opens the home screen."
          />
          <Pressable
            onPress={() => void persist('')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('welcome.skipForNow')}
          >
            <Text style={styles.skip}>{t('welcome.skipForNow')}</Text>
          </Pressable>
        </View>

        <Text style={styles.legal}>
          {t('footer.decisionSupport')} · {t('footer.who')}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ValueCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.iconWrap}>{icon}</View>
      <View style={cardStyles.text}>
        <Text style={cardStyles.title}>{title}</Text>
        <Text style={cardStyles.body}>{body}</Text>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bone,
    borderWidth: 2,
    borderColor: colors.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 4 },
  title: { ...typography.heading, fontSize: 17, color: colors.deepIndigo },
  body: { ...typography.body, fontSize: 14, color: colors.slate, lineHeight: 20 },
});

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bone },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  langRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  langPill: {
    ...typography.label,
    color: colors.terracotta,
    borderColor: colors.terracotta,
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBlock: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  heroTitle: {
    ...typography.caption,
    color: colors.slate,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
  heroBrand: { ...typography.display, color: colors.deepIndigo, fontSize: 36 },
  heroTag: { ...typography.body, color: colors.terracotta, fontStyle: 'italic' },
  lead: { ...typography.bodyLg, color: colors.deepIndigo, textAlign: 'center', lineHeight: 26 },
  cards: { gap: spacing.md },
  nameBlock: { gap: spacing.xs, marginTop: spacing.sm },
  nameLabel: {
    ...typography.label,
    color: colors.slate,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  nameInput: {
    ...typography.bodyLg,
    color: colors.deepIndigo,
    backgroundColor: colors.cardElevated,
    borderColor: colors.divider,
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 56,
  },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  skip: { ...typography.body, color: colors.slate, textAlign: 'center', padding: spacing.sm },
  legal: { ...typography.caption, color: colors.slate, textAlign: 'center', marginTop: spacing.sm },
});
