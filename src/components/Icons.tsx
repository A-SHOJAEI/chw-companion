/**
 * Inline SVG icons. We don't pull in a heavy icon font — every glyph the app
 * needs ships as a hand-tuned outline matching the design tokens. All icons
 * accept `size` (defaults to 24) and `color` (defaults to deep indigo).
 */
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';
import { colors } from '../theme';

interface IconProps {
  size?: number;
  color?: string;
}

const DEFAULT_SIZE = 24;
const DEFAULT_COLOR = colors.deepIndigo;
const STROKE_WIDTH = 1.7;

function box(size: number | undefined): { size: number } {
  return { size: size ?? DEFAULT_SIZE };
}

/* ---------------------- Visit step icons ---------------------- */

/** Microphone — Listen step. */
export function MicIcon({ size, color = DEFAULT_COLOR }: IconProps) {
  const { size: s } = box(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Rect x="9" y="3" width="6" height="11" rx="3" stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
      <Path d="M5 11a7 7 0 0 0 14 0" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" fill="none" />
      <Path d="M12 18v3" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Path d="M8 21h8" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </Svg>
  );
}

/** Eye — See step. */
export function EyeIcon({ size, color = DEFAULT_COLOR }: IconProps) {
  const { size: s } = box(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Path
        d="M2 12c2.5-4.5 6-7 10-7s7.5 2.5 10 7c-2.5 4.5-6 7-10 7s-7.5-2.5-10-7Z"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
    </Svg>
  );
}

/** Spark — Reason step (the "thinking" beat). */
export function SparkIcon({ size, color = DEFAULT_COLOR }: IconProps) {
  const { size: s } = box(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Path
        d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
    </Svg>
  );
}

/* ---------------------- Vital icons (in TriageCard) ---------------------- */

/** Heart — BP. */
export function HeartIcon({ size, color = DEFAULT_COLOR }: IconProps) {
  const { size: s } = box(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Path
        d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Drop — proteinuria. */
export function DropIcon({ size, color = DEFAULT_COLOR }: IconProps) {
  const { size: s } = box(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Path
        d="M12 3.5c3.5 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 2.5-6.5 6-10.5Z"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Foot/Ankle — edema. */
export function FootIcon({ size, color = DEFAULT_COLOR }: IconProps) {
  const { size: s } = box(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Path
        d="M6.5 15c0-3 1-6 3-7.5 1.6-1.2 3.6-1.1 4.6.2 1.2 1.5.8 4-1 5.6l-2.6 2.4c-1.7 1.6-4 1.7-5-.7Z"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M8 18c-1 2-1 4 1 4h7c1.5 0 2-1.5 1-2.8"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

/** Calendar — gestational age / follow-up. */
export function CalendarIcon({ size, color = DEFAULT_COLOR }: IconProps) {
  const { size: s } = box(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
      <Path d="M3.5 10h17" stroke={color} strokeWidth={STROKE_WIDTH} />
      <Path d="M8 3v4M16 3v4" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Circle cx="12" cy="14" r="1.4" fill={color} />
    </Svg>
  );
}

/* ---------------------- Status / chrome icons ---------------------- */

/** Plane — offline / airplane-mode chip. */
export function PlaneIcon({ size, color = DEFAULT_COLOR }: IconProps) {
  const { size: s } = box(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Path
        d="M3.5 14.5 9 12V6.5L11 5l1 5.5 6 2.2v2.3l-5.5-1-1.5 5.5h-1.6L9.5 14l-4 1.5z"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Shield — encryption / on-device chip. */
export function ShieldIcon({ size, color = DEFAULT_COLOR }: IconProps) {
  const { size: s } = box(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Path
        d="M12 3 4 6v6c0 4.5 3 8 8 9 5-1 8-4.5 8-9V6l-8-3Z"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
        fill="none"
      />
      <Polyline points="9 12 11.5 14.5 15.5 10.5" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** Spark / lightning — model ready / inference. */
export function BoltIcon({ size, color = DEFAULT_COLOR }: IconProps) {
  const { size: s } = box(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Path
        d="m13 3-7 11h5l-1 7 7-11h-5l1-7Z"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Globe — language toggle. */
export function GlobeIcon({ size, color = DEFAULT_COLOR }: IconProps) {
  const { size: s } = box(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
      <Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
    </Svg>
  );
}

/** Document — visit history. */
export function DocIcon({ size, color = DEFAULT_COLOR }: IconProps) {
  const { size: s } = box(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Path d="M6 3h8l4 4v14H6V3Z" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" fill="none" />
      <Path d="M14 3v5h4M8 13h8M8 17h6" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </Svg>
  );
}

/** Caret right — list affordances. */
export function CaretIcon({ size, color = DEFAULT_COLOR }: IconProps) {
  const { size: s } = box(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Polyline points="9 5 16 12 9 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/** Info — for the "why this severity" disclosure. */
export function InfoIcon({ size, color = DEFAULT_COLOR }: IconProps) {
  const { size: s } = box(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={STROKE_WIDTH} fill="none" />
      <Path d="M12 11v6" stroke={color} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
      <Circle cx="12" cy="8" r="1.1" fill={color} />
    </Svg>
  );
}

/* ---------------------- Empty-state illustration ---------------------- */

/**
 * The "no visits yet" illustration. Stylized clipboard with a checkmark and
 * a couple of decorative dots. Sized to ~140 by default to anchor an empty
 * screen without dominating it.
 */
export function ClipboardIllustration({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <Circle cx="115" cy="22" r="3" fill={colors.milletOchre} opacity="0.7" />
      <Circle cx="22" cy="105" r="3" fill={colors.terracotta} opacity="0.5" />
      <Circle cx="118" cy="100" r="2.4" fill={colors.okraGreen} opacity="0.55" />

      <Rect x="42" y="28" width="56" height="78" rx="6" fill={colors.cardElevated} stroke={colors.deepIndigo} strokeWidth="2" />
      <Rect x="56" y="22" width="28" height="11" rx="3" fill={colors.terracotta} />

      <Path d="M52 56h36M52 66h36M52 76h28" stroke={colors.divider} strokeWidth="3" strokeLinecap="round" />

      <Circle cx="95" cy="92" r="14" fill={colors.okraGreen} />
      <Polyline points="89 92 94 97 102 88" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/* ---------------------- Brand mark ---------------------- */

/**
 * The CHW Companion mark. A terracotta hill (the Sahel horizon) cradling a
 * stylized heart inside a circle (the patient, on-device). Used on the
 * Welcome screen + the loading overlay.
 */
export function BrandMark({ size = 96 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96">
      <Circle cx="48" cy="48" r="46" fill={colors.bone} stroke={colors.terracotta} strokeWidth="3" />
      <Path
        d="M14 62c8-12 18-16 34-16s26 4 34 16"
        stroke={colors.terracotta}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M48 58s-9-6-9-13a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 7-9 13-9 13Z"
        fill={colors.terracotta}
      />
    </Svg>
  );
}
