const { isArray, chunk } = require('lodash');

class Repository {
  /**
   * Creates a repository instance for persisting NALD data to the database
   * @param {Object} pool - Postgres pool instance
   * @param {Object} config - configuration
   * @param {String} config.table - the Postgres table name
   * @param {Object} config.upsert - upsert configuration
   * @param {Array} config.upsert.fields - the field(s) to detect conflict on
   * @param {Array} config.upsert.set - the field(s) to update on conflict
   */
  constructor (pool, config) {
    this.pool = pool;
    this.config = config;
  }

  /**
   * Persist one or more rows of data to the DB
   * @param {Array|Object} data - a row, or multiple rows of data as a key/value hash
   * @param {Array} [columns] - which columns to return
   * @return {Promise} resolves with return value from Postgres pool.query
   */
  async persistBatch (data, columns = null) {
    const { table, upsert } = this.config;

    // Convert all data to array
    const insertData = isArray(data) ? data : [data];

    const fields = Object.keys(insertData[0]);

    let query = `INSERT INTO ${table} (${fields.join(',')}) VALUES `;

    let queryParams = [];
    const rows = insertData.map(row => {
      const values = fields.map((value, i) => `$${i + 1 + queryParams.length}`);
      // Add values to query params
      queryParams = [...queryParams, ...Object.values(row)];
      return '(' + values.join(',') + ')';
    });

    query += rows.join(',');

    if (upsert) {
      const parts = upsert.set.map(field => `${field}=EXCLUDED.${field}`);
      query += ` ON CONFLICT (${upsert.fields.join(',')}) DO UPDATE SET ${parts.join(',')}`;
    }

    if (columns) {
      query += ` RETURNING ${columns.join('","')}`;
    }

    return this.pool.query(query, queryParams);
  }

  /**
   * Persists data for the named entity, if the number of query params
   * will exceed the Postgres limit of 65535 they are split up into batches
   * @param {Array|Object} data - data to persist
   * @param {Array} - columns to return
   */
  async persist (data, columns = null) {
    if (isArray(data) && data.length === 0) {
      return;
    }

    const insertData = isArray(data) ? data : [data];
    const maxRows = Math.floor(65535 / Object.keys(insertData[0]).length);

    const chunks = chunk(insertData, maxRows);
    const result = { rows: [], rowCount: 0 };

    for (let batch of chunks) {
      const { rows, rowCount } = await this.persistBatch(batch, columns);
      result.rows.push(...rows);
      result.rowCount += rowCount;
    }

    return result;
  }
}

module.exports = Repository;
