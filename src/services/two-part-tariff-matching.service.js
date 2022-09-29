'use strict'

const MomentRange = require('moment-range')
const moment = MomentRange.extendMoment(require('moment'))
const { knex } = require('../../src/lib/connectors/knex')
const { BillingBatchChargeVersionYear } = require('../lib/connectors/bookshelf')
const { createReturnCycles, isDateWithinAbstractionPeriod } = require('@envage/water-abstraction-helpers').returns.date

class TwoPartTariffMatchingService {
  static async go (billingBatch) {
    const billingBatchChargeVersionYears = await this._billingBatchChargeVersionYears(billingBatch)

    for (const billingBatchChargeVersionYear of billingBatchChargeVersionYears) {
      await this._processBillingBatchChargeVersionYear(billingBatchChargeVersionYear)
    }

    return billingBatchChargeVersionYears
  }

  static async _processBillingBatchChargeVersionYear (billingBatchChargeVersionYear) {
    const { chargeVersionId, financialYearEnding, isSummer, billingBatchId } = billingBatchChargeVersionYear

    // TODO: We think the magic number 2 comes from the fact it could be up to 2 years prior that a return was submitted
    // that will then be billed. But we're not sure so we should confirm and document it.
    const allReturnCycles = createReturnCycles(`${(financialYearEnding - 2)}-01-01`)

    const matchingReturnCycles = allReturnCycles.filter(cycle => {
      // createReturnCycles() returns a thing that looks like
      // {
      //   startDate: '2015-11-01'
      //   EndDate: '2016-10-31',
      //   isSummer: true
      //   dueDate: '2016-11-28'
      // }
      // First, we are only interested in cycles that match the season we are processing. So, we ignore any that don't
      // match
      if (cycle.isSummer !== isSummer) {
        return false
      }
      // Then we need to extract the year from end date and then convert to a number so we can compare it against
      // financialYearEnding. A summer cycle ends in October so to get the financial year end we need to add 1 year
      // to the year we extracted. Winter cycles end on 20##-03-31 so we don't need to add a year.
      const endYear = parseInt(cycle.endDate.substr(0, 4))
      const cycleFinancialYearEnding = cycle.isSummer ? endYear + 1 : endYear

      return cycleFinancialYearEnding === financialYearEnding
    })

    const [chargePeriod] = await this._datesQuery(chargeVersionId, financialYearEnding)

    const waterReturns = []
    for (const cycle of matchingReturnCycles) {
      const results = await this._returnsQuery(chargeVersionId, cycle.startDate, cycle.endDate, cycle.isSummer)
      waterReturns.push(...results)
    }

    const chargeElements = await this._chargeElementsQuery(chargeVersionId)

    const dateFilteredChargeElements = this._filterOutInvalidChargeElementsByPeriod(chargeElements, chargePeriod)

    const tptFilteredChargeElements = this._filterOutChargeElementsByTPT(dateFilteredChargeElements)

    // chargePeriod = chargePeriod
    // chargeElementGroup = chargeElements
    // returnGroup = waterReturns

    for (const waterReturn of waterReturns) {
      if (waterReturn.version_id) {
        const purposeUseIds = await this._returnRequirementPurposeUseIdsQuery(waterReturn.return_requirement_id)

        const returnChargeElements = tptFilteredChargeElements
          .filter(chargeElement => purposeUseIds.some(purposeUseId => purposeUseId === chargeElement.purposeUse.id))

        const waterReturnLines = await this._returnLinesQuery(chargeVersionId, chargePeriod.start_date, chargePeriod.end_date)

        for (const waterReturnLine of waterReturnLines) {
          const chargeElementChargePeriodOverlapsReturnLine = returnChargeElements.filter(chargeElement => {
            const waterLineRange = moment.range(waterReturnLine.start_date, waterReturnLine.end_date)
            const overlap = this._calculateChargeElementPeriodOverlap(chargeElement, chargePeriod)

            return !!waterLineRange.intersect(overlap)
          })

          const chargeElementAbstractionPeriodOverlapsReturnLine = chargeElementChargePeriodOverlapsReturnLine.filter(chargeElement => {
            const startDate = moment(waterReturnLine.start_date).format('YYYY-MM-DD')
            const endDate = moment(waterReturnLine.end_date).format('YYYY-MM-DD')

            const abstractionPeriod = {
              periodStartDay: chargeElement.abstraction_period_start_day,
              periodStartMonth: chargeElement.abstraction_period_start_month,
              periodEndDay: chargeElement.abstraction_period_end_day,
              periodEndMonth: chargeElement.abstraction_period_end_month
            }

            return isDateWithinAbstractionPeriod(startDate, abstractionPeriod) || isDateWithinAbstractionPeriod(endDate, abstractionPeriod)
          })

          const season = isSummer ? 'summer' : 'winterAllYear'
        }
      }
    }
    // TODO: handle errors in return group
  }

