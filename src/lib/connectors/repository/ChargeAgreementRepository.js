const Repository = require('@envage/hapi-pg-rest-api/src/repository')

class ChargeAgreementRepository extends Repository {
  /**
   * Gets all charge agreements for a particular charge version
   * @param  {String} chargeVersionId
   * @return {Promise<Array>}
   */
  async findByChargeVersionId (chargeVersionId) {
    const query = `
      SELECT a.*, t.description AS agreement_description
        FROM water.charge_agreements a
        JOIN water.financial_agreement_types t ON a.agreement_code=t.id
        JOIN water.charge_elements e ON a.charge_element_id=e.charge_element_id
        WHERE e.charge_version_id=$1
        ORDER BY a.start_date`
    const params = [chargeVersionId]
    const { rows } = await this.dbQuery(query, params)
    return rows
  }
}

module.exports = ChargeAgreementRepository
