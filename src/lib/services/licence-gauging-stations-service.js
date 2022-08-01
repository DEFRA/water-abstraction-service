'use strict'
const licenceGaugingStationsRepo = require('../connectors/repos/licence-gauging-stations')

const findLicenceGaugingStationsByFilter = licenceGaugingStationsRepo.findLicenceGaugingStationsByFilter

const getLicenceGaugingStationById = async licenceGaugingStationId => licenceGaugingStationsRepo.findOneById(licenceGaugingStationId)

const createNewLicenceLink = (gaugingStationId, licenceId, properties = {
  licenceVersionPurposeConditionId: null,
  thresholdUnit: 'mAOD',
  thresholdValue: 0,
  abstractionPeriod: null,
  restrictionType: 'flow',
  alertType: 'reduce',
  source: 'wrls'
}) => licenceGaugingStationsRepo.create({ gaugingStationId, licenceId, ...properties })

const deleteLicenceLink = licenceGaugingStationsRepo.deleteOne

exports.findLicenceGaugingStationsByFilter = findLicenceGaugingStationsByFilter
exports.getLicenceGaugingStationById = getLicenceGaugingStationById
exports.createNewLicenceLink = createNewLicenceLink
exports.deleteLicenceLink = deleteLicenceLink
