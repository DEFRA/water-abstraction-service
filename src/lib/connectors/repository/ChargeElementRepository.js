const Repository = require('@envage/hapi-pg-rest-api/src/repository');

class ChargeElementRepository extends Repository {
  /**
   * Gets all charge elements for a particular charge version
   * @param  {String} chargeVersionId - licence number
   * @return {Promise<Array>}
   */
  async findByChargeVersionId (chargeVersionId) {
    const filter = { charge_version_id: chargeVersionId };
    const sort = { time_limited_start_date: +1, time_limited_end_date: +1 };
    const { rows } = await this.find(filter, sort);
    return rows;
  }
}

module.exports = ChargeElementRepository;