  static async _returnRequirementPurposeUseIdsQuery (returnRequirementId) {
    const query = `SELECT
      rrr.purpose_use_id
    FROM
      water.return_requirement_purposes rrr
    WHERE
      rrr.return_requirement_id = :returnRequirementId`

    const params = {
      returnRequirementId
    }

    const { rows } = await knex.raw(query, params)

    return rows
  }

  static async _billingBatchChargeVersionYears (billingBatch) {
    const conditions = {
      billing_batch_id: billingBatch.id,
      transaction_type: 'two_part_tariff'
    }

    const result = await new BillingBatchChargeVersionYear()
      .where(conditions)
      .fetchAll({ require: false })

    return result
  }

  /**
   * Queries the 'returns' and 'water' schema based on a charge version and return cycle
   *
   * This replaces what src/lib/services/returns/index.js.getReturnsForLicenceInFinancialYear() does. The existing code
   * would use the hapi-pg-rest-api connectors to get 'returns' from the 'returns' schema (don't blame us for the
   * naming!) Then, for each 'returns.returns' found, it would query 'water.return_requirements' for one with a matching
   * 'external_id'. That result would then be mapped onto the existing Return model instance.
   *
   * It also queries 'returns.versions' for records with a matching 'return_id'. A 'returns.returns' record can have
   * multiple entries in 'returns.versions'. The 'version_number' increments with each one added. The current code
   * queries for all matching 'returns.versions' entries where 'current = true' and then sorts the results by
   * 'version_number' and selects the lastest. For example, for a return with 3 'returns.versions' entries the one with
   * 'version_number = 3' would be returned. If no 'returns.versions' exist, which is possible, the code simply skips
   * mapping the version onto the return.
   *
   * We did some digging and found only the latest version is ever flagged as 'current = true'. So, adding that clause
   * to a query results in a distinct result set of version numbers and return ids. By this we mean only 1
   * 'returns.versions' result is ever returned for each return_id when 'current = true' is used as a WHERE clause. This
   * is how we have replaced all the existing `decorateWithCurrentVersion()` logic with a simple `LEFT JOIN` in our
   * query.
   *
   * ## Show your working
   *
   * In Sept 2022 we queried a copy of production data. 'returns.versions' contained 58,523 records and 56,821 distinct
   * return IDs (remember that second number!)
   *
   * ```sql
   * SELECT COUNT(*) FROM "returns".versions --58523
   * SELECT COUNT(*) FROM (SELECT DISTINCT return_id FROM "returns".versions) AS temp --56821
   * ```
   *
   * Running the following query gives a count for how many times a return_id appears in the table
   *
   * ```sql
   * SELECT * FROM (
   *   SELECT rv.*, count(*) OVER (PARTITION BY return_id) FROM "returns".versions rv
   * ) AS counted
   * ORDER BY counted.count DESC;
   * ```
   *
   * You can see there are a number with multiple versions. Add 'current = true' to the query though and the count drops
   * to 1 for all return IDs
   *
   * ```sql
   * SELECT * FROM (
   *   SELECT rv.*, count(*) OVER (PARTITION BY return_id) FROM "returns".versions rv WHERE rv.current = true
   * ) AS counted
   * ORDER BY counted.count DESC;
   * ```
   *
   * Importantly, our result count is 56,821 which matches our count for the number of distinct return IDs in the table.
   * We double checked a return which has 6 version entries. Again, just the 'current' version was returned, which had
   * 'version_number = 6'.
   *
   * ```sql
   * SELECT * FROM (
   *   SELECT rv.*, count(*) OVER (PARTITION BY return_id) FROM "returns".versions rv WHERE rv.current = true
   * ) AS counted
   *WHERE return_id = 'v1:7:TH/038/0001/001:10038854:2018-04-01:2019-03-31';
   * ```
   *
   * So, there is no need for logic that expects multiple results for a return ID where 'current = true'. There will
   * only ever be 1 result.
   */
  static async _returnsQuery (chargeVersionId, startDate, endDate, isSummer) {
    const query = `SELECT
      r.*,
      rr.*,
      rv.*
    FROM "returns"."returns" r
    INNER JOIN water.charge_versions cv
      ON cv.licence_ref = r.licence_ref
    INNER JOIN water.return_requirements rr
      ON rr.external_id = ((r.metadata->'nald'->>'regionCode') || ':' || (r.metadata->'nald'->>'formatId'))
    LEFT JOIN "returns".versions rv
      ON rv.return_id = r.return_id AND rv.current = true
    WHERE cv.charge_version_id = :chargeVersionId
      AND r.status <> 'void'
      AND r.start_date >= :startDate
      AND r.end_date <= :endDate
      AND r.metadata->>'isSummer' = :isSummer
      `

    const params = {
      chargeVersionId,
      startDate,
      endDate,
      isSummer: isSummer ? 'true' : 'false'
    }

    const { rows } = await knex.raw(query, params)

    return rows
  }

