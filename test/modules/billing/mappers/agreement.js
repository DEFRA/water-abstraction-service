const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const agreementMapper = require('../../../../src/modules/billing/mappers/agreement');
const Agreement = require('../../../../src/lib/models/agreement');

const data = {
  chargeLineWithAgreements: {
    section127Agreement: true,
    section130UAgreement: false,
    section130SAgreement: true,
    section130TAgreement: false,
    section130WAgreement: true
  },
  chargeLineWithoutAgreements: {
    section127Agreement: false,
    section130UAgreement: false,
    section130SAgreement: false,
    section130TAgreement: false,
    section130WAgreement: false
  }
};

experiment('modules/billing/mappers/agreement', () => {
  let result;

  experiment('.mapChargeToAgreements', () => {
    experiment('when there are no agreements', () => {
      beforeEach(async () => {
        result = agreementMapper.chargeToModels(data.chargeLineWithoutAgreements);
      });

      test('the result is an empty array', async () => {
        expect(result).to.equal([]);
      });
    });

    experiment('when there are agreements', () => {
      beforeEach(async () => {
        result = agreementMapper.chargeToModels(data.chargeLineWithAgreements);
      });

      test('the result is an array with 3 elements', async () => {
        expect(result).to.be.an.array().length(3);
      });

      test('the first agreement has the 127 code', async () => {
        expect(result[0] instanceof Agreement).to.be.true();
        expect(result[0].code).to.equal('S127');
      });

      test('the second agreement has the 130S code', async () => {
        expect(result[1] instanceof Agreement).to.be.true();
        expect(result[1].code).to.equal('S130S');
      });

      test('the third agreement has the 130W code', async () => {
        expect(result[2] instanceof Agreement).to.be.true();
        expect(result[2].code).to.equal('S130W');
      });
    });
  });
});
