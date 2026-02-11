/**
 * SQL-to-KV Translator
 *
 * Lightweight parser that converts the subset of SQL used by the app's
 * repositories into structured operations that can be executed against
 * key-value stores (IndexedDB, AsyncStorage).
 *
 * ONLY supports the exact SQL patterns used in the codebase:
 * - CREATE TABLE IF NOT EXISTS ... (ignored — schema is implicit)
 * - CREATE INDEX IF NOT EXISTS ... (ignored — indices are in-memory)
 * - INSERT OR REPLACE INTO table (...) VALUES (?, ?, ...)
 * - UPDATE table SET col=?, ... WHERE col=? [AND col=?]
 * - SELECT * | col | COUNT(*) | SUM(...) FROM table [WHERE ...] [ORDER BY ...] [LIMIT n]
 * - DELETE FROM table [WHERE col=? [AND col=?]]
 *
 * NOT a general SQL parser. Intentionally minimal and conservative.
 *
 * @security No PII processed. Operates on structure only.
 */

export type SqlOpType =
  | 'CREATE_TABLE'
  | 'CREATE_INDEX'
  | 'INSERT'
  | 'UPDATE'
  | 'SELECT'
  | 'DELETE'
  | 'INSERT_METADATA';

export interface WhereClause {
  column: string;
  operator: '=' | 'LIKE' | 'IS NULL' | 'IS NOT NULL';
  paramIndex: number; // index into params array (-1 for IS NULL / IS NOT NULL)
}

export interface OrderByClause {
  column: string;
  direction: 'ASC' | 'DESC';
}

export interface ParsedSql {
  type: SqlOpType;
  table: string;
  columns: string[]; // INSERT/UPDATE: column names; SELECT: projected columns or ['*']
  values: number[]; // INSERT: indices into params for each column
  setClauses: { column: string; paramIndex: number }[]; // UPDATE: SET assignments
  where: WhereClause[];
  orderBy: OrderByClause[];
  limit: number | null;
  aggregate: null | { fn: 'COUNT' | 'SUM'; column: string; alias: string };
  caseExpressions: {
    alias: string;
    conditions: { column: string; value: unknown; isNull?: boolean }[];
  }[];
}

function createEmpty(type: SqlOpType, table: string): ParsedSql {
  return {
    type,
    table,
    columns: [],
    values: [],
    setClauses: [],
    where: [],
    orderBy: [],
    limit: null,
    aggregate: null,
    caseExpressions: [],
  };
}

/**
 * Normalise SQL for easier parsing: collapse whitespace, trim semicolons.
 */
function normalise(sql: string): string {
  return sql.replace(/\s+/g, ' ').replace(/;\s*$/, '').trim();
}

/**
 * Parse CREATE TABLE — we extract the table name only.
 */
function parseCreate(norm: string): ParsedSql | null {
  const tableMatch = norm.match(/^CREATE TABLE IF NOT EXISTS (\w+)/i);
  if (tableMatch) return createEmpty('CREATE_TABLE', tableMatch[1]);

  const idxMatch = norm.match(/^CREATE INDEX IF NOT EXISTS \w+ ON (\w+)/i);
  if (idxMatch) return createEmpty('CREATE_INDEX', idxMatch[1]);

  return null;
}

/**
 * Parse INSERT OR REPLACE INTO table (cols) VALUES (placeholders).
 */
