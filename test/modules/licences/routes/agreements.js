'use strict';

const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const testHelpers = require('../../../test-helpers');
const routes = require('../../../../src/modules/licences/routes/agreements');

experiment('modules/licences/routes/agreements', () => {
  experiment('.getAgreement', () => {
    let server;

    beforeEach(async () => {
      server = testHelpers.createServerForRoute(routes.getAgreement);
    });

    test('validates the agreementId must be a uuid', async () => {
      const url = '/water/1.0/agreements/not-a-valid-id';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('allows a valid uuid for the agreement id', async () => {
      const url = `/water/1.0/agreements/${uuid()}`;
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });
  });

  experiment('.getAgreementsForLicence', () => {
    let server;

    beforeEach(async () => {
      server = testHelpers.createServerForRoute(routes.getAgreementsForLicence);
    });

    test('validates the licence id must be a uuid', async () => {
      const url = '/water/1.0/licences/not-a-valid-id/agreements';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('allows a valid uuid for the licence id', async () => {
      const url = `/water/1.0/licences/${uuid()}/agreements`;
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });
  });
});
