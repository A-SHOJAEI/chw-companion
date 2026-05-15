/**
 * Local encrypted SQLite (SQLCipher via op-sqlite). All CHW visit data lives
 * here and never leaves the device unless the user explicitly syncs.
 *
 * Schema is small on purpose:
 *   visits         — one row per home visit
 *   followups      — scheduled return visits
 *   danger_signs   — many-per-visit, flagged by model
 *   sync_queue     — encrypted blobs awaiting upload
 *
 * The encryption passphrase is loaded from expo-secure-store on init; if the
 * device has no key yet, we generate a 32-byte random key. Losing the key
 * loses the data — that's the intended security model.
 */
import { open, type DB, type SQLBatchTuple, type Scalar } from '@op-engineering/op-sqlite';
import * as SecureStore from 'expo-secure-store';
import { emit } from './events';

const DB_NAME = 'chw-companion.db';
const SECURE_KEY_NAME = 'chw.sqlcipher.key';
const SCHEMA_VERSION = 1;

export type Severity = 'clear' | 'watch' | 'urgent';
export type FacilityType =
  | 'home_care'
  | 'health_post'
  | 'district_hospital'
  | 'referral_hospital';

export interface VisitRow {
  id: string;
  patient_name: string;
  gestational_age_weeks: number | null;
  bp_sys: number | null;
  bp_dia: number | null;
  edema_grade: 'none' | 'mild' | 'moderate' | 'pitting' | null;
  proteinuria: 'negative' | 'trace' | '1+' | '2+' | '3+' | '4+' | null;
  severity: Severity | null;
  recommended_action: string | null;
  recommended_facility: FacilityType | null;
  recommended_timeframe_hours: number | null;
  refer_immediately: 0 | 1;
  raw_function_calls_json: string | null;
  audio_seconds: number | null;
  image_count: number;
  created_at: string; // ISO
  updated_at: string;
  synced_at: string | null;
}

export interface DangerSignRow {
  id: string;
  visit_id: string;
  severity: 'info' | 'warning' | 'urgent';
  sign: string;
  protocol_id: string;
  created_at: string;
}

export interface FollowupRow {
  id: string;
  visit_id: string | null;
  patient_name: string;
  due_at: string;
  reason: string;
  completed_at: string | null;
  created_at: string;
}

let dbInstance: DB | null = null;

async function loadOrCreateKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(SECURE_KEY_NAME);
  if (existing) return existing;
  // 32 random bytes -> base64 (sqlcipher accepts an arbitrary passphrase string)
  const bytes = new Uint8Array(32);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Defensive: should never hit on Hermes/RN. Falls back to Math.random.
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const b64 =
    typeof globalThis.btoa === 'function'
      ? globalThis.btoa(String.fromCharCode(...bytes))
      : Buffer.from(bytes).toString('base64');
  await SecureStore.setItemAsync(SECURE_KEY_NAME, b64, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return b64;
}

