/**
 * Tiny in-memory shim for the slice of op-sqlite we use in tests:
 *   - execute(sql, params) — INSERT / UPDATE / DELETE / SELECT
 *   - executeBatch(batch) — runs each query sequentially
 *
 * Schemas are parsed loosely from CREATE TABLE statements; INSERT/UPDATE/SELECT
 * are pattern-matched. Good enough to cover db.ts's actual queries; if a
 * query escapes this shim, we throw with the SQL so the test fails loudly.
 */
interface Row {
  [k: string]: unknown;
}

interface Table {
  rows: Row[];
  columns: string[];
}

const tables = new Map<string, Table>();

interface ExecResult {
  rows?: Row[];
  rowsAffected?: number;
}

function ensureTable(name: string, cols: string[] = []): Table {
  let t = tables.get(name);
  if (!t) {
    t = { rows: [], columns: cols };
    tables.set(name, t);
  } else if (cols.length && !t.columns.length) {
    t.columns = cols;
  }
  return t;
}

function parseCreate(sql: string): void {
  const m = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)/i);
  if (!m) return;
  ensureTable(m[1]!);
}

function parseInsert(sql: string, params: unknown[]): ExecResult {
  const m = sql.match(/INSERT\s+(?:OR\s+REPLACE\s+)?INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES/i);
  if (!m) throw new Error(`Mock: cannot parse INSERT: ${sql}`);
  const name = m[1]!;
  const cols = m[2]!.split(',').map((c) => c.trim());
  const t = ensureTable(name, cols);
  const row: Row = {};
  cols.forEach((c, i) => {
    row[c] = params[i];
  });
  // OR REPLACE: remove existing with same PK candidate (first col 'id' or 'key')
  const replace = /INSERT\s+OR\s+REPLACE/i.test(sql);
  if (replace) {
    const pkCol = cols.includes('key') ? 'key' : 'id';
    t.rows = t.rows.filter((r) => r[pkCol] !== row[pkCol]);
  }
  t.rows.push(row);
  return { rowsAffected: 1 };
}

function parseUpdate(sql: string, params: unknown[]): ExecResult {
  const m = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+)\s+WHERE\s+(.+)/is);
  if (!m) throw new Error(`Mock: cannot parse UPDATE: ${sql}`);
  const name = m[1]!;
  const setClause = m[2]!;
  const whereClause = m[3]!;
  const setCols = setClause.split(',').map((s) => s.trim().split(/\s*=\s*/)[0]!);
  const whereCol = whereClause.split('=')[0]!.trim();
  const whereVal = params[params.length - 1];
  const t = ensureTable(name);
  let affected = 0;
  for (const row of t.rows) {
    if (row[whereCol] === whereVal) {
      setCols.forEach((c, i) => {
        row[c] = params[i];
      });
      affected++;
    }
  }
  return { rowsAffected: affected };
}

function parseSelect(sql: string, params: unknown[]): ExecResult {
  const m = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER\s+BY.+?)?(?:\s+LIMIT\s+\?)?\s*$/is);
  if (!m) throw new Error(`Mock: cannot parse SELECT: ${sql}`);
  const cols = m[1]!.trim();
  const name = m[2]!;
  const where = m[3];
  const t = tables.get(name);
  if (!t) return { rows: [] };
  let rows = t.rows.slice();
  if (where) {
    // Support: x = ? AND y = ? ... or x IS NULL
    const conds = where.split(/\s+AND\s+/i).map((c) => c.trim());
    let pIdx = 0;
    for (const c of conds) {
      if (/IS\s+NULL$/i.test(c)) {
        const col = c.split(/\s+/)[0]!;
        rows = rows.filter((r) => r[col] == null);
      } else if (c.includes('=')) {
        const col = c.split('=')[0]!.trim();
        const val = params[pIdx++];
        rows = rows.filter((r) => r[col] === val);
      }
    }
  }
  // Handle ORDER BY (simple) — skip; tests don't depend on order
  // Handle LIMIT
  const limitMatch = sql.match(/LIMIT\s+\?/i);
  if (limitMatch) {
    const lim = Number(params[params.length - 1]);
    if (!Number.isNaN(lim)) rows = rows.slice(0, lim);
  }
  // Aggregations: COUNT(*) AS c
  if (/COUNT\s*\(/i.test(cols)) {
    return { rows: [{ c: rows.length }] };
  }
  return { rows };
}

function execOne(sql: string, params: unknown[] = []): ExecResult {
  const trimmed = sql.trim();
  if (/^CREATE/i.test(trimmed)) {
    parseCreate(trimmed);
    return { rowsAffected: 0 };
  }
  if (/^INSERT/i.test(trimmed)) return parseInsert(trimmed, params);
  if (/^UPDATE/i.test(trimmed)) return parseUpdate(trimmed, params);
  if (/^DELETE/i.test(trimmed)) {
    const m = trimmed.match(/DELETE\s+FROM\s+(\w+)/i);
    if (m) {
      const t = tables.get(m[1]!);
      if (t) t.rows = [];
    }
    return { rowsAffected: 0 };
  }
  if (/^SELECT/i.test(trimmed)) return parseSelect(trimmed, params);
  throw new Error(`Mock: unsupported SQL: ${trimmed}`);
}

interface OpenArgs {
  name: string;
  encryptionKey?: string;
}

export type Scalar = string | number | boolean | null | ArrayBuffer | ArrayBufferView;
export type SQLBatchTuple = [string] | [string, Scalar[]] | [string, Scalar[][]];

export function open(_args: OpenArgs) {
  return {
    async execute(sql: string, params: Scalar[] = []): Promise<ExecResult> {
      return execOne(sql, params as unknown[]);
    },
    async executeBatch(batch: SQLBatchTuple[]) {
      for (const item of batch) {
        const [query, params] = item;
        if (Array.isArray(params) && params.length > 0 && Array.isArray(params[0])) {
          for (const row of params as Scalar[][]) execOne(query, row);
        } else {
          execOne(query, (params as Scalar[] | undefined) ?? []);
        }
      }
      return { rowsAffected: 0 };
    },
  };
}

export type DB = ReturnType<typeof open>;

// Test helper — clears all tables between tests.
export function __mockReset(): void {
  for (const t of tables.values()) t.rows = [];
}
