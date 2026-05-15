// Minimal event bus. Tools mutate DB state; the UI subscribes to events so it
// can re-query without polling. We deliberately don't use Redux/Zustand here —
// the surface area is small and React state holds the rendered view.

type EventMap = {
  'visit:created': { visitId: string };
  'visit:updated': { visitId: string };
  'visit:completed': { visitId: string; severity: 'clear' | 'watch' | 'urgent' };
  'followup:scheduled': { followupId: string; visitId: string; whenIso: string };
  'sync:state': { pending: number; lastSyncIso: string | null };
  'model:ready': { totalLoadMs: number };
  'model:error': { message: string };
};

type Listener<K extends keyof EventMap> = (payload: EventMap[K]) => void;

const listeners: { [K in keyof EventMap]?: Array<Listener<K>> } = {};

export function emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
  const ls = listeners[event];
  if (!ls) return;
  for (const fn of ls) {
    try {
      fn(payload);
    } catch (e) {
      // Listeners must not crash the emitter.
      console.warn(`[events] listener for ${String(event)} threw:`, e);
    }
  }
}

export function on<K extends keyof EventMap>(event: K, fn: Listener<K>): () => void {
  const ls = (listeners[event] ?? []) as Array<Listener<K>>;
  ls.push(fn);
  listeners[event] = ls as never;
  return () => off(event, fn);
}

export function off<K extends keyof EventMap>(event: K, fn: Listener<K>): void {
  const ls = listeners[event];
  if (!ls) return;
  const idx = (ls as Array<Listener<K>>).indexOf(fn);
  if (idx >= 0) (ls as Array<Listener<K>>).splice(idx, 1);
}

export function clearAllListeners(): void {
  for (const k of Object.keys(listeners)) {
    delete listeners[k as keyof EventMap];
  }
}
