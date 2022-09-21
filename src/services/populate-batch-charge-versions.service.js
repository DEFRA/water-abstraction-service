'use strict'

const { knownHookEvents } = require('got/dist/source')
const { knex } = require('../../src/lib/connectors/knex')
const queries = require('../lib/connectors/repos/queries/charge-versions')
const helpers = require('@envage/water-abstraction-helpers').charging

class PopulateBatchChargeVersionsService {
  static async go (batch) {
    const financialYears = this._yearRange(batch.startYear.endYear, batch.endYear.endYear)

    for (const year in financialYears) {
      await this._createBatchChargeVersion(batch, year)
    }
  }

  static _yearRange (start, end) {
    const returnArray = []
    for (let x = start; x <= end; x++) {
      returnArray.push(x)
    }
    return returnArray
  }

  static async _createBatchChargeVersion (batch, year) {
    // Get TPT batches in year here?

    const params = {
      regionId: batch.regionId,
      financialYearEnding: year
    }

    const { rows } = await knex.raw(this._query, params)

    for (const row of rows) {
      // Define our object to be returned
      const returnObj = {
        types: [{
          type: 'annual',
          isSummer: false
        }],
        chargeVersionHasAgreement: false
      }

      if (row.is_two_part_tariff) {
        const twoPartTariffSeasons = await this._getTwoPartTariffSeasons(row, year, batch.regionId)
      }

      // create a charge batch version year for each one
    }
  }

  static _query () {
    return queries.findValidInRegionAndFinancialYearSupplementary
  }

  static async _getTwoPartTariffSeasons (row, financialYear, regionId) {
    const seasons = []

    if (helpers.getFinancialYear(row.start_date) <= 2021) {
      const [thing] = await this._naldTwoPartTariffSeasonsQuery(financialYear, row.charge_version_id)
      seasons.push({ summer: thing.summer, winterAllYear: thing.winter_all_year })
    }

    const [batches] = await this._twoPartTariffReturnVersionPurposesQuery(row.licence_id, row.start_date, row.end_date)
    const [existingTPTBatches] = await this._twoPartTariffSentSupplementaryBatchesQuery(financialYear, regionId)

    const twoPartTariffBatches = {
      summer: batches.summer && existingTPTBatches.summer,
      winterAllYear: batches.winter_all_year && existingTPTBatches.winter_all_year
    }

    seasons.push(twoPartTariffBatches)

    return seasons
  }

  static async _naldTwoPartTariffSeasonsQuery (financialYear, chargeVersionId) {
    const query = `SELECT
    (COUNT(*) FILTER (WHERE bv.is_summer = true)) > 0 AS summer,
    (COUNT(*) FILTER (WHERE bv.is_summer = false)) > 0 AS winter_all_year
  FROM
    water.billing_volumes bv
  INNER JOIN water.charge_elements ce ON ce.charge_element_id = bv.charge_element_id
  INNER JOIN water.billing_batches bb ON bb.billing_batch_id = bv.billing_batch_id
  WHERE
    bv.is_approved = true
    AND bv.financial_year = :financialYear
    AND bv.errored_on IS null
    and bb.source = 'nald'
    AND ce.charge_version_id = :chargeVersionId`

    const params = {
      financialYear,
      chargeVersionId
    }

    const { rows } = await knex.raw(query, params)

    return rows
  }

  static async _twoPartTariffReturnVersionPurposesQuery (licenceId, startDate, endDate) {
    const query = `SELECT
    (COUNT(*) FILTER (WHERE rr.is_summer = true)) > 0 AS summer,
    (COUNT(*) FILTER (WHERE rr.is_summer = false)) > 0 AS winter_all_year
  from water.return_versions rv
  inner join water.return_requirements rr on rr.return_version_id = rv.return_version_id
  inner join water.return_requirement_purposes rrp on rrp.return_requirement_id = rr.return_requirement_id
  inner join water.purposes_uses pu on pu.purpose_use_id = rrp.purpose_use_id
  where rv.licence_id = :licenceId
  and rv.status <> 'draft'
  and pu.is_two_part_tariff = true
  and (daterange(rv.start_date, rv.end_date) * daterange(:startDate, :endDate)) <> 'empty'`

    const params = {
      licenceId,
      startDate,
      endDate
    }

    const { rows } = await knex.raw(query, params)

    return rows
  }

  static async _twoPartTariffSentSupplementaryBatchesQuery (financialYear, regionId) {
    const query = `SELECT
    (COUNT(*) FILTER (WHERE bb.is_summer = true)) > 0 AS summer,
    (COUNT(*) FILTER (WHERE bb.is_summer = false)) > 0 AS winter_all_year
  FROM
    water.billing_batches bb
  WHERE
    bb.batch_type IN ('supplementary', 'two_part_tariff')
    AND bb.status = 'sent'
    AND bb.to_financial_year_ending = :financialYear
    AND bb.region_id = :regionId`

    const params = {
      financialYear,
      regionId
    }

    const { rows } = await knex.raw(query, params)

    return rows
  }
}

module.exports = PopulateBatchChargeVersionsService
