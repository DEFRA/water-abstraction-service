'use strict';
const licenceGaugingStationsRepo = require('../connectors/repos/licence-gauging-stations');

const createNewLicenceLink = async (gaugingStationId, licenceId, properties = {
  licenceVersionPurposeConditionId: null,
  thresholdUnit: 'mAOD',
  thresholdValue: 0,
  abstractionPeriod: null,
  restrictionType: 'flow',
  alertType: 'reduce',
  source: 'wrls'
}) => licenceGaugingStationsRepo.create({ gaugingStationId, licenceId, ...properties });

exports.createNewLicenceLink = createNewLicenceLink;