  static async _returnLinesQuery (returnVersionId, chargePeriodStartDate, chargePeriodEndDate) {
    const query = `SELECT
      rl.*
    FROM "returns"."lines" rl
    WHERE
      rl.version_id = :returnVersionId
    AND rl.quantity > 0
    AND daterange(:chargePeriodStartDate, :chargePeriodEndDate) * daterange(rl.start_date, rl.end_date) <> 'empty'`

    const params = {
      returnVersionId,
      chargePeriodStartDate,
      chargePeriodEndDate
    }

    const { rows } = await knex.raw(query, params)

    return rows
  }

  static async _datesQuery (chargeVersionId, financialYearEnding) {
    const query = `SELECT
      LOWER(sub_query.charge_period_dates) AS start_date,
      UPPER(sub_query.charge_period_dates) AS end_date
    FROM (
      SELECT
        (
          -- Licence date range
          daterange(l.start_date, LEAST(l.expired_date, l.lapsed_date, l.revoked_date))
          *
          -- Charge version date range
          daterange(cv.start_date, cv.end_date)
          *
          -- Financial year date range
          daterange(make_date(:financialYearEnding-1, 4, 1), make_date(:financialYearEnding, 3, 31))
        ) AS charge_period_dates
      FROM
        water.charge_versions cv
      INNER JOIN water.licences l
        ON cv.licence_ref=l.licence_ref
      WHERE
        cv.charge_version_id = :chargeVersionId
    ) sub_query`

    const params = {
      chargeVersionId,
      financialYearEnding
    }

    const { rows } = await knex.raw(query, params)

    return rows
  }

  static async _chargeElementsQuery (chargeVersionId) {
    const query = `SELECT
      *
    FROM
      water.charge_elements ce
    INNER JOIN water.purposes_uses pu
      ON pu.purpose_use_id = ce.purpose_use_id
    WHERE
      ce.charge_version_id = :chargeVersionId`

    const params = { chargeVersionId }

    const { rows } = await knex.raw(query, params)

    return rows
  }

  static _filterOutInvalidChargeElementsByPeriod (chargeElements, chargePeriod) {
    const chargePeriodRange = moment.range(chargePeriod.start_date, chargePeriod.end_date)

    return chargeElements.filter(chargeElement => {
      const overlap = this._calculateChargeElementPeriodOverlap(chargeElement, chargePeriodRange)

      return !!overlap
    })
  }

  static _calculateChargeElementPeriodOverlap (chargeElement, chargePeriodRange) {
    // If time_limited_start_date and time_limited_end_date are both `null` then the intersection of this range and
    // the chargePeriod range is the whole of the chargePeriod range. We therefore don't need to code a special case
    // to always return `true` if there is no time limited period.
    const chargeElementRange = moment.range(chargeElement.time_limited_start_date, chargeElement.time_limited_end_date)
    const overlap = chargePeriodRange.intersect(chargeElementRange)

    return overlap
  }

  static _filterOutChargeElementsByTPT (chargeElements) {
    return chargeElements.filter(chargeElement => {
      return chargeElement.is_two_part_tariff && chargeElement.is_section_127_agreement_enabled
    })
  }
}

module.exports = TwoPartTariffMatchingService
