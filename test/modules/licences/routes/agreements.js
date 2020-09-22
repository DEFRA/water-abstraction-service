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
      server = await testHelpers.createServerForRoute(routes.getAgreement);
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
      server = await testHelpers.createServerForRoute(routes.getAgreementsForLicence);
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

  experiment('.deleteAgreement', () => {
    let server, request;

    beforeEach(async () => {
      request = {
        method: 'DELETE',
        url: `/water/1.0/agreements/${uuid()}`,
        headers: {
          'defra-internal-user-id': 1234
        }
      };
      server = await testHelpers.createServerForRoute(routes.deleteAgreement);
    });

    test('validates the agreement id must be a uuid', async () => {
      request.url = '/water/1.0/agreements/not-a-valid-id';
      const output = await server.inject(request);
      expect(output.statusCode).to.equal(400);
    });

    test('allows a valid uuid for the agreement id', async () => {
      const output = await server.inject(request);
      expect(output.statusCode).to.equal(200);
    });

    test('validates the calling user id is supplied', async () => {
      request.headers = {};
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('validates the calling user id is a number', async () => {
      request.headers['defra-internal-user-id'] = 'a string';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });
});
