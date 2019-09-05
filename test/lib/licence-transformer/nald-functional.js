const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const naldFunctional = require('../../../src/lib/licence-transformer/nald-functional');

experiment('lib/licence-transformer/nald-functional', () => {
  experiment('.addressFormatter', () => {
    test('maps the expected data', async () => {
      const address = naldFunctional.addressFormatter({
        ADDR_LINE1: 'address_line1',
        ADDR_LINE2: 'address_line2',
        ADDR_LINE3: 'address_line3',
        ADDR_LINE4: 'address_line4',
        TOWN: 'town',
        COUNTY: 'county',
        POSTCODE: 'postcode',
        COUNTRY: 'country'
      });

      expect(address).to.equal({
        addressLine1: 'address_line1',
        addressLine2: 'address_line2',
        addressLine3: 'address_line3',
        addressLine4: 'address_line4',
        town: 'town',
        county: 'county',
        postcode: 'postcode',
        country: 'country'
      });
    });
  });

  experiment('.findCurrent', () => {
    test('returns undefined if no versions ', async () => {
      const current = naldFunctional.findCurrent();
      expect(current).to.be.undefined();
    });

    test('returns undefined if no current version ', async () => {
      const current = naldFunctional.findCurrent([
        { STATUS: 'DRAFT' },
        { STATUS: 'DRAFT' }
      ]);
      expect(current).to.be.undefined();
    });

    test('returns the expected current version', async () => {
      const current = naldFunctional.findCurrent([
        { STATUS: 'DRAFT' },
        { STATUS: 'CURR', test: true }
      ]);

      expect(current).to.equal(
        { STATUS: 'CURR', test: true }
      );
    });
  });
});