function parseInsert(norm: string): ParsedSql | null {
  const m = norm.match(/^INSERT OR REPLACE INTO (\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (!m) return null;

  const table = m[1];
  const columns = m[2].split(',').map(c => c.trim());
  // Build param index array: each ? gets sequential index
  const placeholders = m[3].split(',').map(p => p.trim());
  const values: number[] = [];
  let paramIdx = 0;
  for (const p of placeholders) {
    if (p === '?') {
      values.push(paramIdx++);
    } else {
      // literal default value — mark as -1
      values.push(-1);
    }
  }

  const result = createEmpty('INSERT', table);
  result.columns = columns;
  result.values = values;
  return result;
}

/**
 * Parse UPDATE table SET col=?, ... WHERE col=? [AND col=?].
 */
function parseUpdate(norm: string): ParsedSql | null {
  const m = norm.match(/^UPDATE (\w+) SET (.+?) WHERE (.+)$/i);
  if (!m) return null;

  const table = m[1];
  const setPart = m[2];
  const wherePart = m[3];

  const result = createEmpty('UPDATE', table);
  let paramIdx = 0;

  // Parse SET clauses
  const setCols = setPart.split(',').map(s => s.trim());
  for (const sc of setCols) {
    const eqMatch = sc.match(/^(\w+)\s*=\s*\?$/);
    if (eqMatch) {
      result.setClauses.push({ column: eqMatch[1], paramIndex: paramIdx++ });
    }
  }

  // Parse WHERE
  parseWhereClauses(wherePart, result, paramIdx);

  return result;
}

/**
 * Parse SELECT ... FROM table [WHERE ...] [ORDER BY ...] [LIMIT n].
 */
function parseSelect(norm: string): ParsedSql | null {
  const m = norm.match(
    /^SELECT (.+?) FROM (\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i,
  );
  if (!m) return null;

  const selectPart = m[1].trim();
  const table = m[2];
  const wherePart = m[3] || null;
  const orderPart = m[4] || null;
  const limitPart = m[5] || null;

  const result = createEmpty('SELECT', table);

  // Parse select columns / aggregates
  if (selectPart === '*') {
    result.columns = ['*'];
  } else if (/^COUNT\(\*\)\s+as\s+(\w+)/i.test(selectPart)) {
    const am = selectPart.match(/^COUNT\(\*\)\s+as\s+(\w+)/i)!;
    result.aggregate = { fn: 'COUNT', column: '*', alias: am[1] };
  } else if (/^SUM\((\w+)\)\s+as\s+(\w+)/i.test(selectPart)) {
    const am = selectPart.match(/^SUM\((\w+)\)\s+as\s+(\w+)/i)!;
    result.aggregate = { fn: 'SUM', column: am[1], alias: am[2] };
  } else if (/COUNT\(\*\)\s+as\s+\w+.*SUM\s*\(/i.test(selectPart)) {
    // Complex aggregate with CASE expressions (GDPR statistics)
    // Parse the COUNT(*) as total part
    const countMatch = selectPart.match(/COUNT\(\*\)\s+as\s+(\w+)/i);
    if (countMatch) {
      result.aggregate = { fn: 'COUNT', column: '*', alias: countMatch[1] };
    }
    // Parse SUM(CASE ...) patterns
    const caseRegex = /SUM\(CASE WHEN (.+?) THEN 1 ELSE 0 END\)\s+as\s+(\w+)/gi;
    let cm;
    while ((cm = caseRegex.exec(selectPart)) !== null) {
      const conditions: { column: string; value: unknown; isNull?: boolean }[] = [];
      const condStr = cm[1];
      // Parse simple "col = val AND col2 IS [NOT] NULL" conditions
      const parts = condStr.split(/\s+AND\s+/i);
      for (const part of parts) {
        const eqMatch = part.trim().match(/^(\w+)\s*=\s*(\d+)$/);
        if (eqMatch) {
          conditions.push({ column: eqMatch[1], value: Number(eqMatch[2]) });
        }
        const nullMatch = part.trim().match(/^(\w+)\s+IS\s+NULL$/i);
        if (nullMatch) {
          conditions.push({ column: nullMatch[1], value: null, isNull: true });
        }
        const notNullMatch = part.trim().match(/^(\w+)\s+IS\s+NOT\s+NULL$/i);
        if (notNullMatch) {
          conditions.push({ column: notNullMatch[1], value: null, isNull: false });
        }
      }
      result.caseExpressions.push({ alias: cm[2], conditions });
    }
  } else {
    // Named columns
    result.columns = selectPart.split(',').map(c => c.trim());
  }

  // Parse WHERE
  if (wherePart) {
    parseWhereClauses(wherePart, result, 0);
  }

  // Parse ORDER BY
  if (orderPart) {
    const orderItems = orderPart.split(',').map(o => o.trim());
    for (const item of orderItems) {
      const om = item.match(/^(\w+)(?:\s+(ASC|DESC))?$/i);
      if (om) {
        result.orderBy.push({
          column: om[1],
          direction: (om[2]?.toUpperCase() as 'ASC' | 'DESC') || 'ASC',
        });
      }
    }
  }

  // Parse LIMIT
  if (limitPart) {
    result.limit = parseInt(limitPart, 10);
  }

  return result;
}

/**
 * Parse DELETE FROM table [WHERE ...].
 */
function parseDelete(norm: string): ParsedSql | null {
  const m = norm.match(/^DELETE FROM (\w+)(?:\s+WHERE\s+(.+))?$/i);
  if (!m) return null;

  const result = createEmpty('DELETE', m[1]);
  if (m[2]) {
    parseWhereClauses(m[2], result, 0);
  }
  return result;
}

/**
 * Parse WHERE clauses into the result.
 */
function parseWhereClauses(wherePart: string, result: ParsedSql, startParamIdx: number): void {
  const parts = wherePart.split(/\s+AND\s+/i);
  let paramIdx = startParamIdx;

  for (const part of parts) {
    const trimmed = part.trim();

    // col = ?
    const eqMatch = trimmed.match(/^(\w+)\s*=\s*\?$/);
    if (eqMatch) {
      result.where.push({ column: eqMatch[1], operator: '=', paramIndex: paramIdx++ });
      continue;
    }

    // col LIKE ?
    const likeMatch = trimmed.match(/^(\w+)\s+LIKE\s+\?$/i);
    if (likeMatch) {
      result.where.push({ column: likeMatch[1], operator: 'LIKE', paramIndex: paramIdx++ });
      continue;
    }

    // col IS NULL
    const nullMatch = trimmed.match(/^(\w+)\s+IS\s+NULL$/i);
    if (nullMatch) {
      result.where.push({ column: nullMatch[1], operator: 'IS NULL', paramIndex: -1 });
      continue;
    }

    // col IS NOT NULL
    const notNullMatch = trimmed.match(/^(\w+)\s+IS\s+NOT\s+NULL$/i);
    if (notNullMatch) {
      result.where.push({ column: notNullMatch[1], operator: 'IS NOT NULL', paramIndex: -1 });
      continue;
    }
  }
}

/**
 * Parse a SQL statement into a structured operation.
 * Returns null if the SQL is not recognized.
 */
export function parseSql(sql: string): ParsedSql | null {
  const norm = normalise(sql);

  if (/^CREATE\s+(TABLE|INDEX)/i.test(norm)) {
    return parseCreate(norm);
  }
  if (/^INSERT\s+OR\s+REPLACE/i.test(norm)) {
    return parseInsert(norm);
  }
  if (/^UPDATE\s/i.test(norm)) {
    return parseUpdate(norm);
  }
  if (/^SELECT\s/i.test(norm)) {
    return parseSelect(norm);
  }
  if (/^DELETE\s/i.test(norm)) {
    return parseDelete(norm);
  }

  return null;
}
