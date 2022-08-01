const { get } = require('lodash')
const Repository = require('@envage/hapi-pg-rest-api/src/repository')
const db = require('../db')

const findOneByLicenceNumberQuery = `
select l.*, r.charge_region_id, r.name AS region_name, r.nald_region_id
from water.licences l
join water.regions r on l.region_id=r.region_id
where l.licence_ref=$1
`

class LicenceRepository extends Repository {
  constructor (config = {}) {
    super(Object.assign({
      connection: db.pool,
      table: 'water.licences',
      primaryKey: 'licence_id'
    }, config))
  }

  /**
   * Finds a single licence row by licence number
   * @param {String} licenceNumber
   * @return {Object}
   */
  async findOneByLicenceNumber (licenceNumber) {
    const result = await this.dbQuery(findOneByLicenceNumberQuery, [licenceNumber])
    return get(result, 'rows.0')
  }
};

module.exports = LicenceRepository
module.exports._findOneByLicenceNumberQuery = findOneByLicenceNumberQuery
