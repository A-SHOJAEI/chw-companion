import { afterEach, describe, expect, it } from 'vitest';
import { __mockState } from './__mocks__/expo-notifications';
import { scheduleFollowupNotification, cancelFollowupNotification } from '../src/lib/notifications';

afterEach(() => __mockState.reset());

describe('local notifications', () => {
  it('schedules a notification with the followup id baked into the identifier', async () => {
    const id = await scheduleFollowupNotification({
      followupId: 'fu-123',
      patientName: 'Fatima',
      whenIso: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      reason: 'Routine ANC',
    });
    expect(id).toBe('followup-fu-123');
    expect(__mockState.getScheduled().length).toBe(1);
  });

  it('clamps past dates to "fire in 5s" rather than dropping the reminder', async () => {
    const id = await scheduleFollowupNotification({
      followupId: 'fu-old',
      patientName: 'Hauwa',
      whenIso: new Date(Date.now() - 60_000).toISOString(),
      reason: 'Late check-in',
    });
    expect(id).not.toBeNull();
  });

  it('cancel removes the schedule', async () => {
    await scheduleFollowupNotification({
      followupId: 'fu-cancel',
      patientName: 'X',
      whenIso: new Date(Date.now() + 86_400_000).toISOString(),
      reason: 'Test',
    });
    await cancelFollowupNotification('fu-cancel');
    expect(__mockState.getScheduled().find(([k]) => k === 'followup-fu-cancel')).toBeUndefined();
  });
});
