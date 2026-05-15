/**
 * State machine for a visit. The screen is sequential: Listen -> See -> Reason.
 * Each step has a "done" gate; the user can't skip ahead.
 */
import { useReducer } from 'react';

export type Step = 'listen' | 'see' | 'reason' | 'result';

export interface VisitState {
  step: Step;
  audioUri: string | null;
  audioSeconds: number;
  photos: {
    face: string | null;
    ankle: string | null;
    dipstick: string | null;
  };
  inferenceMs: number | null;
  resultVisitId: string | null;
  error: string | null;
}

export type VisitEvent =
  | { type: 'AUDIO_CAPTURED'; uri: string; seconds: number }
  | { type: 'PHOTO_CAPTURED'; slot: keyof VisitState['photos']; uri: string }
  | { type: 'PHOTO_REMOVED'; slot: keyof VisitState['photos'] }
  | { type: 'PROCEED_TO_REASON' }
  | { type: 'INFERENCE_DONE'; visitId: string; ms: number }
  | { type: 'INFERENCE_ERROR'; message: string }
  | { type: 'RESET' };

export const initialVisitState: VisitState = {
  step: 'listen',
  audioUri: null,
  audioSeconds: 0,
  photos: { face: null, ankle: null, dipstick: null },
  inferenceMs: null,
  resultVisitId: null,
  error: null,
};

export function visitReducer(state: VisitState, event: VisitEvent): VisitState {
  switch (event.type) {
    case 'AUDIO_CAPTURED':
      return {
        ...state,
        audioUri: event.uri,
        audioSeconds: event.seconds,
        step: 'see',
        error: null,
      };
    case 'PHOTO_CAPTURED':
      return {
        ...state,
        photos: { ...state.photos, [event.slot]: event.uri },
        error: null,
      };
    case 'PHOTO_REMOVED':
      return {
        ...state,
        photos: { ...state.photos, [event.slot]: null },
      };
    case 'PROCEED_TO_REASON':
      if (!canProceedToReason(state)) return state;
      return { ...state, step: 'reason', error: null };
    case 'INFERENCE_DONE':
      return {
        ...state,
        step: 'result',
        resultVisitId: event.visitId,
        inferenceMs: event.ms,
        error: null,
      };
    case 'INFERENCE_ERROR':
      return { ...state, error: event.message };
    case 'RESET':
      return initialVisitState;
  }
}

export function canProceedToReason(state: VisitState): boolean {
  if (!state.audioUri) return false;
  return Object.values(state.photos).every((p) => !!p);
}

export function useVisitMachine() {
  return useReducer(visitReducer, initialVisitState);
}
