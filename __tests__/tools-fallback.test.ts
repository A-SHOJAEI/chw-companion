import { afterEach, describe, expect, it } from 'vitest';
import {
  TOOLS,
  TOOLS_MINIMAL,
  pickToolSet,
  recordToolDecodeOutcome,
  recentFailureRate,
} from '../src/lib/tools';

afterEach(() => {
  // Drain the rolling window by recording 10 successes.
  for (let i = 0; i < 10; i++) recordToolDecodeOutcome(true);
  for (let i = 0; i < 10; i++) recordToolDecodeOutcome(true);
});

describe('constrained-decoding fallback', () => {
  it('TOOLS_MINIMAL is a 2-element subset of TOOLS', () => {
    expect(TOOLS_MINIMAL.map((t) => t.name).sort()).toEqual(
      ['record_vitals', 'recommend_action'].sort()
    );
    expect(TOOLS_MINIMAL.length).toBeLessThan(TOOLS.length);
  });

  it('returns full TOOLS when failure rate is 0', () => {
    for (let i = 0; i < 10; i++) recordToolDecodeOutcome(true);
    expect(recentFailureRate()).toBe(0);
    const { tools, minimal } = pickToolSet();
    expect(minimal).toBe(false);
    expect(tools.length).toBe(TOOLS.length);
  });

  it('falls back to TOOLS_MINIMAL when failure rate exceeds 30%', () => {
    for (let i = 0; i < 10; i++) recordToolDecodeOutcome(true);
    // 4 failures, 0 successes in the trailing window of 10
    for (let i = 0; i < 4; i++) recordToolDecodeOutcome(false);
    expect(recentFailureRate()).toBeGreaterThan(0.3);
    const { tools, minimal } = pickToolSet();
    expect(minimal).toBe(true);
    expect(tools).toBe(TOOLS_MINIMAL);
  });

  it('30% exactly stays on full TOOLS (strict threshold)', () => {
    // start clean
    for (let i = 0; i < 10; i++) recordToolDecodeOutcome(true);
    // exactly 3 failures, 7 successes
    for (let i = 0; i < 3; i++) recordToolDecodeOutcome(false);
    for (let i = 0; i < 7; i++) recordToolDecodeOutcome(true);
    expect(recentFailureRate()).toBeCloseTo(0.3, 5);
    const { minimal } = pickToolSet();
    expect(minimal).toBe(false);
  });
});
