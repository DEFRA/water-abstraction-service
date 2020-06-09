const Hapi = require('@hapi/hapi');
const { expect } = require('@hapi/code');
const { cloneDeep } = require('lodash');

const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const routes = require('../../../src/modules/licences/routes');
const id = '00000000-0000-0000-0000-000000000000';

experiment('/documents/{documentId}/licence', () => {
  let server;

  beforeEach(async () => {
    const getLicenceByDocumentId = cloneDeep(routes.getLicenceByDocumentId);
    getLicenceByDocumentId.handler = () => 'ok';
    server = Hapi.server();
    server.route(getLicenceByDocumentId);
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
    const getLicenceConditionsByDocumentId = cloneDeep(routes.getLicenceConditionsByDocumentId);
    getLicenceConditionsByDocumentId.handler = () => 'ok';
    server = Hapi.server();
    server.route(getLicenceConditionsByDocumentId);
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
    const getLicencePointsByDocumentId = cloneDeep(routes.getLicencePointsByDocumentId);
    getLicencePointsByDocumentId.handler = () => 'ok';
    server = Hapi.server();
    server.route(getLicencePointsByDocumentId);
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
    const getLicenceUsersByDocumentId = cloneDeep(routes.getLicenceUsersByDocumentId);
    getLicenceUsersByDocumentId.handler = () => 'ok';
    server = Hapi.server();
    server.route(getLicenceUsersByDocumentId);
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
    const postLicenceName = cloneDeep(routes.postLicenceName);
    postLicenceName.handler = () => 'ok';
    server = Hapi.server();
    server.route(postLicenceName);
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
