'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Region = require('../../../src/lib/models/region');

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580';

experiment('lib/models/region', () => {
  let region;

  experiment('constructor', () => {
    test('can be called with no arguments', async () => {
      region = new Region();
      expect(region.id).to.be.undefined();
      expect(region.type).to.be.undefined();
    });

    test('can be called with an ID only', async () => {
      region = new Region(TEST_GUID);
      expect(region.id).to.equal(TEST_GUID);
      expect(region.type).to.be.undefined();
    });

    test('can be called with an ID and type', async () => {
      region = new Region(TEST_GUID, Region.types.standardUnitChargeArea);
      expect(region.id).to.equal(TEST_GUID);
      expect(region.type).to.equal(Region.types.standardUnitChargeArea);
    });
  });

  experiment('properties', () => {
    beforeEach(async () => {
      region = new Region();
    });

    experiment('.type', () => {
      for (const type of ['region', 'EAAR', 'regionalChargeArea']) {
        test(`can set the type to "${type}"`, async () => {
          region.type = type;
          expect(region.type).to.equal(type);
        });
      }

      test('setting type to invalid value throws an error', async () => {
        const func = () => {
          region.type = 'invalid-value';
        };
        expect(func).throw();
      });
    });

    experiment('.name', () => {
      test('can set name to a string', async () => {
        region.name = 'Anglian';
        expect(region.name).to.equal('Anglian');
      });

      test('setting name to invalid value throws an error', async () => {
        const func = () => {
          region.name = 123;
        };
        expect(func).throw();
      });
    });

    experiment('.code', () => {
      test('can set code to an alphanumeric string', async () => {
        region.code = 'ABCD123';
        expect(region.code).to.equal('ABCD123');
      });

      test('setting code to invalid value throws an error', async () => {
        const func = () => {
          region.code = 123;
        };
        expect(func).throw();
      });
    });

    experiment('.numericCode', () => {
      test('can set numericCode to a number', async () => {
        region.numericCode = 123;
        expect(region.numericCode).to.equal(123);
      });

      test('setting numericCode to invalid value throws an error', async () => {
        const func = () => {
          region.numericCode = 'ABCD123';
        };
        expect(func).throw();
      });
    });
  });
});
