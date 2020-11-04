'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Role = require('../../../src/lib/models/role');
const Contact = require('../../../src/lib/models/contact-v2');
const Company = require('../../../src/lib/models/company');
const Address = require('../../../src/lib/models/address');

const data = {
  id: '4765cb29-5c87-4b14-88c2-37ef2a0eac41',
  startDate: '2008-01-01',
  endDate: '2012-12-21',
  roleName: 'licenceHolder',
  company: new Company(),
  contact: new Contact(),
  address: new Address()
};

experiment('lib/models/licence', () => {
  let role;

  beforeEach(async () => {
    role = new Role();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      role.id = data.id;
      expect(role.id).to.equal(data.id);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        role.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.startDate', () => {
    test('can be set to a valid date', async () => {
      role.startDate = data.startDate;
      expect(role.startDate).to.equal(data.startDate);
    });

    test('throws an error if date is not valid', async () => {
      const func = () => {
        role.startDate = '2018-14-40';
      };
      expect(func).to.throw();
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        role.startDate = null;
      };
      expect(func).to.throw();
    });
  });

  experiment('.endDate', () => {
    test('can be set to a valid date', async () => {
      role.endDate = data.endDate;
      expect(role.endDate).to.equal(data.endDate);
    });

    test('can be set to null', async () => {
      role.endDate = null;
      expect(role.endDate).to.be.null();
    });

    test('throws an error if date is not valid', async () => {
      const func = () => {
        role.endDate = '2018-14-40';
      };
      expect(func).to.throw();
    });
  });

  experiment('.roleName', () => {
    test('can be set to a valid option', async () => {
      role.roleName = data.roleName;
      expect(role.roleName).to.equal(data.roleName);
    });

    test('throws an error if role is not valid', async () => {
      const func = () => {
        role.roleName = 'waterUndertaker';
      };
      expect(func).to.throw();
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        role.roleName = null;
      };
      expect(func).to.throw();
    });
  });

  experiment('.isRoleName', () => {
    test('returns true when the role name matches one of the arguments', async () => {
      role.roleName = Role.ROLE_NAMES.licenceHolder;
      expect(role.isRoleName(Role.ROLE_NAMES.licenceHolder, Role.ROLE_NAMES.returnsTo)).to.be.true();
    });

    test('returns false when the role name does not match any of the arguments', async () => {
      role.roleName = Role.ROLE_NAMES.billing;
      expect(role.isRoleName(Role.ROLE_NAMES.licenceHolder, Role.ROLE_NAMES.returnsTo)).to.be.false();
    });
  });

  experiment('.company', () => {
    test('can be set to a Company instance', async () => {
      role.company = data.company;
      expect(role.company).to.equal(data.company);
    });

    test('throws an error if set to an invalid type', async () => {
      const func = () => {
        role.company = 'company';
      };
      expect(func).to.throw();
    });
  });

  experiment('.contact', () => {
    test('can be set to a Contact instance', async () => {
      role.contact = data.contact;
      expect(role.contact).to.equal(data.contact);
    });

    test('throws an error if set to an invalid type', async () => {
      const func = () => {
        role.contact = data.company;
      };
      expect(func).to.throw();
    });
  });

  experiment('.address', () => {
    test('can be set to a Address instance', async () => {
      role.address = data.address;
      expect(role.address).to.equal(data.address);
    });

    test('throws an error if set to an invalid type', async () => {
      const func = () => {
        role.address = null;
      };
      expect(func).to.throw();
    });
  });
});
