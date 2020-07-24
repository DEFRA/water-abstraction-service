'use strict';

const moment = require('moment');
const uuid = require('uuid/v4');

// Models
const PurposeUse = require('../../../../../src/lib/models/purpose-use');
const Return = require('../../../../../src/lib/models/return');
const ReturnVersion = require('../../../../../src/lib/models/return-version');
const ReturnLine = require('../../../../../src/lib/models/return-line');
const DateRange = require('../../../../../src/lib/models/date-range');
const ChargeElement = require('../../../../../src/lib/models/charge-element');
const ChargeElementContainer = require('../../../../../src/modules/billing/services/volume-matching-service/models/charge-element-container');

const chargePeriod = new DateRange('2019-04-01', '2020-03-31');
const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Create an array of return lines for testing
 * @return {Array<ReturnLine>}
 */
const createReturnLines = () => Array.from({ length: 12 }).reduce((acc, value, i) => {
  const returnLine = new ReturnLine();
  const startDate = moment('2019-04-01').add(i, 'month');
  return [
    ...acc,
    returnLine.fromHash({
      dateRange: new DateRange(startDate.format(DATE_FORMAT), moment(startDate).endOf('month').format(DATE_FORMAT)),
      volume: 1000
    })
  ];
}, []);

/**
 * Create a return for testing
 * @param {AbstractionPeriod} abstractionPeriod
 * @param {Array<PurposeUse>} purposeUses
 */
const createReturn = (abstractionPeriod, purposeUses, isSummer = false, options = {}) => {
  const returnVersion = new ReturnVersion();
  returnVersion.fromHash({
    isCurrentVersion: true,
    returnLines: createReturnLines()
  });

  const ret = new Return();
  return ret.fromHash({
    dateRange: chargePeriod,
    abstractionPeriod,
    purposeUses,
    status: options.status || Return.RETURN_STATUS.completed,
    dueDate: '2020-04-28',
    receivedDate: '2020-04-15',
    returnVersions: [returnVersion],
    isSummer
  });
};

const createPurposeUse = (name, isTwoPartTariff) => {
  const purposeUse = new PurposeUse(uuid());
  return purposeUse.fromHash({
    name,
    isTwoPartTariff
  });
};

/**
 * Create a charge element container for testing
 * @param {String} description
 * @param {*} options
 */
const createChargeElementContainer = (description, abstractionPeriod, purposeUse, options = {}) => {
  const ele = new ChargeElement(uuid());
  ele.fromHash({
    id: uuid(),
    abstractionPeriod,
    purposeUse,
    description,
    authorisedAnnualQuantity: options.volume || 12
  });
  if (options.isTimeLimited) {
    ele.timeLimitedPeriod = new DateRange('2019-04-01', '2019-09-30');
  }
  return new ChargeElementContainer(ele, chargePeriod);
};

exports.createReturn = createReturn;
exports.chargePeriod = chargePeriod;
exports.createPurposeUse = createPurposeUse;
exports.createChargeElementContainer = createChargeElementContainer;
