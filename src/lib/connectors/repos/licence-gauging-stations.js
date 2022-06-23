'use strict'
const { LicenceGaugingStations } = require('../bookshelf')
const helpers = require('./lib/helpers')

const findLicenceGaugingStationsByFilter = async filters => {
  const result = await LicenceGaugingStations
    .forge()
    .query(function (qb) {
      qb.where(filters)
    })
    .fetchAll()

  return result.toJSON()
}

const findOneById = licenceGaugingStationId =>
  helpers.findOne(LicenceGaugingStations, 'licenceGaugingStationId', licenceGaugingStationId)

const create = data =>
  helpers.create(LicenceGaugingStations, data)

const deleteOne = licenceGaugingStationId =>
  helpers.update(LicenceGaugingStations, 'licenceGaugingStationId', licenceGaugingStationId, { date_deleted: new Date() })

const updateStatus = (licenceGaugingStationId, status) =>
  helpers.update(LicenceGaugingStations, 'licenceGaugingStationId', licenceGaugingStationId, { status, dateStatusUpdated: new Date() })

exports.findOneById = findOneById
exports.findLicenceGaugingStationsByFilter = findLicenceGaugingStationsByFilter
exports.create = create
exports.deleteOne = deleteOne
exports.updateStatus = updateStatus
