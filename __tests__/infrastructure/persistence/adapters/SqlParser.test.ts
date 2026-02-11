/**
 * SqlParser unit tests
 *
 * Tests the lightweight SQL-to-operation translator against
 * all SQL patterns used in the codebase.
 *
 * @security No PII in tests.
 */

import { parseSql } from '../../../../src/infrastructure/persistence/adapters/SqlParser';

describe('SqlParser', () => {
  describe('CREATE TABLE', () => {
    it('parses CREATE TABLE IF NOT EXISTS', () => {
      const result = parseSql(
        'CREATE TABLE IF NOT EXISTS patients (id TEXT PRIMARY KEY, name TEXT)',
      );
      expect(result).not.toBeNull();
      expect(result!.type).toBe('CREATE_TABLE');
      expect(result!.table).toBe('patients');
    });
  });

  describe('CREATE INDEX', () => {
    it('parses CREATE INDEX IF NOT EXISTS', () => {
      const result = parseSql(
        'CREATE INDEX IF NOT EXISTS idx_answers_patient ON answers (patient_id)',
      );
      expect(result).not.toBeNull();
      expect(result!.type).toBe('CREATE_INDEX');
      expect(result!.table).toBe('answers');
    });
  });

  describe('INSERT OR REPLACE', () => {
    it('parses basic INSERT OR REPLACE', () => {
      const result = parseSql('INSERT OR REPLACE INTO patients (id, name, email) VALUES (?, ?, ?)');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('INSERT');
      expect(result!.table).toBe('patients');
      expect(result!.columns).toEqual(['id', 'name', 'email']);
      expect(result!.values).toEqual([0, 1, 2]);
    });

    it('parses INSERT with trailing semicolon', () => {
      const result = parseSql('INSERT OR REPLACE INTO patients (id, name) VALUES (?, ?);');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('INSERT');
      expect(result!.columns).toEqual(['id', 'name']);
    });

    it('parses INSERT with extra whitespace', () => {
      const result = parseSql(
        '  INSERT OR REPLACE INTO   questionnaires  (id, title, template_id)  VALUES (?, ?, ?)  ',
      );
      expect(result).not.toBeNull();
      expect(result!.type).toBe('INSERT');
      expect(result!.table).toBe('questionnaires');
      expect(result!.columns).toEqual(['id', 'title', 'template_id']);
    });

    it('handles literal default values with -1 index', () => {
      const result = parseSql(
        "INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('version', ?)",
      );
      expect(result).not.toBeNull();
      expect(result!.type).toBe('INSERT');
      expect(result!.table).toBe('db_metadata');
      expect(result!.columns).toEqual(['key', 'value']);
      // first column is a literal -> -1, second is a param -> 0
      expect(result!.values).toEqual([-1, 0]);
    });
  });

  describe('UPDATE', () => {
    it('parses UPDATE SET WHERE with single condition', () => {
      const result = parseSql('UPDATE patients SET name = ?, email = ? WHERE id = ?');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('UPDATE');
      expect(result!.table).toBe('patients');
      expect(result!.setClauses).toEqual([
        { column: 'name', paramIndex: 0 },
        { column: 'email', paramIndex: 1 },
      ]);
      expect(result!.where).toEqual([{ column: 'id', operator: '=', paramIndex: 2 }]);
    });

    it('parses UPDATE with multiple WHERE conditions', () => {
      const result = parseSql(
        'UPDATE answers SET value = ? WHERE patient_id = ? AND question_id = ?',
      );
      expect(result).not.toBeNull();
      expect(result!.type).toBe('UPDATE');
      expect(result!.setClauses).toEqual([{ column: 'value', paramIndex: 0 }]);
      expect(result!.where).toHaveLength(2);
    });
  });

  describe('SELECT', () => {
    it('parses SELECT *', () => {
      const result = parseSql('SELECT * FROM patients');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('SELECT');
      expect(result!.table).toBe('patients');
      expect(result!.columns).toEqual(['*']);
    });

    it('parses SELECT * WHERE id = ?', () => {
      const result = parseSql('SELECT * FROM patients WHERE id = ?');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('SELECT');
      expect(result!.where).toEqual([{ column: 'id', operator: '=', paramIndex: 0 }]);
    });

    it('parses SELECT * with LIKE', () => {
      const result = parseSql('SELECT * FROM questions WHERE metadata_json LIKE ?');
      expect(result).not.toBeNull();
      expect(result!.where).toEqual([{ column: 'metadata_json', operator: 'LIKE', paramIndex: 0 }]);
    });

    it('parses SELECT * with IS NULL', () => {
      const result = parseSql('SELECT * FROM gdpr_consents WHERE revoked_at IS NULL');
      expect(result).not.toBeNull();
      expect(result!.where).toEqual([
        { column: 'revoked_at', operator: 'IS NULL', paramIndex: -1 },
      ]);
    });

    it('parses SELECT * with IS NOT NULL', () => {
      const result = parseSql('SELECT * FROM gdpr_consents WHERE revoked_at IS NOT NULL');
      expect(result).not.toBeNull();
      expect(result!.where).toEqual([
        { column: 'revoked_at', operator: 'IS NOT NULL', paramIndex: -1 },
      ]);
    });

    it('parses SELECT with ORDER BY', () => {
      const result = parseSql('SELECT * FROM patients ORDER BY name ASC');
      expect(result).not.toBeNull();
      expect(result!.orderBy).toEqual([{ column: 'name', direction: 'ASC' }]);
    });

    it('parses SELECT with ORDER BY DESC', () => {
      const result = parseSql('SELECT * FROM documents ORDER BY created_at DESC');
      expect(result).not.toBeNull();
      expect(result!.orderBy).toEqual([{ column: 'created_at', direction: 'DESC' }]);
    });

    it('parses SELECT with LIMIT', () => {
      const result = parseSql('SELECT * FROM patients LIMIT 10');
      expect(result).not.toBeNull();
      expect(result!.limit).toBe(10);
    });

    it('parses SELECT with WHERE + ORDER BY + LIMIT', () => {
      const result = parseSql(
        'SELECT * FROM documents WHERE patient_id = ? ORDER BY created_at DESC LIMIT 5',
      );
      expect(result).not.toBeNull();
      expect(result!.where).toHaveLength(1);
      expect(result!.orderBy).toHaveLength(1);
      expect(result!.limit).toBe(5);
    });

    it('parses COUNT(*) aggregate', () => {
      const result = parseSql('SELECT COUNT(*) as total FROM patients');
      expect(result).not.toBeNull();
      expect(result!.aggregate).toEqual({
        fn: 'COUNT',
        column: '*',
        alias: 'total',
      });
    });

    it('parses named column projection', () => {
      const result = parseSql('SELECT id, name FROM patients');
      expect(result).not.toBeNull();
      expect(result!.columns).toEqual(['id', 'name']);
    });

    it('parses multiple AND conditions in WHERE', () => {
      const result = parseSql(
        'SELECT * FROM answers WHERE patient_id = ? AND questionnaire_id = ? AND question_id = ?',
      );
      expect(result).not.toBeNull();
      expect(result!.where).toHaveLength(3);
      expect(result!.where[0].paramIndex).toBe(0);
      expect(result!.where[1].paramIndex).toBe(1);
      expect(result!.where[2].paramIndex).toBe(2);
    });
  });

  describe('DELETE', () => {
    it('parses DELETE FROM without WHERE (full table clear)', () => {
      const result = parseSql('DELETE FROM patients');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('DELETE');
      expect(result!.table).toBe('patients');
      expect(result!.where).toEqual([]);
    });

    it('parses DELETE FROM with WHERE', () => {
      const result = parseSql('DELETE FROM patients WHERE id = ?');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('DELETE');
      expect(result!.where).toEqual([{ column: 'id', operator: '=', paramIndex: 0 }]);
    });

    it('parses DELETE with multiple WHERE conditions', () => {
      const result = parseSql('DELETE FROM answers WHERE patient_id = ? AND question_id = ?');
      expect(result).not.toBeNull();
      expect(result!.where).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('returns null for unrecognised SQL', () => {
      expect(parseSql('DROP TABLE patients')).toBeNull();
      expect(parseSql('ALTER TABLE patients ADD COLUMN age INTEGER')).toBeNull();
      expect(parseSql('')).toBeNull();
      expect(parseSql('not sql at all')).toBeNull();
    });

    it('is case-insensitive', () => {
      const result = parseSql('select * from PATIENTS where ID = ?');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('SELECT');
      expect(result!.table).toBe('PATIENTS');
    });

    it('handles multi-line SQL', () => {
      const sql = `
        INSERT OR REPLACE INTO patients
          (id, name, email)
        VALUES
          (?, ?, ?)
      `;
      const result = parseSql(sql);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('INSERT');
      expect(result!.columns).toEqual(['id', 'name', 'email']);
    });
  });
});
