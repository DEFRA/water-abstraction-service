'use strict';

const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const testHelpers = require('../../../test-helpers');
const routes = require('../../../../src/modules/licences/routes/licences');

experiment('modules/licences/routes/licences', () => {
  experiment('.getLicence', () => {
    let server;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getLicence);
    });

    test('validates the licence id must be a uuid', async () => {
      const url = '/water/1.0/licences/not-a-valid-id';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('allows a valid uuid for the licence id', async () => {
      const url = `/water/1.0/licences/${uuid()}`;
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });
  });

  experiment('.getLicenceVersions', () => {
    let server;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getLicenceVersions);
    });

    test('validates the licence id must be a uuid', async () => {
      const url = '/water/1.0/licences/not-a-valid-id/versions';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('allows a valid uuid for the licence id', async () => {
      const url = `/water/1.0/licences/${uuid()}/versions`;
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });
  });

  experiment('.getLicenceAccountsByRefAndDate', () => {
    let server;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getLicenceAccountsByRefAndDate);
    });

    test('validates the documentRef must be a string', async () => {
      const url = '/water/1.0/licences/licence-accounts?date=2020-01-01';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('validates the date must be a string', async () => {
      const url = '/water/1.0/licences/licence-accounts?documentRef=12345';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('allows a string for the documentRef and date', async () => {
      const url = '/water/1.0/licences/licence-accounts?documentRef=12345&date=2020-01-01';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });
  });

  experiment('.getLicenceDocument', () => {
    let server;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getLicenceDocument);
    });

    test('validates the licence id must be a uuid', async () => {
      const url = '/water/1.0/licences/not-a-valid-id/document';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('allows a valid uuid for the licence id', async () => {
      const url = `/water/1.0/licences/${uuid()}/document`;
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });
  });

  experiment('.getValidLicenceDocumentByDate', () => {
    let server;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getValidLicenceDocumentByDate);
    });

    test('validates the licence id must be a uuid', async () => {
      const url = '/water/1.0/licences/not-a-valid-id/valid-documents/2020-04-01';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('validates the date must be a date', async () => {
      const url = `/water/1.0/licences/${uuid()}/valid-documents/not-a-date`;
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('allows a valid uuid for the licence id and date for date', async () => {
      const url = `/water/1.0/licences/${uuid()}/valid-documents/2020-04-01`;
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });
  });
});
