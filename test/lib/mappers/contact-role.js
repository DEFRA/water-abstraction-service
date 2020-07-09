'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const moment = require('moment');

const { expect } = require('@hapi/code');
const mapper = require('../../../src/lib/mappers/contact-role');

experiment('modules/billing/mappers/contact-role', () => {
  experiment('.crmToModel', () => {
    let mapped;
    let row;

    beforeEach(async () => {
      row = {
        roleId: '5774f9ac-94ef-4fa1-9d9c-8cda614d6f17',
        name: 'billing',
        dateCreated: '2020-05-04T15:06:49.058Z',
        dateUpdated: '2020-05-04T15:06:49.058Z'
      };

      mapped = mapper.crmToModel(row);
    });

    test('has the mapped id', async () => {
      expect(mapped.id).to.equal(row.roleId);
    });

    test('has the mapped name', async () => {
      expect(mapped.name).to.equal(row.name);
    });

    test('has the created date', async () => {
      expect(mapped.dateCreated).to.equal(moment(row.dateCreated));
    });

    test('has the mapped updated date', async () => {
      expect(mapped.dateUpdated).to.equal(moment(row.dateUpdated));
    });
  });
});
