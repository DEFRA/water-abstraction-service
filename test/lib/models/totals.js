const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Totals = require('../../../src/lib/models/totals');

experiment('lib/models/totals', () => {
  let totals;

  beforeEach(async () => {
    totals = new Totals();
  });

  const positiveOrZeroIntegerExperiment = key => experiment(`.${key}`, () => {
    test('can be set to positive integer', async () => {
      totals[key] = 5;
      expect(totals[key]).to.equal(5);
    });

    test('can be set to zero', async () => {
      totals[key] = 0;
      expect(totals[key]).to.equal(0);
    });

    test('cannot be set to a decimal', async () => {
      const func = () => { totals[key] = 0.55; };
      expect(func).to.throw();
    });

    test('cannot be set to a negative number', async () => {
      const func = () => { totals[key] = -1; };
      expect(func).to.throw();
    });
  });

  const negativeOrZeroIntegerExperiment = key => experiment(`.${key}`, () => {
    test('can be set to negative integer', async () => {
      totals[key] = -5;
      expect(totals[key]).to.equal(-5);
    });

    test('can be set to zero', async () => {
      totals[key] = 0;
      expect(totals[key]).to.equal(0);
    });

    test('cannot be set to a decimal', async () => {
      const func = () => { totals[key] = -0.55; };
      expect(func).to.throw();
    });

    test('cannot be set to a positive number', async () => {
      const func = () => { totals[key] = 1; };
      expect(func).to.throw();
    });
  });

  [
    'creditNoteCount',
    'invoiceCount',
    'invoiceValue'
  ].map(positiveOrZeroIntegerExperiment);

  [
    'creditNoteValue'
  ].map(negativeOrZeroIntegerExperiment);

  experiment('.netTotal', () => {
    test('can be set to positive integer', async () => {
      totals.netTotal = 5;
      expect(totals.netTotal).to.equal(5);
    });

    test('can be set to zero', async () => {
      totals.netTotal = 0;
      expect(totals.netTotal).to.equal(0);
    });

    test('cannot be set to a decimal', async () => {
      const func = () => { totals.netTotal = 0.55; };
      expect(func).to.throw();
    });

    test('can be set to a negative number', async () => {
      totals.netTotal = -1;
      expect(totals.netTotal).to.equal(-1);
    });
  });
});
