const pool = require('../config/database');
const { HttpError, parseId, validateInput } = require('../utils/helpers');

function createResourceController({
  table,
  fields,
  requiredFields = [],
  returning,
  orderBy = 'id',
  updatedAt = false,
  prepare = async (input) => input
}) {
  const allowedFields = Object.keys(fields);
  const columns = returning.join(', ');

  return {
    list: async (req, res) => {
      const { rows } = await pool.query(
        `SELECT ${columns} FROM ${table} ORDER BY ${orderBy} DESC`
      );
      res.json(rows);
    },

    get: async (req, res) => {
      const id = parseId(req.params.id);
      const { rows } = await pool.query(
        `SELECT ${columns} FROM ${table} WHERE id = $1`,
        [id]
      );

      if (rows.length === 0) {
        throw new HttpError(404, 'Record not found');
      }

      res.json(rows[0]);
    },

    create: async (req, res) => {
      const input = validateInput(req.body, allowedFields, requiredFields);
      const prepared = await prepare(input, 'create');
      const entries = Object.entries(prepared);
      const columnNames = entries.map(([field]) => fields[field]);
      const values = entries.map(([, value]) => value);
      const placeholders = values.map((_, index) => `$${index + 1}`);
      const { rows } = await pool.query(
        `INSERT INTO ${table} (${columnNames.join(', ')}) ` +
          `VALUES (${placeholders.join(', ')}) RETURNING ${columns}`,
        values
      );

      res.status(201).json(rows[0]);
    },

    update: async (req, res) => {
      const id = parseId(req.params.id);
      const input = validateInput(req.body, allowedFields);
      const prepared = await prepare(input, 'update');
      const entries = Object.entries(prepared);
      const assignments = entries.map(
        ([field], index) => `${fields[field]} = $${index + 1}`
      );
      if (updatedAt) {
        assignments.push('updated_at = NOW()');
      }
      const values = entries.map(([, value]) => value);
      values.push(id);
      const { rows } = await pool.query(
        `UPDATE ${table} SET ${assignments.join(', ')} ` +
          `WHERE id = $${values.length} RETURNING ${columns}`,
        values
      );

      if (rows.length === 0) {
        throw new HttpError(404, 'Record not found');
      }

      res.json(rows[0]);
    },

    remove: async (req, res) => {
      const id = parseId(req.params.id);
      const { rowCount } = await pool.query(
        `DELETE FROM ${table} WHERE id = $1`,
        [id]
      );

      if (rowCount === 0) {
        throw new HttpError(404, 'Record not found');
      }

      res.status(204).end();
    }
  };
}

module.exports = createResourceController;
