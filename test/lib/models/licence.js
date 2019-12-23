'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Licence = require('../../../src/lib/models/licence');
const Region = require('../../../src/lib/models/region');

const data = {
  id: 'add1cf3b-7296-4817-b013-fea75a928580',
  licenceNumber: '01/12/*G/R01',
  region: new Region('d61551ec-7182-42dc-bb90-c1dbecaf1350', Region.types.region)
};

experiment('lib/models/licence', () => {
  let licence;

  beforeEach(async () => {
    licence = new Licence();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      licence.id = data.id;
      expect(licence.id).to.equal(data.id);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        licence.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.licenceNumber', () => {
    test('can be set to a valid licence number', async () => {
      licence.licenceNumber = data.licenceNumber;
      expect(licence.licenceNumber).to.equal(data.licenceNumber);
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        licence.licenceNumber = null;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to an invalid licence number', async () => {
      const func = () => {
        licence.licenceNumber = '01/123/£$';
      };
      expect(func).to.throw();
    });
  });

  experiment('.toJSON', () => {
    test('returns the expected object', async () => {
      licence.id = data.id;
      licence.licenceNumber = data.licenceNumber;

      expect(licence.toJSON()).to.equal({
        id: data.id,
        licenceNumber: data.licenceNumber
      });
    });
  });

  // Region fields
  experiment('.region', async () => {
    test('can be set to a region instance', async () => {
      licence.region = data.region;
      expect(licence.region).to.equal(data.region);
    });

    test('throws an error if set to a value which is not an instance of Region', async () => {
      const func = () => {
        licence.region = {};
      };
      expect(func).to.throw();
    });
  });

  experiment('.historicalArea', async () => {
    test('can be set to a region instance', async () => {
      licence.historicalArea = data.region;
      expect(licence.historicalArea).to.equal(data.region);
    });

    test('throws an error if set to a value which is not an instance of Region', async () => {
      const func = () => {
        licence.historicalArea = {};
      };
      expect(func).to.throw();
    });
  });

  experiment('.standardUnitChargeArea', async () => {
    test('can be set to a region instance', async () => {
      licence.standardUnitChargeArea = data.region;
      expect(licence.standardUnitChargeArea).to.equal(data.region);
    });

    test('throws an error if set to a value which is not an instance of Region', async () => {
      const func = () => {
        licence.standardUnitChargeArea = {};
      };
      expect(func).to.throw();
    });
  });

  experiment('.environmentalImprovementUnitChargeArea', async () => {
    test('can be set to a region instance', async () => {
      licence.environmentalImprovementUnitChargeArea = data.region;
      expect(licence.environmentalImprovementUnitChargeArea).to.equal(data.region);
    });

    test('throws an error if set to a value which is not an instance of Region', async () => {
      const func = () => {
        licence.environmentalImprovementUnitChargeArea = {};
      };
      expect(func).to.throw();
    });
  });
});
