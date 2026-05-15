import { useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import { colors, radii, spacing, touchTargets, typography } from '../theme';
import { t } from '../lib/i18n';

interface Props {
  label: string;
  uri: string | null;
  onCaptured: (uri: string) => void;
  onCleared?: () => void;
}

export function PhotoCapture({ label, uri, onCaptured, onCleared }: Props) {
  const [open, setOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [open, permission, requestPermission]);

  async function take(): Promise<void> {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      if (pic?.uri) {
        onCaptured(pic.uri);
        setOpen(false);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.tile}>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label} ${uri ? 'photo, captured' : 'photo, not yet captured'}`}
        accessibilityHint={uri ? 'Tap to retake this photo.' : 'Tap to open the camera.'}
        style={({ pressed }) => [styles.tilePressable, pressed && { opacity: 0.85 }]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.thumb} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.plus}>＋</Text>
          </View>
        )}
        <View style={styles.captionRow}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.helper}>{uri ? t('visit.recaptureTap') : t('visit.captureTap')}</Text>
        </View>
      </Pressable>
      {uri && onCleared ? (
        <Pressable onPress={onCleared} style={styles.clear} hitSlop={12}>
          <Text style={styles.clearText}>×</Text>
        </Pressable>
      ) : null}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.cameraWrap}>
          {permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing={facing}
            />
          ) : (
            <View style={styles.permDenied}>
              <Text style={typography.bodyLg}>Camera permission required.</Text>
            </View>
          )}
          <View style={styles.cameraControls}>
            <Pressable
              onPress={() => setOpen(false)}
              style={[styles.shutter, styles.cancel]}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>×</Text>
            </Pressable>
            <Pressable
              onPress={() => void take()}
              style={styles.shutter}
              accessibilityRole="button"
              disabled={busy}
            >
              <View style={styles.shutterInner} />
            </Pressable>
            <View style={[styles.shutter, { opacity: 0 }]} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    minHeight: touchTargets.primary * 2,
    flex: 1,
  },
  tilePressable: { flex: 1, alignItems: 'stretch' },
  thumb: { flex: 1, width: '100%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bone,
  },
  plus: { fontSize: 48, color: colors.terracotta },
  captionRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardElevated,
  },
  label: { ...typography.label, color: colors.deepIndigo },
  helper: { ...typography.caption, color: colors.slate },
  clear: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.deepIndigo,
    borderRadius: 999,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { color: colors.invertedText, fontSize: 18, lineHeight: 18, marginTop: -2 },
  cameraWrap: { flex: 1, backgroundColor: '#000' },
  permDenied: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  shutter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF22',
    borderWidth: 4,
    borderColor: '#FFFFFFAA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  cancel: { backgroundColor: '#FFFFFF22', borderColor: '#FFFFFF55' },
  cancelText: { color: '#FFFFFF', fontSize: 36, lineHeight: 36 },
});
