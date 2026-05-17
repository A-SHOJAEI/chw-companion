import { StyleSheet, Text, View } from 'react-native';
import { severityColors, spacing, typography, type Severity } from '../theme';
import { t, getLanguage, type StringKey } from '../lib/i18n';

interface Props {
  severity: Severity;
  caption?: string;
}

const severityLabel = {
  urgent: 'result.urgent',
  watch: 'result.watch',
  clear: 'result.clear',
} as const satisfies Record<Severity, StringKey>;

const severitySub = {
  urgent: 'result.urgentSub',
  watch: 'result.watchSub',
  clear: 'result.clearSub',
} as const satisfies Record<Severity, StringKey>;

export function StatusBanner({ severity, caption }: Props) {
  const palette = severityColors[severity];
  const primary = t(severityLabel[severity]);
  const otherLang = getLanguage() === 'ha' ? 'en' : 'ha';
  const otherLabel = t(severityLabel[severity], otherLang);
  const subtitle = caption?.trim() ? caption : t(severitySub[severity]);

  return (
    <View style={[styles.banner, { backgroundColor: palette.bg }]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: palette.fg }]}>{primary}</Text>
        {primary !== otherLabel ? (
          <Text style={[styles.langTag, { color: palette.fg }]}>
            {otherLabel}
          </Text>
        ) : null}
      </View>
      {subtitle ? (
        <Text style={[styles.caption, { color: palette.fg }]} numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md },
  label: {
    ...typography.display,
    letterSpacing: 2,
  },
  langTag: {
    ...typography.label,
    opacity: 0.7,
    letterSpacing: 1.5,
  },
  caption: {
    ...typography.bodyLg,
    marginTop: spacing.xs,
    opacity: 0.92,
  },
});
