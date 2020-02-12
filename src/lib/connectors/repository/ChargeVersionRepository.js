const helpers = require('@envage/water-abstraction-helpers');
const Repository = require('@envage/hapi-pg-rest-api/src/repository');

class ChargeVersionRepository extends Repository {
  /**
   * Gets all charge versions for a particular licence number
   * @param  {String} licenceRef - licence number
   * @return {Promise<Array>}
   */
  async findByLicenceRef (licenceRef) {
    const filter = { licence_ref: licenceRef };
    const sort = { start_date: +1 };
    const { rows } = await this.find(filter, sort);
    return rows;
  }

  /**
   * Finds a complete single charge version, including the licence ID
   * @param  {String}  chargeVersionId
   * @return {Promise<Object>}
   */
  async findOneById (chargeVersionId) {
    const query = `select v.*, l.licence_id, l.is_water_undertaker 
      from water.charge_versions v
      join water.licences l on v.licence_ref=l.licence_ref
      where v.charge_version_id=$1`;

    const { rows: [row] } = await this.dbQuery(query, [chargeVersionId]);
    return row;
  }

  /**
   * Writes into billing_batch_charge_versions a list of charge versions for
   * the given region that relate to licences that have been marked as
   * requiring re-billing/qa to potentially credit then recharge after
   * a change to the licence or charge version.
   *
   * Charge versions will be pulled back from the start of the financial year 6 years ago.
   *
   * @param {String} batch The batch metadata from water.events
   * @param {Date} now The date now, here to facilitate unit tests.
   */
  async createSupplementaryChargeVersions (batch, now = Date.now()) {
    const { getFinancialYear, getFinancialYearDate } = helpers.charging;
    const fromDate = getFinancialYearDate(1, 4, getFinancialYear(now) - 6);

    const { billing_batch_id: batchId, region_id: regionId } = batch;

    const query = `
      insert into
      water.billing_batch_charge_versions (billing_batch_id, charge_version_id)
      select $1, cv.charge_version_id
      from water.licences l
        join water.charge_versions cv on l.licence_ref = cv.licence_ref
      where
        l.include_in_supplementary_billing = true
        and l.region_id = $2::uuid
        and (cv.end_date is null or cv.end_date > $3)
      returning *;
    `;

    const params = [batchId, regionId, fromDate];
    const { rows } = await this.dbQuery(query, params);
    return rows;
  }

  /**
   * Writes into billing_batch_charge_versions a list of charge versions for
   * the given region that relate to licences that have a valid two part tariff
   * licence agreement.
   *
   * @param {String} batch The batch metadata from water.events
   * @param {Date} now The date now, here to facilitate unit tests.
   */
  async createTwoPartTariffChargeVersions (batch, now = Date.now()) {
    const { getFinancialYear, getFinancialYearDate } = helpers.charging;
    const fromDate = getFinancialYearDate(1, 4, getFinancialYear(now));

    const { billing_batch_id: batchId, region_id: regionId, season } = batch;

    const seasonFilter = season === 'summer' ? "ce.season = 'summer'" : "(ce.season = 'winter' or ce.season = 'all year')";
    const query = `
      insert into water.billing_batch_charge_versions (billing_batch_id, charge_version_id)
      select $1, cv.charge_version_id
      from water.licence_agreements l
        join water.charge_versions cv on l.licence_ref = cv.licence_ref
        join water.licence_agreements la on l.licence_ref = la.licence_ref
        join water.charge_elements ce on cv.charge_version_id = ce.charge_version_id
      where
        l.financial_agreement_type_id = 'S127'
        and l.region_id = $2::uuid
        and l.suspend_from_billing = FALSE
        and (l.expired_date is null or l.expired_date > $3)
        and (l.lapsed_date is null or l.lapsed_date > $3)
        and (l.revoked_date is null or l.revoked_date > $3)
        and (cv.end_date is null or cv.end_date > $3)
        and (la.end_date is null or la.end_date > $3)
        and ${seasonFilter}
      returning *;`;

    const params = [batchId, regionId, fromDate];
    const { rows } = await this.dbQuery(query, params);
    return rows;
  }
}

module.exports = ChargeVersionRepository;
