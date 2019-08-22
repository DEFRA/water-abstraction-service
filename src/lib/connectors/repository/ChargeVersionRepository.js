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
}

module.exports = ChargeVersionRepository;
