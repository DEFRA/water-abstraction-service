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
}

module.exports = ChargeVersionRepository;
