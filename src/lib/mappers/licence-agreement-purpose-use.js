'use strict';

const { createMapper } = require('../object-mapper');
const { createModel } = require('./lib/helpers');
const LicenceAgreementPurposeUse = require('../models/licence-agreement-purpose-use');

const purposeUseMapper = require('./purpose-use');

const dbToModelMapper = createMapper()
  .map('licenceAgreementPurposeUseId').to('id')
  .map('purposeUse').to('purposeUse', purposeUseMapper.dbToModel);

const dbToModel = row => createModel(LicenceAgreementPurposeUse, row, dbToModelMapper);

exports.dbToModel = dbToModel;
