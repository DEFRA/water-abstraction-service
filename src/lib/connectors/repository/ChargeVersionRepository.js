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
   * Finds a complete single charge version
   * @param  {String}  chargeVersionId
   * @return {Promise<Object>}
   */
  async findOneById (chargeVersionId) {
    const filter = { charge_version_id: chargeVersionId };
    const { rows: [row] } = await this.find(filter);
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
   * @param {String} regionId The UUID representing the region to get charge versions for
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
}

module.exports = ChargeVersionRepository;
