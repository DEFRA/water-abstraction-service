'use strict';

const { get } = require('lodash');
const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const db = require('../db');

class BillingBatchRepository extends Repository {
  constructor (config = {}) {
    super(Object.assign({
      connection: db.pool,
      table: 'water.billing_batches',
      primaryKey: 'billing_batch_id'
    }, config));
  }

  /**
   * Creates a new batch record in the water.billing_batches table
   *
   * Will return null if no batch was created which indicates that there
   * is already a batch being processed for the given region.
   *
   * @param {String} regionId The uuid value for the region
   * @param {String} batchType Whether annual, supplementary or two_part_tariff
   * @param {Number} fromFinancialYearEnding The start year for the financial year range (e.g. 2019 => 01/04/2018 - 31/03/2019)
   * @param {Number} toFinancialYearEnding The end year for the financial year range (e.g. 2019 => 01/04/2018 - 31/03/2019)
   * @param {String} season Whether summer, winter or all year
   */
  async createBatch (regionId, batchType, fromFinancialYearEnding, toFinancialYearEnding, season) {
    const query = `
      insert into water.billing_batches (
        region_id,
        batch_type,
        from_financial_year_ending,
        to_financial_year_ending,
        season,
        status
      )
      select $1, $2, $3, $4, $5, 'processing'
      where
        not exists (
          select b.billing_batch_id
          from water.billing_batches b
          where b.region_id = $1
          and b.status in ('processing', 'ready', 'review')
        )
      returning *;
    `;

    const result = await this.dbQuery(query, [regionId, batchType, fromFinancialYearEnding, toFinancialYearEnding, season]);
    return get(result, 'rows[0]', null);
  }
}

module.exports = BillingBatchRepository;
