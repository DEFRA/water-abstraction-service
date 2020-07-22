'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const CompanyAddress = require('../../../src/lib/models/company-address');
const Address = require('../../../src/lib/models/address');
const DateRange = require('../../../src/lib/models/date-range');

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580';

experiment('lib/models/company-address', () => {
  let companyAddress;

  beforeEach(async () => {
    companyAddress = new CompanyAddress();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      companyAddress.id = TEST_GUID;
      expect(companyAddress.id).to.equal(TEST_GUID);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        companyAddress.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.companyId', () => {
    test('can be set to a guid string', async () => {
      companyAddress.companyId = TEST_GUID;
      expect(companyAddress.companyId).to.equal(TEST_GUID);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        companyAddress.companyId = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.address', () => {
    test('can be set to a valid Address', async () => {
      const address = new Address();
      companyAddress.address = address;
      expect(companyAddress.address).to.equal(address);
    });

    test('throws an error if set to another model', async () => {
      const func = () => {
        companyAddress.address = new DateRange();
      };
      expect(func).to.throw();
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        companyAddress.address = null;
      };
      expect(func).to.throw();
    });
  });

  experiment('.roleName', () => {
    CompanyAddress.ROLE_NAMES.forEach(role => {
      test(`can be set to a ${role}`, async () => {
        companyAddress.roleName = role;
        expect(companyAddress.roleName).to.equal(role);
      });
    });

    test('throws an error if set to unexpected value', async () => {
      const func = () => {
        companyAddress.roleName = 'invalid-role';
      };
      expect(func).to.throw();
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        companyAddress.roleName = null;
      };
      expect(func).to.throw();
    });
  });

  experiment('.isDefault', () => {
    test('can be set to a boolean', async () => {
      companyAddress.isDefault = true;
      expect(companyAddress.isDefault).to.equal(true);
    });

    test('throws an error if set to anything other than a boolean', async () => {
      const func = () => {
        companyAddress.isDefault = 'yeap';
      };
      expect(func).to.throw();
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        companyAddress.isDefault = null;
      };
      expect(func).to.throw();
    });
  });

  experiment('.dateRange', () => {
    let dateRange;

    beforeEach(async () => {
      dateRange = new DateRange('2019-04-01', '2020-03-31');
    });

    test('can be set to a DateRange object', async () => {
      companyAddress.dateRange = dateRange;
      expect(companyAddress.dateRange).to.equal(dateRange);
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        companyAddress.dateRange = new Address();
      };

      expect(func).to.throw();
    });
  });
});
