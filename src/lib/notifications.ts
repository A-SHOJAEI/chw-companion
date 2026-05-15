/**
 * Local notifications. Used to fire reminders for `schedule_followup`.
 *
 * Why local-only:
 *   - We don't run a server (offline-first product)
 *   - Push tokens would require a Firebase / APNs project + a network
 *   - The CHW's phone is the source of truth; reminders fire from there
 *
 * On Android 13+ this requires POST_NOTIFICATIONS at runtime.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const FOLLOWUP_CHANNEL = 'followups';

let permissionsReady = false;

export async function ensureNotificationsReady(): Promise<boolean> {
  if (permissionsReady) return true;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(FOLLOWUP_CHANNEL, {
      name: 'Follow-up reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 200, 200],
      lightColor: '#C9532A',
    });
  }
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) {
    permissionsReady = true;
    return true;
  }
  const ask = await Notifications.requestPermissionsAsync();
  permissionsReady = !!ask.granted;
  return permissionsReady;
}

export interface ScheduleArgs {
  followupId: string;
  patientName: string;
  whenIso: string;
  reason: string;
}

export async function scheduleFollowupNotification({
  followupId,
  patientName,
  whenIso,
  reason,
}: ScheduleArgs): Promise<string | null> {
  const ok = await ensureNotificationsReady();
  if (!ok) return null;
  const date = new Date(whenIso);
  if (Number.isNaN(date.getTime())) return null;
  const now = Date.now();
  // Notifications can't be scheduled in the past — fire immediately if so.
  const triggerDate = date.getTime() > now ? date : new Date(now + 5000);

  const identifier = await Notifications.scheduleNotificationAsync({
    identifier: `followup-${followupId}`,
    content: {
      title: `Follow-up: ${patientName}`,
      body: reason,
      data: { followupId },
      sound: 'default',
      categoryIdentifier: FOLLOWUP_CHANNEL,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: FOLLOWUP_CHANNEL,
    },
  });
  return identifier;
}

export async function cancelFollowupNotification(followupId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`followup-${followupId}`).catch(() => undefined);
}
