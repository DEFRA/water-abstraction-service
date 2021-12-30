'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const moment = require('moment');

const ChargeVersion = require('../../../src/lib/models/charge-version');
const ChargeElement = require('../../../src/lib/models/charge-element');

const DateRange = require('../../../src/lib/models/date-range');
const Licence = require('../../../src/lib/models/licence');
const Region = require('../../../src/lib/models/region');
const Company = require('../../../src/lib/models/company');
const InvoiceAccount = require('../../../src/lib/models/invoice-account');
const ChangeReason = require('../../../src/lib/models/change-reason');
const User = require('../../../src/lib/models/user');

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580';

class TestModel {};

experiment('lib/models/charge-version', () => {
  let chargeVersion;

  beforeEach(async () => {
    chargeVersion = new ChargeVersion();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      chargeVersion.id = TEST_GUID;
      expect(chargeVersion.id).to.equal(TEST_GUID);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        chargeVersion.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.licence', () => {
    test('can be set to a Licence instance', async () => {
      const licence = new Licence();
      chargeVersion.licence = licence;
      expect(chargeVersion.licence).to.equal(licence);
    });

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        chargeVersion.licence = new TestModel();
      };
      expect(func).to.throw();
    });
  });

  experiment('.scheme', () => {
    ['alcs', 'sroc'].forEach(scheme => {
      test(`can be set to "${scheme}"`, async () => {
        chargeVersion.scheme = scheme;
        expect(chargeVersion.scheme).to.equal(scheme);
      });
    });

    test('throws an error if set to a different scheme', async () => {
      const func = () => {
        chargeVersion.scheme = 'not-a-valid-scheme';
      };
      expect(func).to.throw();
    });
  });

  experiment('.versionNumber', () => {
    test('can be set to a positive integer', async () => {
      chargeVersion.versionNumber = 1;
      expect(chargeVersion.versionNumber).to.equal(1);
    });

    test('throws an error if set to a different type', async () => {
      const func = () => {
        chargeVersion.versionNumber = 'not-an-integer';
      };
      expect(func).to.throw();
    });

    test('throws an error if set to zero', async () => {
      const func = () => {
        chargeVersion.versionNumber = 0;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a negative integer', async () => {
      const func = () => {
        chargeVersion.versionNumber = -56;
      };
      expect(func).to.throw();
    });

    test('throws an error if set to a float', async () => {
      const func = () => {
        chargeVersion.versionNumber = 44.23;
      };
      expect(func).to.throw();
    });
  });

  experiment('.dateRange', () => {
    test('can be set to a DateRange instance', async () => {
      const dateRange = new DateRange('2019-09-01', null);
      chargeVersion.dateRange = dateRange;
      expect(chargeVersion.dateRange).to.equal(dateRange);
    });

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        chargeVersion.dateRange = new TestModel();
      };
      expect(func).to.throw();
    });
  });

  experiment('.status', () => {
    ['draft', 'current', 'superseded'].forEach(status => {
      test(`can be set to "${status}"`, async () => {
        chargeVersion.status = status;
        expect(chargeVersion.status).to.equal(status);
      });
    });

    test('throws an error if set to a different status', async () => {
      const func = () => {
        chargeVersion.status = 'not-a-valid-status';
      };
      expect(func).to.throw();
    });
  });

  experiment('.region', () => {
    test('can be set to a Region instance', async () => {
      const region = new Region();
      chargeVersion.region = region;
      expect(chargeVersion.region).to.equal(region);
    });

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        chargeVersion.region = new TestModel();
      };
      expect(func).to.throw();
    });
  });

  experiment('.source', () => {
    ['nald', 'wrls'].forEach(source => {
      test(`can be set to "${source}"`, async () => {
        chargeVersion.source = source;
        expect(chargeVersion.source).to.equal(source);
      });
    });

    test('throws an error if set to a different source', async () => {
      const func = () => {
        chargeVersion.source = 'not-a-valid-source';
      };
      expect(func).to.throw();
    });
  });

  experiment('.company', () => {
    test('can be set to a Company instance', async () => {
      const company = new Company();
      chargeVersion.company = company;
      expect(chargeVersion.company).to.equal(company);
    });

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        chargeVersion.company = new TestModel();
      };
      expect(func).to.throw();
    });
  });

  experiment('.invoiceAccount', () => {
    test('can be set to a InvoiceAccount instance', async () => {
      const invoiceAccount = new InvoiceAccount();
      chargeVersion.invoiceAccount = invoiceAccount;
      expect(chargeVersion.invoiceAccount).to.equal(invoiceAccount);
    });

    test('can be set to null', async () => {
      chargeVersion.invoiceAccount = null;
      expect(chargeVersion.invoiceAccount).to.equal(null);
    });

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        chargeVersion.invoiceAccount = new TestModel();
      };
      expect(func).to.throw();
    });
  });

  experiment('.apportionment', () => {
    test('can be set to true', async () => {
      chargeVersion.apportionment = true;
      expect(chargeVersion.apportionment).to.equal(true);
    });

    test('can be set to false', async () => {
      chargeVersion.apportionment = false;
      expect(chargeVersion.apportionment).to.equal(false);
    });

    test('cannot be set to an invalid value', async () => {
      const func = () => {
        chargeVersion.apportionment = 123;
      };
      expect(func).to.throw();
    });
  });

  experiment('.error', () => {
    test('can be set to true', async () => {
      chargeVersion.error = true;
      expect(chargeVersion.error).to.equal(true);
    });

    test('can be set to false', async () => {
      chargeVersion.error = false;
      expect(chargeVersion.error).to.equal(false);
    });

    test('cannot be set to an invalid value', async () => {
      const func = () => {
        chargeVersion.error = 123;
      };
      expect(func).to.throw();
    });
  });

  experiment('.billedUpToDate', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = (new Date()).toISOString();
      chargeVersion.billedUpToDate = dateString;

      expect(chargeVersion.billedUpToDate).to.equal(moment(dateString));
    });

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date();
      chargeVersion.billedUpToDate = date;

      expect(chargeVersion.billedUpToDate).to.equal(moment(date));
    });

    test('can be set using a moment', async () => {
      const now = moment();

      chargeVersion.billedUpToDate = now;

      expect(chargeVersion.billedUpToDate).to.equal(now);
    });

    test('throws for an invalid string', async () => {
      const dateString = 'not a date';

      expect(() => {
        chargeVersion.billedUpToDate = dateString;
      }).to.throw();
    });

    test('throws for a boolean value', async () => {
      expect(() => {
        chargeVersion.billedUpToDate = true;
      }).to.throw();
    });

    test('allows null', async () => {
      chargeVersion.billedUpToDate = null;
      expect(chargeVersion.billedUpToDate).to.be.null();
    });
  });

  experiment('.chargeElements', () => {
    test('can be set to an array of charge elements', async () => {
      const chargeElements = [new ChargeElement()];
      chargeVersion.chargeElements = chargeElements;
      expect(chargeVersion.chargeElements).to.equal(chargeElements);
    });

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        const notChargeElements = [new TestModel()];
        chargeVersion.chargeElements = notChargeElements;
      };
      expect(func).to.throw();
    });
  });

  experiment('.changeReason', () => {
    test('can be set to a ChangeReason instance', async () => {
      const changeReason = new ChangeReason();
      chargeVersion.changeReason = changeReason;
      expect(chargeVersion.changeReason).to.equal(changeReason);
    });

    test('can be set to null', async () => {
      chargeVersion.changeReason = null;
      expect(chargeVersion.changeReason).to.be.null();
    });

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        const notChargeElements = [new TestModel()];
        chargeVersion.chargeElements = notChargeElements;
      };
      expect(func).to.throw();
    });
  });

  experiment('.createdBy', () => {
    const user = new User();

    test('can be set to a User instance', async () => {
      chargeVersion.createdBy = user;
      expect(chargeVersion.createdBy).to.equal(user);
    });

    test('can be set to null', async () => {
      chargeVersion.createdBy = null;
      expect(chargeVersion.createdBy).to.be.null();
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        chargeVersion.createdBy = new TestModel();
      };
      expect(func).to.throw();
    });
  });

  experiment('.approvedBy', () => {
    const user = new User();

    test('can be set to a User instance', async () => {
      chargeVersion.approvedBy = user;
      expect(chargeVersion.approvedBy).to.equal(user);
    });

    test('can be set to null', async () => {
      chargeVersion.approvedBy = null;
      expect(chargeVersion.approvedBy).to.be.null();
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        chargeVersion.approvedBy = new TestModel();
      };
      expect(func).to.throw();
    });
  });
});
