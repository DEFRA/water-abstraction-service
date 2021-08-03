'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const Event = require('../../../../../src/lib/models/event');
const [config] = require('../../../../../src/modules/batch-notifications/config/paper-returns');

experiment('modules/batch-notifications/config/paper-returns', () => {
  experiment('schema', () => {
    let fullData;
    beforeEach(async () => {
      fullData = {
        forms: [{
          company: {
            name: 'Wild Stallions',
            type: 'organisation'
          },
          address: {
            addressLine1: 'test-address-line-1',
            addressLine2: 'test-address-line-2',
            addressLine3: 'test-address-line-3',
            addressLine4: 'test-address-line-4',
            town: 'test-town',
            county: 'test-county',
            postcode: 'test-postcode',
            country: 'test-country'
          },
          contact: {
            initials: 'BSP',
            middleInitials: 'S',
            title: 'Mr',
            firstName: 'Bill',
            lastName: 'Preston',
            suffix: 'Esq',
            department: 'Music',
            type: 'person',
            dataSource: 'nald'
          },
          returns: [
            { returnId: 'v1:1:AT/CURR/DAILY/01:9999999:2000-01-01:2000-03-31' },
            { returnId: 'v1:2:AT/CURR/DAILY/01:9999999:2000-01-01:2000-03-31' }
          ]
        }]
      };
    });

    test('validates for valid data', async () => {
      const { error } = config.schema.validate(fullData);
      expect(error).to.equal(undefined);
    });

    test('does not validate if the return id is not valid', async () => {
      fullData.forms[0].returns = [
        { returnId: 'one' }
      ];

      const { error } = config.schema.validate(fullData);
      expect(error).to.not.equal(null);
    });

    test('the company name must be present', async () => {
      delete fullData.forms[0].company.name;
      const { error } = config.schema.validate(fullData);
      expect(error).to.not.equal(null);
    });

    test('the company type must be present', async () => {
      delete fullData.forms[0].company.type;
      const { error } = config.schema.validate(fullData);
      expect(error).to.not.equal(null);
    });

    test('tolerates extra address data', async () => {
      fullData.forms[0].address.potatoes = 'mashed';
      const { error } = config.schema.validate(fullData);
      expect(error).to.equal(undefined);
    });

    test('tolerates extra company data', async () => {
      fullData.forms[0].company.potatoes = 'mashed';
      const { error } = config.schema.validate(fullData);
      expect(error).to.equal(undefined);
    });

    test('tolerates extra contact data', async () => {
      fullData.forms[0].contact.potatoes = 'mashed';
      const { error } = config.schema.validate(fullData);
      expect(error).to.equal(undefined);
    });

    test('tolerates extra return data', async () => {
      fullData.forms[0].returns[0].potatoes = 'mashed';
      const { error } = config.schema.validate(fullData);
      expect(error).to.equal(undefined);
    });
  });

  experiment('createEvent', () => {
    let event;
    let data;

    beforeEach(async () => {
      data = {
        testing: true,
        one: 1
      };
      event = config.createEvent('test@example.com', config, data);
    });

    test('returns an Event model', async () => {
      expect(event).to.be.instanceOf(Event);
    });

    test('sets the types to notification', async () => {
      expect(event.type).to.equal('notification');
    });

    test('sets the sub type to the config message type', async () => {
      expect(event.subtype).to.equal('paperReturnForms');
    });

    test('sets the issuer', async () => {
      expect(event.issuer).to.equal('test@example.com');
    });

    test('sets the metadata including the data', async () => {
      expect(event.metadata.options).to.equal(data);
      expect(event.metadata.name).to.equal(config.name);
    });

    test('sets the status to processing', async () => {
      expect(event.status).to.equal('processing');
    });
  });
});