export async function initDb(): Promise<void> {
  if (dbInstance) return;
  const key = await loadOrCreateKey();
  dbInstance = open({
    name: DB_NAME,
    encryptionKey: key,
  });

  await dbInstance.execute(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const current = await dbInstance.execute(
    'SELECT value FROM schema_meta WHERE key = ?',
    ['version']
  );
  const currentVersion = current.rows?.[0] ? Number(current.rows[0].value) : 0;

  if (currentVersion < 1) {
    await migrateToV1(dbInstance);
    await dbInstance.execute(
      'INSERT OR REPLACE INTO schema_meta (key, value) VALUES (?, ?)',
      ['version', String(SCHEMA_VERSION)]
    );
  }
}

async function migrateToV1(db: DB): Promise<void> {
  const batch: SQLBatchTuple[] = [
    [
      `CREATE TABLE IF NOT EXISTS visits (
        id TEXT PRIMARY KEY,
        patient_name TEXT NOT NULL,
        gestational_age_weeks INTEGER,
        bp_sys INTEGER,
        bp_dia INTEGER,
        edema_grade TEXT,
        proteinuria TEXT,
        severity TEXT,
        recommended_action TEXT,
        recommended_facility TEXT,
        recommended_timeframe_hours INTEGER,
        refer_immediately INTEGER NOT NULL DEFAULT 0,
        raw_function_calls_json TEXT,
        audio_seconds REAL,
        image_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT
      );`,
    ],
    [
      `CREATE TABLE IF NOT EXISTS danger_signs (
        id TEXT PRIMARY KEY,
        visit_id TEXT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
        severity TEXT NOT NULL,
        sign TEXT NOT NULL,
        protocol_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      );`,
    ],
    [
      `CREATE TABLE IF NOT EXISTS followups (
        id TEXT PRIMARY KEY,
        visit_id TEXT REFERENCES visits(id) ON DELETE SET NULL,
        patient_name TEXT NOT NULL,
        due_at TEXT NOT NULL,
        reason TEXT NOT NULL,
        completed_at TEXT,
        created_at TEXT NOT NULL
      );`,
    ],
    [`CREATE INDEX IF NOT EXISTS idx_visits_created ON visits(created_at DESC);`],
    [
      `CREATE INDEX IF NOT EXISTS idx_visits_unsynced
        ON visits(synced_at) WHERE synced_at IS NULL;`,
    ],
    [
      `CREATE INDEX IF NOT EXISTS idx_followups_due
        ON followups(due_at) WHERE completed_at IS NULL;`,
    ],
  ];
  await db.executeBatch(batch);
}

function requireDb(): DB {
  if (!dbInstance) throw new Error('DB not initialized — call initDb() first');
  return dbInstance;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function uuid(): string {
  // RFC4122 v4 via crypto.getRandomValues; falls back to Math.random.
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ---------- Visits ----------

export async function createVisit(input: Partial<VisitRow> & { patient_name: string }): Promise<VisitRow> {
  const db = requireDb();
  const id = input.id ?? uuid();
  const now = nowIso();
  const row: VisitRow = {
    id,
    patient_name: input.patient_name,
    gestational_age_weeks: input.gestational_age_weeks ?? null,
    bp_sys: input.bp_sys ?? null,
    bp_dia: input.bp_dia ?? null,
    edema_grade: input.edema_grade ?? null,
    proteinuria: input.proteinuria ?? null,
    severity: input.severity ?? null,
    recommended_action: input.recommended_action ?? null,
    recommended_facility: input.recommended_facility ?? null,
    recommended_timeframe_hours: input.recommended_timeframe_hours ?? null,
    refer_immediately: input.refer_immediately ?? 0,
    raw_function_calls_json: input.raw_function_calls_json ?? null,
    audio_seconds: input.audio_seconds ?? null,
    image_count: input.image_count ?? 0,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
    synced_at: input.synced_at ?? null,
  };
  await db.execute(
    `INSERT INTO visits (
       id, patient_name, gestational_age_weeks, bp_sys, bp_dia, edema_grade,
       proteinuria, severity, recommended_action, recommended_facility,
       recommended_timeframe_hours, refer_immediately, raw_function_calls_json,
       audio_seconds, image_count, created_at, updated_at, synced_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id, row.patient_name, row.gestational_age_weeks, row.bp_sys, row.bp_dia,
      row.edema_grade, row.proteinuria, row.severity, row.recommended_action,
      row.recommended_facility, row.recommended_timeframe_hours, row.refer_immediately,
      row.raw_function_calls_json, row.audio_seconds, row.image_count,
      row.created_at, row.updated_at, row.synced_at,
    ]
  );
  emit('visit:created', { visitId: id });
  return row;
}

export async function updateVisit(id: string, patch: Partial<VisitRow>): Promise<void> {
  const db = requireDb();
  const fields = Object.keys(patch).filter((k) => k !== 'id') as Array<keyof VisitRow>;
  if (!fields.length) return;
  const sets = fields.map((k) => `${k} = ?`).join(', ');
  const values = fields.map((k) => patch[k] as Scalar);
  await db.execute(
    `UPDATE visits SET ${sets}, updated_at = ? WHERE id = ?`,
    [...values, nowIso(), id]
  );
  emit('visit:updated', { visitId: id });
}

export async function getVisit(id: string): Promise<VisitRow | null> {
  const db = requireDb();
  const r = await db.execute('SELECT * FROM visits WHERE id = ?', [id]);
  return (r.rows?.[0] as unknown as VisitRow | undefined) ?? null;
}

export async function listVisits(limit = 100): Promise<VisitRow[]> {
  const db = requireDb();
  const r = await db.execute(
    'SELECT * FROM visits ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  return (r.rows as unknown as VisitRow[]) ?? [];
}

export async function countVisitsSince(sinceIso: string): Promise<number> {
  const db = requireDb();
  const r = await db.execute(
    'SELECT COUNT(*) AS c FROM visits WHERE created_at >= ?',
    [sinceIso]
  );
  return Number(r.rows?.[0]?.c ?? 0);
}

// ---------- Danger signs ----------

export async function addDangerSign(input: {
  visit_id: string;
  severity: 'info' | 'warning' | 'urgent';
  sign: string;
  protocol_id: string;
}): Promise<DangerSignRow> {
  const db = requireDb();
  const row: DangerSignRow = {
    id: uuid(),
    visit_id: input.visit_id,
    severity: input.severity,
    sign: input.sign,
    protocol_id: input.protocol_id,
    created_at: nowIso(),
  };
  await db.execute(
    `INSERT INTO danger_signs (id, visit_id, severity, sign, protocol_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [row.id, row.visit_id, row.severity, row.sign, row.protocol_id, row.created_at]
  );
  return row;
}

export async function listDangerSigns(visitId: string): Promise<DangerSignRow[]> {
  const db = requireDb();
  const r = await db.execute(
    'SELECT * FROM danger_signs WHERE visit_id = ? ORDER BY created_at ASC',
    [visitId]
  );
  return (r.rows as unknown as DangerSignRow[]) ?? [];
}

// ---------- Followups ----------

export async function createFollowup(input: {
  visit_id?: string | null;
  patient_name: string;
  due_at: string;
  reason: string;
}): Promise<FollowupRow> {
  const db = requireDb();
  const row: FollowupRow = {
    id: uuid(),
    visit_id: input.visit_id ?? null,
    patient_name: input.patient_name,
    due_at: input.due_at,
    reason: input.reason,
    completed_at: null,
    created_at: nowIso(),
  };
  await db.execute(
    `INSERT INTO followups (id, visit_id, patient_name, due_at, reason, completed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.visit_id, row.patient_name, row.due_at, row.reason, row.completed_at, row.created_at]
  );
  emit('followup:scheduled', { followupId: row.id, visitId: row.visit_id ?? '', whenIso: row.due_at });
  return row;
}

export async function listUpcomingFollowups(limit = 50): Promise<FollowupRow[]> {
  const db = requireDb();
  const r = await db.execute(
    `SELECT * FROM followups
     WHERE completed_at IS NULL
     ORDER BY due_at ASC LIMIT ?`,
    [limit]
  );
  return (r.rows as unknown as FollowupRow[]) ?? [];
}

// ---------- Sync helpers ----------

export async function markVisitSynced(id: string): Promise<void> {
  const db = requireDb();
  await db.execute('UPDATE visits SET synced_at = ? WHERE id = ?', [nowIso(), id]);
}

export async function countUnsyncedVisits(): Promise<number> {
  const db = requireDb();
  const r = await db.execute('SELECT COUNT(*) AS c FROM visits WHERE synced_at IS NULL', []);
  return Number(r.rows?.[0]?.c ?? 0);
}

// ---------- Test/dev helpers ----------

export async function _testReset(): Promise<void> {
  if (!dbInstance) return;
  const batch: SQLBatchTuple[] = [
    ['DELETE FROM danger_signs'],
    ['DELETE FROM followups'],
    ['DELETE FROM visits'],
  ];
  await dbInstance.executeBatch(batch);
}

export function _testInjectDb(injected: DB): void {
  dbInstance = injected;
}

export function _testClearDb(): void {
  dbInstance = null;
}
