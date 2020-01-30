const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const db = require('../db');

class LicenceRepository extends Repository {
  constructor (config = {}) {
    super(Object.assign({
      connection: db.pool,
      table: 'water.licences',
      primaryKey: 'licence_id'
    }, config));
  }

  /**
   * Finds a single licence row by licence number
   * @param {String} licenceNumber
   * @return {Object}
   */
  async findOneByLicenceNumber (licenceNumber) {
    const filter = { licence_ref: licenceNumber };
    const { rows: [licence] } = await this.find(filter);
    return licence;
  }
};

module.exports = LicenceRepository;
