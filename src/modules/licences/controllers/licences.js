'use strict';

const controller = require('../../../lib/controller');
const licencesService = require('../../../lib/services/licences');

const getLicence = async request =>
  controller.getEntity(request.params.licenceId, licencesService.getLicenceById);

const getLicenceVersions = async request =>
  licencesService.getLicenceVersions(request.params.licenceId);

const getLicenceAccountsByRefAndDate = async request =>
  licencesService.getLicenceAccountsByRefAndDate(request.query.documentRef, request.query.date);

exports.getLicence = getLicence;
exports.getLicenceVersions = getLicenceVersions;
exports.getLicenceAccountsByRefAndDate = getLicenceAccountsByRefAndDate;
