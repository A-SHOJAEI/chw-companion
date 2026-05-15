import { describe, it, expect } from 'vitest';
import {
  canProceedToReason,
  initialVisitState,
  visitReducer,
  type VisitState,
} from '../src/lib/visit-state';

describe('visit state machine', () => {
  it('starts on the listen step with no audio or photos', () => {
    expect(initialVisitState.step).toBe('listen');
    expect(initialVisitState.audioUri).toBeNull();
    expect(canProceedToReason(initialVisitState)).toBe(false);
  });

  it('AUDIO_CAPTURED advances to see and records duration', () => {
    const s = visitReducer(initialVisitState, {
      type: 'AUDIO_CAPTURED',
      uri: 'file:///tmp/visit-1.wav',
      seconds: 47.3,
    });
    expect(s.step).toBe('see');
    expect(s.audioUri).toBe('file:///tmp/visit-1.wav');
    expect(s.audioSeconds).toBeCloseTo(47.3, 1);
    expect(canProceedToReason(s)).toBe(false);
  });

  it('all three photos + audio gate canProceedToReason', () => {
    let s: VisitState = visitReducer(initialVisitState, {
      type: 'AUDIO_CAPTURED',
      uri: '/tmp/a.wav',
      seconds: 30,
    });
    s = visitReducer(s, { type: 'PHOTO_CAPTURED', slot: 'face', uri: '/tmp/face.jpg' });
    expect(canProceedToReason(s)).toBe(false);
    s = visitReducer(s, { type: 'PHOTO_CAPTURED', slot: 'ankle', uri: '/tmp/ankle.jpg' });
    expect(canProceedToReason(s)).toBe(false);
    s = visitReducer(s, { type: 'PHOTO_CAPTURED', slot: 'dipstick', uri: '/tmp/dip.jpg' });
    expect(canProceedToReason(s)).toBe(true);
  });

  it('PHOTO_REMOVED un-gates canProceedToReason', () => {
    let s: VisitState = initialVisitState;
    s = visitReducer(s, { type: 'AUDIO_CAPTURED', uri: '/a.wav', seconds: 30 });
    s = visitReducer(s, { type: 'PHOTO_CAPTURED', slot: 'face', uri: '/face.jpg' });
    s = visitReducer(s, { type: 'PHOTO_CAPTURED', slot: 'ankle', uri: '/ankle.jpg' });
    s = visitReducer(s, { type: 'PHOTO_CAPTURED', slot: 'dipstick', uri: '/dip.jpg' });
    expect(canProceedToReason(s)).toBe(true);
    s = visitReducer(s, { type: 'PHOTO_REMOVED', slot: 'ankle' });
    expect(canProceedToReason(s)).toBe(false);
  });

  it('PROCEED_TO_REASON is rejected if gate is unmet', () => {
    const s = visitReducer(initialVisitState, { type: 'PROCEED_TO_REASON' });
    expect(s.step).toBe('listen');
  });

  it('INFERENCE_DONE transitions to result and stores ids', () => {
    const partial: VisitState = {
      ...initialVisitState,
      step: 'reason',
      audioUri: '/a.wav',
      photos: { face: '/f', ankle: '/a', dipstick: '/d' },
    };
    const s = visitReducer(partial, {
      type: 'INFERENCE_DONE',
      visitId: 'v-123',
      ms: 41897,
    });
    expect(s.step).toBe('result');
    expect(s.resultVisitId).toBe('v-123');
    expect(s.inferenceMs).toBe(41897);
  });

  it('INFERENCE_ERROR sets error without changing step', () => {
    const partial: VisitState = { ...initialVisitState, step: 'reason' };
    const s = visitReducer(partial, { type: 'INFERENCE_ERROR', message: 'OOM' });
    expect(s.step).toBe('reason');
    expect(s.error).toBe('OOM');
  });

  it('RESET returns to initialVisitState', () => {
    const messed: VisitState = {
      ...initialVisitState,
      step: 'result',
      resultVisitId: 'x',
      inferenceMs: 42,
      audioUri: '/a',
    };
    expect(visitReducer(messed, { type: 'RESET' })).toEqual(initialVisitState);
  });
});
