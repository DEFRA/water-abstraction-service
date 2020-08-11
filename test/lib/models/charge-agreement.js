'use strict';

const moment = require('moment');
const uuid = require('uuid/v4');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ChargeAgreement = require('../../../src/lib/models/charge-agreement');

experiment('lib/models/charge-agreement', () => {
  let agreement;

  beforeEach(async () => {
    agreement = new ChargeAgreement();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      const id = uuid();
      agreement.id = id;
      expect(agreement.id).to.equal(id);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        agreement.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.code', () => {
    const codes = ['S126', 'S127', 'S130', 'S130U', 'S130S', 'S130T', 'S130W'];

    codes.forEach(code => {
      test(`can be set to ${code}`, async () => {
        agreement.code = code;
        expect(agreement.code).to.equal(code);
      });
    });

    test('cannot be set to an invalid type', async () => {
      const func = () => {
        agreement.code = 'invalid_type';
      };
      expect(func).to.throw();
    });
  });

  experiment('.startDate', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z';
      agreement.startDate = dateString;
      expect(agreement.startDate).to.equal(moment(dateString));
    });

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date();
      agreement.startDate = date;
      expect(agreement.startDate).to.equal(moment(date));
    });

    test('can be set using a moment', async () => {
      const now = moment();
      agreement.startDate = now;
      expect(agreement.startDate).to.equal(now);
    });

    test('throws for an invalid string', async () => {
      const dateString = 'not a date';

      expect(() => {
        agreement.startDate = dateString;
      }).to.throw();
    });

    test('throws for a boolean value', async () => {
      expect(() => {
        agreement.startDate = true;
      }).to.throw();
    });

    test('throws for null', async () => {
      expect(() => {
        agreement.startDate = null;
      }).to.throw();
    });
  });

  experiment('.endDate', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z';
      agreement.endDate = dateString;
      expect(agreement.endDate).to.equal(moment(dateString));
    });

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date();
      agreement.endDate = date;
      expect(agreement.endDate).to.equal(moment(date));
    });

    test('can be set using a moment', async () => {
      const now = moment();
      agreement.endDate = now;
      expect(agreement.endDate).to.equal(now);
    });

    test('throws for an invalid string', async () => {
      const dateString = 'not a date';

      expect(() => {
        agreement.endDate = dateString;
      }).to.throw();
    });

    test('throws for a boolean value', async () => {
      expect(() => {
        agreement.endDate = true;
      }).to.throw();
    });

    test('allows null', async () => {
      agreement.endDate = null;
      expect(agreement.endDate).to.be.null();
    });
  });

  experiment('.dateCreated', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z';
      agreement.dateCreated = dateString;
      expect(agreement.dateCreated).to.equal(moment(dateString));
    });

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date();
      agreement.dateCreated = date;
      expect(agreement.dateCreated).to.equal(moment(date));
    });

    test('can be set using a moment', async () => {
      const now = moment();
      agreement.dateCreated = now;
      expect(agreement.dateCreated).to.equal(now);
    });

    test('throws for an invalid string', async () => {
      const dateString = 'not a date';

      expect(() => {
        agreement.dateCreated = dateString;
      }).to.throw();
    });

    test('throws for a boolean value', async () => {
      expect(() => {
        agreement.dateCreated = true;
      }).to.throw();
    });

    test('allows null', async () => {
      agreement.dateCreated = null;
      expect(agreement.dateCreated).to.be.null();
    });
  });

  experiment('.dateUpdated', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z';
      agreement.dateUpdated = dateString;
      expect(agreement.dateUpdated).to.equal(moment(dateString));
    });

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date();
      agreement.dateUpdated = date;
      expect(agreement.dateUpdated).to.equal(moment(date));
    });

    test('can be set using a moment', async () => {
      const now = moment();
      agreement.dateUpdated = now;
      expect(agreement.dateUpdated).to.equal(now);
    });

    test('throws for an invalid string', async () => {
      const dateString = 'not a date';

      expect(() => {
        agreement.dateUpdated = dateString;
      }).to.throw();
    });

    test('throws for a boolean value', async () => {
      expect(() => {
        agreement.dateUpdated = true;
      }).to.throw();
    });

    test('allows null', async () => {
      agreement.dateUpdated = null;
      expect(agreement.dateUpdated).to.be.null();
    });
  });
});
