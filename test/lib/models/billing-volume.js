'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const BillingVolume = require('../../../src/lib/models/billing-volume');
const FinancialYear = require('../../../src/lib/models/financial-year');
const User = require('../../../src/lib/models/user');

class TestModel { };

experiment('lib/models/billingVolume', () => {
  let billingVolume;

  beforeEach(async () => {
    billingVolume = new BillingVolume();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      const id = uuid();
      billingVolume.id = id;
      expect(billingVolume.id).to.equal(id);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        billingVolume.id = '1234';
      };
      expect(func).to.throw();
    });
  });

  experiment('.chargeElementId', () => {
    const chargeElementId = uuid();

    test('can be set to a guid string', async () => {
      billingVolume.chargeElementId = chargeElementId;
      expect(billingVolume.chargeElementId).to.equal(chargeElementId);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        billingVolume.chargeElementId = '1234';
      };
      expect(func).to.throw();
    });
  });

  experiment('.financialYear', () => {
    test('can be set to a FinancialYear instance', async () => {
      const financialYear = new FinancialYear(2019);
      billingVolume.financialYear = financialYear;
      expect(billingVolume.financialYear.endYear).to.equal(2019);
    });

    test('cannot be set to a different model', async () => {
      const func = () => {
        billingVolume.financialYear = new TestModel();
      };
      expect(func).to.throw();
    });
  });

  experiment('.isSummer', () => {
    test('can be set to a boolean', async () => {
      billingVolume.isSummer = true;
      expect(billingVolume.isSummer).to.equal(true);
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        billingVolume.twoPartTariffError = null;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to undefined', async () => {
      const func = () => {
        billingVolume.twoPartTariffError = undefined;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        billingVolume.twoPartTariffError = 'not-a-boolean';
      };
      expect(func).to.throw();
    });
  });

  experiment('.calculatedVolume', () => {
    test('can be set to a positive number', async () => {
      billingVolume.calculatedVolume = 4.465;
      expect(billingVolume.calculatedVolume).to.equal(4.465);
    });

    test('can be set to null', async () => {
      billingVolume.calculatedVolume = null;
      expect(billingVolume.calculatedVolume).to.be.null();
    });

    test('throws an error if set to negative number', async () => {
      const func = () => {
        billingVolume.calculatedVolume = -28.385;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        billingVolume.calculatedVolume = 'a string';
      };
      expect(func).to.throw();
    });
  });

  experiment('.twoPartTariffError', () => {
    test('can be set to a boolean', async () => {
      billingVolume.twoPartTariffError = true;
      expect(billingVolume.twoPartTariffError).to.equal(true);
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        billingVolume.twoPartTariffError = null;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to undefined', async () => {
      const func = () => {
        billingVolume.twoPartTariffError = undefined;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        billingVolume.twoPartTariffError = 'not-a-boolean';
      };
      expect(func).to.throw();
    });
  });

  experiment('.twoPartTariffStatus', () => {
    for (const status of [10, 20, 30, 40, 50, 60, 70]) {
      test(`can set the twoPartTariffStatus to "${status}"`, async () => {
        billingVolume.twoPartTariffStatus = status;
        expect(billingVolume.twoPartTariffStatus).to.equal(status);
      });
    }

    test('can be set to null', async () => {
      billingVolume.twoPartTariffStatus = null;
      expect(billingVolume.twoPartTariffStatus).to.be.null();
    });

    test('setting twoPartTariffStatus to invalid value throws an error', async () => {
      const func = () => {
        billingVolume.twoPartTariffStatus = 600;
      };
      expect(func).throw();
    });
  });

  experiment('.twoPartTariffReview', () => {
    const twoPartTariffReview = new User();

    test('can be set to a User instance', async () => {
      billingVolume.twoPartTariffReview = twoPartTariffReview;
      expect(billingVolume.twoPartTariffReview).to.equal(twoPartTariffReview);
    });

    test('can be set to null', async () => {
      billingVolume.twoPartTariffReview = null;
      expect(billingVolume.twoPartTariffReview).to.be.null();
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        billingVolume.twoPartTariffReview = new TestModel();
      };
      expect(func).to.throw();
    });
  });

  experiment('.isApproved', () => {
    test('can be set to a boolean', async () => {
      billingVolume.isApproved = true;
      expect(billingVolume.isApproved).to.equal(true);
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        billingVolume.isApproved = null;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to undefined', async () => {
      const func = () => {
        billingVolume.isApproved = undefined;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        billingVolume.isApproved = 'not-a-boolean';
      };
      expect(func).to.throw();
    });
  });

  experiment('.volume', () => {
    test('can be set to a positive number', async () => {
      billingVolume.volume = 4.465;
      expect(billingVolume.volume).to.equal(4.465);
    });

    test('can be set to null', async () => {
      billingVolume.volume = null;
      expect(billingVolume.volume).to.be.null();
    });

    test('throws an error if set to negative number', async () => {
      const func = () => {
        billingVolume.volume = -28.385;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        billingVolume.volume = 'a string';
      };
      expect(func).to.throw();
    });
  });

  experiment('.toJSON', () => {
    test('returns the expected object', async () => {
      const billingVolume = new BillingVolume();
      billingVolume.id = uuid();
      billingVolume.chargeElementId = uuid();
      billingVolume.calculatedVolume = 25;

      expect(billingVolume.toJSON()).to.equal({
        id: billingVolume.id,
        chargeElementId: billingVolume.chargeElementId,
        calculatedVolume: billingVolume.calculatedVolume
      });
    });
  });
});
