/**
 * Key-Value SQL Executor
 *
 * Executes parsed SQL operations against an in-memory table store.
 * This is the shared engine used by both IndexedDBAdapter and AsyncStorageAdapter.
 *
 * The store is a Map<tableName, Map<primaryKey, Record<string, unknown>>>.
 * Each table's primary key is always the 'id' column (or 'key' for db_metadata).
 *
 * @security No PII processed. Operates on structure only.
 */

import type { AdapterResultSet } from './IDatabaseAdapter';
import type { ParsedSql, WhereClause } from './SqlParser';

/**
 * A table is a Map from primary key to row object.
 */
export type TableStore = Map<string, Record<string, unknown>>;

/**
 * The full store: table name → TableStore.
 */
export type KVStore = Map<string, TableStore>;

/**
 * Tables where the primary key column is 'key' instead of 'id'.
 */
const KEY_PK_TABLES = new Set(['db_metadata']);

function getPkColumn(table: string): string {
  return KEY_PK_TABLES.has(table) ? 'key' : 'id';
}

/**
 * Ensure a table exists in the store.
 */
function ensureTable(store: KVStore, table: string): TableStore {
  let t = store.get(table);
  if (!t) {
    t = new Map();
    store.set(table, t);
  }
  return t;
}

/**
 * Build a result set from an array of rows.
 */
function makeResult(
  rows: Record<string, unknown>[],
  rowsAffected = 0,
  insertId?: number,
): AdapterResultSet {
  return {
    rows: {
      length: rows.length,
      item: (index: number) => (index >= 0 && index < rows.length ? rows[index] : null),
      raw: () => [...rows],
    },
    rowsAffected,
    insertId,
  };
}

/**
 * Check if a row matches all WHERE clauses.
 */
function matchesWhere(
  row: Record<string, unknown>,
  where: WhereClause[],
  params: unknown[],
): boolean {
  for (const w of where) {
    const rowValue = row[w.column];
    switch (w.operator) {
      case '=': {
        const paramValue = params[w.paramIndex];
        // eslint-disable-next-line eqeqeq
        if (rowValue != paramValue && String(rowValue) !== String(paramValue)) return false;
        break;
      }
      case 'LIKE': {
        const pattern = String(params[w.paramIndex]);
        const regex = new RegExp('^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i');
        if (!regex.test(String(rowValue ?? ''))) return false;
        break;
      }
      case 'IS NULL':
        if (rowValue !== null && rowValue !== undefined) return false;
        break;
      case 'IS NOT NULL':
        if (rowValue === null || rowValue === undefined) return false;
        break;
    }
  }
  return true;
}

/**
 * Sort rows by ORDER BY clauses.
 */
function applyOrderBy(
  rows: Record<string, unknown>[],
  orderBy: { column: string; direction: 'ASC' | 'DESC' }[],
): Record<string, unknown>[] {
  if (orderBy.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const ob of orderBy) {
      const av = a[ob.column];
      const bv = b[ob.column];
      let cmp = 0;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        cmp = String(av ?? '').localeCompare(String(bv ?? ''));
      }
      if (cmp !== 0) return ob.direction === 'DESC' ? -cmp : cmp;
    }
    return 0;
  });
}

/**
 * Execute a parsed SQL operation against the KV store.
 */
export function executeOnStore(
  store: KVStore,
  parsed: ParsedSql,
  params: unknown[],
): AdapterResultSet {
  const table = ensureTable(store, parsed.table);
  const pkCol = getPkColumn(parsed.table);

  switch (parsed.type) {
    case 'CREATE_TABLE':
    case 'CREATE_INDEX':
      // Schema operations are no-ops for KV stores (tables are created on first write)
      return makeResult([]);

    case 'INSERT': {
      // Build row from columns + params
      const row: Record<string, unknown> = {};
      for (let i = 0; i < parsed.columns.length; i++) {
        const col = parsed.columns[i];
        const valIdx = parsed.values[i];
        row[col] = valIdx >= 0 ? params[valIdx] : null;
      }
      const pk = String(row[pkCol] ?? '');
      table.set(pk, row);
      return makeResult([], 1);
    }

    case 'UPDATE': {
      let affected = 0;
      for (const row of table.values()) {
        if (matchesWhere(row, parsed.where, params)) {
          for (const sc of parsed.setClauses) {
            row[sc.column] = params[sc.paramIndex];
          }
          affected++;
        }
      }
      return makeResult([], affected);
    }

    case 'SELECT': {
      // Filter
      let rows = Array.from(table.values());
      if (parsed.where.length > 0) {
        rows = rows.filter(r => matchesWhere(r, parsed.where, params));
      }

      // Aggregate: COUNT or SUM or complex CASE
      if (parsed.aggregate) {
        if (parsed.caseExpressions.length > 0) {
          // Complex aggregate with CASE expressions (e.g., GDPR statistics)
          const resultRow: Record<string, unknown> = {
            [parsed.aggregate.alias]: rows.length,
          };
          for (const ce of parsed.caseExpressions) {
            let sum = 0;
            for (const r of rows) {
              let matches = true;
              for (const cond of ce.conditions) {
                if (cond.isNull === true) {
                  if (r[cond.column] !== null && r[cond.column] !== undefined) {
                    matches = false;
                    break;
                  }
                } else if (cond.isNull === false) {
                  if (r[cond.column] === null || r[cond.column] === undefined) {
                    matches = false;
                    break;
                  }
                } else {
                  // Use strict equality with numeric fallback
                  if (
                    r[cond.column] !== cond.value &&
                    Number(r[cond.column]) !== Number(cond.value)
                  ) {
                    matches = false;
                    break;
                  }
                }
              }
              if (matches) sum++;
            }
            resultRow[ce.alias] = sum;
          }
          return makeResult([resultRow]);
        }

        if (parsed.aggregate.fn === 'COUNT') {
          return makeResult([{ [parsed.aggregate.alias]: rows.length }]);
        }
        if (parsed.aggregate.fn === 'SUM') {
          let total = 0;
          for (const r of rows) {
            const v = Number(r[parsed.aggregate.column] ?? 0);
            if (Number.isFinite(v)) total += v;
          }
          return makeResult([{ [parsed.aggregate.alias]: total }]);
        }
      }

      // Order
      rows = applyOrderBy(rows, parsed.orderBy);

      // Limit
      if (parsed.limit !== null) {
        rows = rows.slice(0, parsed.limit);
      }

      // Project columns
      if (parsed.columns.length > 0 && parsed.columns[0] !== '*') {
        rows = rows.map(r => {
          const projected: Record<string, unknown> = {};
          for (const col of parsed.columns) {
            projected[col] = r[col];
          }
          return projected;
        });
      }

      return makeResult(rows);
    }

    case 'DELETE': {
      if (parsed.where.length === 0) {
        // DELETE all
        const count = table.size;
        table.clear();
        return makeResult([], count);
      }
      let affected = 0;
      const keysToDelete: string[] = [];
      for (const [key, row] of table.entries()) {
        if (matchesWhere(row, parsed.where, params)) {
          keysToDelete.push(key);
          affected++;
        }
      }
      for (const k of keysToDelete) {
        table.delete(k);
      }
      return makeResult([], affected);
    }

    default:
      return makeResult([]);
  }
}

/**
 * List of application tables (order matters for deleteAllData — FK constraints).
 */
export const APP_TABLES = [
  'gdpr_consents',
  'answers',
  'documents',
  'questionnaires',
  'patients',
  'questions',
  'db_metadata',
] as const;
