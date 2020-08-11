'use strict';

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');
const sandbox = require('sinon').createSandbox();

// Services
const dataService = require('../../../../../src/modules/billing/services/volume-matching-service/data-service');
const matchingService = require('../../../../../src/modules/billing/services/volume-matching-service/matching-service');
const volumeMatchingService = require('../../../../../src/modules/billing/services/volume-matching-service/index.js');

// Models
const ChargeElementGroup = require('../../../../../src/modules/billing/services/volume-matching-service/models/charge-element-group');
const ReturnGroup = require('../../../../../src/modules/billing/services/volume-matching-service/models/return-group');
const FinancialYear = require('../../../../../src/lib/models/financial-year');
const DateRange = require('../../../../../src/lib/models/date-range');

const { RETURN_SEASONS } = require('../../../../../src/lib/models/constants');

const chargeVersionId = uuid();
const financialYear = new FinancialYear(2020);

const createMatchingData = () => ({
  chargePeriod: new DateRange('2019-04-01', '2020-03-31'),
  chargeElementGroup: new ChargeElementGroup(),
  returnGroups: {
    [RETURN_SEASONS.summer]: new ReturnGroup(),
    [RETURN_SEASONS.winterAllYear]: new ReturnGroup()
  }
});

experiment('modules/billing/services/volume-matching-service/index.js', () => {
  let matchingData;

  beforeEach(async () => {
    matchingData = createMatchingData();
    sandbox.stub(dataService, 'getData').resolves(matchingData);
    sandbox.stub(matchingService, 'match').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.matchVolumes', () => {
    experiment('when the season is summer', () => {
      beforeEach(async () => {
        await volumeMatchingService.matchVolumes(chargeVersionId, financialYear, true);
      });

      test('calls the matching service with the correct params', async () => {
        expect(matchingService.match.calledWith(
          matchingData.chargePeriod,
          matchingData.chargeElementGroup,
          matchingData.returnGroups[RETURN_SEASONS.summer]
        )).to.be.true();
      });
    });

    experiment('when the season is winter/all-year', () => {
      beforeEach(async () => {
        await volumeMatchingService.matchVolumes(chargeVersionId, financialYear, false);
      });

      test('calls the matching service with the correct params', async () => {
        expect(matchingService.match.calledWith(
          matchingData.chargePeriod,
          matchingData.chargeElementGroup,
          matchingData.returnGroups[RETURN_SEASONS.winterAllYear]
        )).to.be.true();
      });
    });
  });
});
