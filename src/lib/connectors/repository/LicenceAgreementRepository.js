const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const db = require('../db');

class LicenceAgreementRepository extends Repository {
  constructor (config = {}) {
    super(Object.assign({
      connection: db.pool,
      table: 'water.licence_agreements',
      primaryKey: 'licence_agreement_id'
    }, config));
  }

  /**
   * Finds all agreements for a particular licence number
   * @param {String} licenceNumber
   * @return {Object}
   */
  async findByLicenceNumber (licenceNumber, agreementCodes) {
    const filter = { licence_ref: licenceNumber };
    if (agreementCodes) {
      filter.financial_agreement_type_id = { $in: agreementCodes };
    }
    const { rows } = await this.find(filter);
    return rows;
  }
};

module.exports = LicenceAgreementRepository;
