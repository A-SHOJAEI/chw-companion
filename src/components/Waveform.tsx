import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, spacing } from '../theme';

interface Props {
  active: boolean;
  bars?: number;
  width?: number;
  height?: number;
}

/**
 * Lightweight animated waveform. We don't tap into real audio metering for the
 * spike (would need expo-av's metering callback + a JS animation loop on every
 * frame); instead we render a deterministic-but-varied wave that signals
 * "listening" clearly. The audio capture is real — this is just the indicator.
 */
export function Waveform({ active, bars = 24, width = 320, height = 56 }: Props) {
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => setTick((t) => (t + 1) % 60), 90);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
      };
    }
    setTick(0);
    return () => undefined;
  }, [active]);

  const gap = 3;
  const barWidth = (width - gap * (bars - 1)) / bars;

  return (
    <View style={styles.wrap}>
      <Svg width={width} height={height}>
        {Array.from({ length: bars }).map((_, i) => {
          const phase = (i + tick) % bars;
          const norm = Math.abs(Math.sin((phase / bars) * Math.PI * 2));
          const minH = height * 0.18;
          const maxH = height * 0.95;
          const h = active ? minH + (maxH - minH) * norm : minH;
          const y = (height - h) / 2;
          return (
            <Rect
              key={i}
              x={i * (barWidth + gap)}
              y={y}
              width={barWidth}
              height={h}
              rx={barWidth / 2}
              fill={active ? colors.terracotta : colors.slate}
              opacity={active ? 0.95 : 0.4}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
});
