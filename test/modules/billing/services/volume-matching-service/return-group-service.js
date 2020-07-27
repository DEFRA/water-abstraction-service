'use strict';

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sandbox = require('sinon').createSandbox();

// Services
const returnGroupService = require('../../../../../src/modules/billing/services/volume-matching-service/return-group-service');
const returnsService = require('../../../../../src/lib/services/returns');

// Models
const ChargeElementGroup = require('../../../../../src/modules/billing/services/volume-matching-service/models/charge-element-group');
const AbstractionPeriod = require('../../../../../src/lib/models/abstraction-period');
const { RETURN_SEASONS } = require('../../../../../src/lib/models/constants');

const {
  createReturn,
  createChargeElementContainer,
  createPurposeUse
} = require('./data');
const FinancialYear = require('../../../../../src/lib/models/financial-year');

const purposeUses = {
  sprayIrrigation: createPurposeUse('sprayIrrigation', true),
  trickleIrrigation: createPurposeUse('trickleIrrigation', true)
};

experiment('modules/billing/services/volume-matching-service/return-group-service', () => {
  let returns, result, summerChargeElementGroup, financialYear;

  beforeEach(async () => {
    returns = [
      createReturn(AbstractionPeriod.getSummer(), [purposeUses.sprayIrrigation], true),
      createReturn(AbstractionPeriod.getWinter(), [purposeUses.sprayIrrigation], false)
    ];
    sandbox.stub(returnsService, 'getReturnsForLicenceInFinancialYear').resolves(returns);
    summerChargeElementGroup = new ChargeElementGroup();
    financialYear = new FinancialYear(2020);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getReturnGroups', () => {
    experiment('when there are no summer charge elements with matching purpose', async () => {
      beforeEach(async () => {
        result = await returnGroupService.getReturnGroups('01/123', financialYear, summerChargeElementGroup);
      });

      test('calls the return service with expected arguments', async () => {
        const [licenceNumber, finYear] = returnsService.getReturnsForLicenceInFinancialYear.lastCall.args;
        expect(licenceNumber).to.equal('01/123');
        expect(finYear).to.equal(financialYear);
      });

      test('all returns are placed in the winter/all year billing cycle', async () => {
        expect(result[RETURN_SEASONS.summer].returns).to.be.an.array().length(0);
        expect(result[RETURN_SEASONS.winterAllYear].returns).to.be.an.array().length(2);
      });
    });

    experiment('when is a summer charge element with matching purpose', async () => {
      beforeEach(async () => {
        summerChargeElementGroup.chargeElementContainers = [
          createChargeElementContainer('summer spray', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation)
        ];
        result = await returnGroupService.getReturnGroups('01/123', new FinancialYear(2020), summerChargeElementGroup);
      });

      test('summer returns are placed in the summer billing cycle', async () => {
        expect(result[RETURN_SEASONS.summer].returns).to.be.an.array().length(1);
        expect(result[RETURN_SEASONS.summer].returns[0].isSummer).to.equal(true);
      });

      test('winter/all year returns are placed in the winter/all year billing cycle', async () => {
        expect(result[RETURN_SEASONS.winterAllYear].returns).to.be.an.array().length(1);
        expect(result[RETURN_SEASONS.winterAllYear].returns[0].isSummer).to.equal(false);
      });
    });
  });
});
