'use strict';

const { expect } = require('@hapi/code');

const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const testHelpers = require('../../test-helpers');
const routes = require('../../../src/modules/licences/routes');
const id = '00000000-0000-0000-0000-000000000000';

experiment('modules/licences/routes', () => {
  experiment('/documents/{documentId}/licence', () => {
    let server;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getLicenceByDocumentId);
    });

    test('validates the documentId must be a GUID', async () => {
      const url = '/water/1.0/documents/not-a-guid/licence';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('allows a valid guid for documentId', async () => {
      const url = '/water/1.0/documents/00000000-0000-0000-0000-000000000000/licence';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });
  });

  experiment('/documents/{documentId}/licence/conditions', () => {
    let server;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getLicenceConditionsByDocumentId);
    });

    test('validates the documentId must be a GUID', async () => {
      const url = '/water/1.0/documents/not-a-guid/licence/conditions';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('allows a valid guid for documentId', async () => {
      const url = `/water/1.0/documents/${id}/licence/conditions`;
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });
  });

  experiment('/documents/{documentId}/licence/points', () => {
    let server;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getLicencePointsByDocumentId);
    });

    test('validates the documentId must be a GUID', async () => {
      const url = '/water/1.0/documents/not-a-guid/licence/points';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('allows a valid guid for documentId', async () => {
      const url = `/water/1.0/documents/${id}/licence/points`;
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });
  });

  experiment('/documents/{documentId}/licence/users', () => {
    let server;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getLicenceUsersByDocumentId);
    });

    test('validates the documentId must be a GUID', async () => {
      const url = '/water/1.0/documents/not-a-guid/licence/users';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('allows a valid guid for documentId', async () => {
      const url = `/water/1.0/documents/${id}/licence/users`;
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });
  });

  experiment('/documents/{documentId}/rename', () => {
    let server;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.postLicenceName);
    });

    test('validates the documentId must be a GUID', async () => {
      const url = '/water/1.0/documents/not-a-guid/rename';
      const output = await server.inject({
        method: 'POST',
        url,
        payload: {
          userName: 'test@example.com',
          rename: false,
          documentName: 'test-doc-name'
        }
      });
      expect(output.statusCode).to.equal(400);
    });

    test('allows a valid guid for documentId', async () => {
      const url = `/water/1.0/documents/${id}/rename`;
      const output = await server.inject({
        method: 'POST',
        url,
        payload: {
          userName: 'test@example.com',
          documentName: 'test-doc-name'
        }
      });
      expect(output.statusCode).to.equal(200);
    });

    test('validates the userName as an email address', async () => {
      const url = `/water/1.0/documents/${id}/rename`;
      const output = await server.inject({
        method: 'POST',
        url,
        payload: {
          userName: 'not.an.email.address',
          documentName: 'test-doc-name'
        }
      });
      expect(output.statusCode).to.equal(400);
    });

    test('validates the userName as required', async () => {
      const url = `/water/1.0/documents/${id}/rename`;
      const output = await server.inject({
        method: 'POST',
        url,
        payload: {
          rename: false,
          documentName: 'test-doc-name'
        }
      });
      expect(output.statusCode).to.equal(400);
    });

    test('validates the rename as boolean', async () => {
      const url = `/water/1.0/documents/${id}/rename`;
      const output = await server.inject({
        method: 'POST',
        url,
        payload: {
          userName: 'test@email.com',
          rename: 'something',
          documentName: 'test-doc-name'
        }
      });
      expect(output.statusCode).to.equal(400);
    });

    test('validates the documentName as required', async () => {
      const url = `/water/1.0/documents/${id}/rename`;
      const output = await server.inject({
        method: 'POST',
        url,
        payload: {
          userName: 'test@email.com',
          rename: false
        }
      });
      expect(output.statusCode).to.equal(400);
    });
  });

  experiment('/licences{licenceId}/versions', () => {
    let server;
    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getLicenceVersions);
    });

    test('returns a 400 if the licence id is not a uuid', async () => {
      const request = {
        method: 'GET',
        url: '/water/1.0/licences/1234/versions'
      };

      const response = await server.inject(request);

      expect(response.statusCode).to.equal(400);
    });

    test('uses the controller handler if the request is valid', async () => {
      const request = {
        method: 'GET',
        url: `/water/1.0/licences/${id}/versions`
      };

      const response = await server.inject(request);

      expect(response.statusCode).to.equal(200);
    });
  });
});
