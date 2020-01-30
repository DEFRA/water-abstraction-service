'use strict';

const Agreement = require('../../../lib/models/agreement');

/**
 * Creates an Agreement instance with a code derived from the flag name
 * @param {String} flag - e.g. section127Agreement
 * @reutrn {Agreement}
 */
const createAgreement = flag => {
  const agreement = new Agreement();
  agreement.code = getCode(flag);
  return agreement;
};

/**
 * Gets the code from the flag name
 * @param {String} flag - e.g. section130SAgreement
 * @return {String} the code, e.g. 130S
 */
const getCode = flag =>
  flag.match(/([0-9]+[A-Z]?)Agreement$/)[1];

const flags = [
  'section127Agreement',
  'section130UAgreement',
  'section130SAgreement',
  'section130TAgreement',
  'section130WAgreement'
];

/**
 * Creates an array of agreement objects from a charge processor line
 * @param {Object} chargeLine - transaction line object from the charge processor
 * @return {Array<Agreement>}
 */
const chargeToModels = chargeLine => flags
  .filter(flag => chargeLine[flag])
  .map(flag => createAgreement(flag));

exports.chargeToModels = chargeToModels;
