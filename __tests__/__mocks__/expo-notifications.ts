// Mock — tests don't fire real notifications.
export enum AndroidImportance { DEFAULT = 3, HIGH = 4 }
export enum SchedulableTriggerInputTypes { DATE = 'date' }

const scheduled = new Map<string, unknown>();

export function setNotificationHandler(_h: unknown): void {}
export async function setNotificationChannelAsync(_n: string, _o: unknown): Promise<void> {}
export async function getPermissionsAsync() {
  return { granted: true, status: 'granted' };
}
export async function requestPermissionsAsync() {
  return { granted: true, status: 'granted' };
}
export async function scheduleNotificationAsync(opts: { identifier?: string; content: unknown; trigger: unknown }): Promise<string> {
  const id = opts.identifier ?? `n-${scheduled.size}`;
  scheduled.set(id, opts);
  return id;
}
export async function cancelScheduledNotificationAsync(id: string): Promise<void> {
  scheduled.delete(id);
}

export const __mockState = {
  getScheduled: () => Array.from(scheduled.entries()),
  reset: () => scheduled.clear(),
};
