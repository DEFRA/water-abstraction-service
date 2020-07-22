'use strict';

const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sandbox = require('sinon').createSandbox();

const companiesHouseService = require('../../../src/modules/companies-house/services/companies-house-service');
const controller = require('../../../src/modules/companies-house/controller');

experiment('modules/companies-house/controller', () => {
  beforeEach(async () => {
    sandbox.stub(companiesHouseService, 'searchCompanies').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getCompaniesHouseCompanies', () => {
    const request = {
      query: {
        page: 1,
        q: 'Big Co'
      }
    };

    beforeEach(async () => {
      await controller.getCompaniesHouseCompanies(request);
    });

    test('calls companies house service with query string and page', async () => {
      const [q, page] = companiesHouseService.searchCompanies.lastCall.args;
      expect(q).to.equal(request.query.q);
      expect(page).to.equal(request.query.page);
    });
  });
});
