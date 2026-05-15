import { StyleSheet, Text, View } from 'react-native';
import { severityColors, spacing, typography, type Severity } from '../theme';
import { t } from '../lib/i18n';

interface Props {
  severity: Severity;
  caption?: string;
}

const severityLabelKey = {
  urgent: 'result.urgent',
  watch: 'result.watch',
  clear: 'result.clear',
} as const;

export function StatusBanner({ severity, caption }: Props) {
  const p = severityColors[severity];
  return (
    <View style={[styles.banner, { backgroundColor: p.bg }]}>
      <Text style={[styles.label, { color: p.fg }]}>{t(severityLabelKey[severity])}</Text>
      {caption ? (
        <Text style={[styles.caption, { color: p.fg }]} numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 0,
  },
  label: {
    ...typography.display,
    letterSpacing: 1.5,
  },
  caption: {
    ...typography.bodyLg,
    marginTop: spacing.xs,
  },
});
