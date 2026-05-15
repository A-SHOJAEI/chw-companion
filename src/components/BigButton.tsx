import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radii, spacing, touchTargets, typography } from '../theme';

export type BigButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';

interface Props {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: BigButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function BigButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
}: Props) {
  const palette = paletteFor(variant);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      onPress={(e) => {
        if (disabled || loading) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border },
        fullWidth && styles.fullWidth,
        pressed && !disabled && { opacity: 0.85 },
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      <View style={styles.row}>
        <Text style={[styles.label, { color: palette.fg }]} numberOfLines={1}>
          {loading ? '…' : title}
        </Text>
      </View>
    </Pressable>
  );
}

function paletteFor(variant: BigButtonVariant): { bg: string; fg: string; border: string } {
  switch (variant) {
    case 'primary':
      return { bg: colors.terracotta, fg: colors.invertedText, border: colors.terracotta };
    case 'secondary':
      return { bg: colors.bone, fg: colors.deepIndigo, border: colors.deepIndigo };
    case 'danger':
      return { bg: colors.clinicRed, fg: colors.invertedText, border: colors.clinicRed };
    case 'success':
      return { bg: colors.okraGreen, fg: colors.invertedText, border: colors.okraGreen };
  }
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTargets.primary,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { ...typography.label, fontSize: 20, lineHeight: 24 },
});
