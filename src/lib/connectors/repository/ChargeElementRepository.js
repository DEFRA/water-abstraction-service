const Repository = require('@envage/hapi-pg-rest-api/src/repository');

class ChargeElementRepository extends Repository {
  /**
   * Gets all charge elements for a particular charge version and
   * joins the purposes to the descriptions.
   * @param  {String} chargeVersionId - licence number
   * @return {Promise<Array>}
   */
  async findByChargeVersionId (chargeVersionId) {
    const query = `
      select
        ce.*,
        pp.description as purpose_primary_description,
        ps.description as purpose_secondary_description,
        pu.description as purpose_tertiary_description
      from water.charge_elements ce
      inner join water.purposes_primary pp
        on ce.purpose_primary = pp.id
      inner join water.purposes_secondary ps
        on ce.purpose_secondary = ps.id
      inner join water.purposes_uses pu
        on ce.purpose_tertiary = pu.id
      where ce.charge_version_id = $1
      order by ce.time_limited_start_date, ce.time_limited_end_date;
    `;

    const params = [chargeVersionId];
    const { rows } = await this.dbQuery(query, params);
    return rows;
  }

  /**
   * Find a single charge element record by ID
   * @param {String} chargeElementId
   * @return {Promise<Object>} resolves with DB row if found
   */
  async findOneById (chargeElementId) {
    const { rows: [chargeElement] } = await this.find({ charge_element_id: chargeElementId });
    return chargeElement;
  };
}

module.exports = ChargeElementRepository;
