'use strict';

const ChargeAgreement = require('../models/charge-agreement');

/**
 * Creates a ChargeAgreement instance given a row of charge agreement data
 *
 * @param {Object} row - charge agreement row from the database
 * @return {ChargeAgreeement}
 */
const dbToModel = row => {
  const agreement = new ChargeAgreement().fromHash({
    id: row.chargeAgreementId,
    code: row.agreementCode,
    description: row.description,
    startDate: row.startDate,
    endDate: row.endDate || null,
    dateCreated: row.dateCreated,
    dateUpdated: row.dateUpdated
  });

  return agreement;
};

exports.dbToModel = dbToModel;
