'use strict'

const { knex } = require('../../src/lib/connectors/knex')
const queries = require('../lib/connectors/repos/queries/charge-versions')
const repos = require('../lib/connectors/repos')
const helpers = require('@envage/water-abstraction-helpers').charging

class PopulateBatchChargeVersionsService {
  static async go (batch) {
    const financialYears = this._yearRange(batch.startYear.endYear, batch.endYear.endYear)

    for (const year of financialYears) {
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

  static async _createBatchChargeVersion (billingBatch, financialYearEnding) {
    const batchTypesToCreate = {
      types: [{
        type: 'annual',
        isSummer: false
      }],
      hasTwoPartAgreement: false,
      isChargeable: false
    }

    const rows = await this._chargeVersionsForYearRegionQuery(billingBatch, financialYearEnding)

    for (const row of rows) {
      if (row.is_two_part_tariff) {
        const twoPartTariffSeasons = await this._getTwoPartTariffSeasons(row, financialYearEnding, billingBatch.region.id)

        if (twoPartTariffSeasons.summer) {
          batchTypesToCreate.types.push({ type: 'two_part_tariff', isSummer: true })
        }
        if (twoPartTariffSeasons.winterAllYear) {
          batchTypesToCreate.types.push({ type: 'two_part_tariff', isSummer: false })
        }

        batchTypesToCreate.hasTwoPartAgreement = true
        batchTypesToCreate.isChargeable = true
      }

      for (const { type, isSummer } of batchTypesToCreate.types) {
        await this._createBatchChargeVersionYear(billingBatch.id, row.charge_version_id, financialYearEnding, type, isSummer, batchTypesToCreate.hasTwoPartAgreement, batchTypesToCreate.isChargeable)
      }
    }
  }

  static async _createBatchChargeVersionYear (billingBatchId, chargeVersionId, financialYearEnding, transactionType, isSummer, hasTwoPartAgreement, isChargeable) {
    await repos.billingBatchChargeVersionYears.create({
      billingBatchId,
      chargeVersionId,
      financialYearEnding,
      status: 'processing',
      transactionType,
      isSummer,
      hasTwoPartAgreement,
      isChargeable: true
    })
  }

  static async _getTwoPartTariffSeasons (row, financialYear, regionId) {
    const allSeasons = []

    if (helpers.getFinancialYear(row.start_date) <= 2021) {
      const [naldSeasons] = await this._naldTwoPartTariffSeasonsQuery(financialYear, row.charge_version_id)
      allSeasons.push({ summer: naldSeasons.summer, winterAllYear: naldSeasons.winter_all_year })
    }

    const [returnVersionSeasons] = await this._twoPartTariffReturnVersionPurposesQuery(row.licence_id, row.start_date, row.end_date)
    const [billingBatchSeasons] = await this._twoPartTariffSentSupplementaryBatchesQuery(financialYear, regionId)

    const wrlsSeasons = {
      summer: returnVersionSeasons.summer && billingBatchSeasons.summer,
      winterAllYear: returnVersionSeasons.winter_all_year && billingBatchSeasons.winter_all_year
    }

    allSeasons.push(wrlsSeasons)

    return this._combineSeasons(allSeasons)
  }

  static async _chargeVersionsForYearRegionQuery (billingBatch, financialYearEnding) {
    const query = billingBatch.type === 'supplementary'
      ? queries.findValidInRegionAndFinancialYearSupplementary
      : queries.findValidInRegionAndFinancialYear

    const params = {
      regionId: billingBatch.region.id,
      financialYearEnding,
      scheme: billingBatch.scheme
    }

    const { rows } = await knex.raw(query, params)

    return rows
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

  static _combineSeasons (seasons) {
    return {
      summer: seasons.some(season => season.summer),
      winterAllYear: seasons.some(season => season.winterAllYear)
    }
  }
}

module.exports = PopulateBatchChargeVersionsService
