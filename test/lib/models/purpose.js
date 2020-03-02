'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Purpose = require('../../../src/lib/models/purpose');

experiment('lib/models/purpose', () => {
  let purpose;

  experiment('constructor', () => {
    test('can be called with no arguments', async () => {
      purpose = new Purpose();
      expect(purpose.id).to.be.undefined();
    });
  });

  experiment('properties', () => {
    beforeEach(async () => {
      purpose = new Purpose();
    });

    experiment('.type', () => {
      for (const type of ['primary', 'secondary', 'use']) {
        test(`can set the type to "${type}"`, async () => {
          purpose.type = type;
          expect(purpose.type).to.equal(type);
        });
      }

      test('setting type to invalid value throws an error', async () => {
        const func = () => {
          purpose.type = 'invalid-value';
        };
        expect(func).throw();
      });
    });

    experiment('.name', () => {
      test('can set name to a string', async () => {
        purpose.name = 'Watering onions';
        expect(purpose.name).to.equal('Watering onions');
      });

      test('setting name to invalid value throws an error', async () => {
        const func = () => {
          purpose.name = 123;
        };
        expect(func).throw();
      });
    });

    experiment('.code', () => {
      test('can set code to an alphanumeric string', async () => {
        purpose.code = 'ABCD123';
        expect(purpose.code).to.equal('ABCD123');
      });

      test('setting code to invalid value throws an error', async () => {
        const func = () => {
          purpose.code = 123;
        };
        expect(func).throw();
      });
    });
  });
});
