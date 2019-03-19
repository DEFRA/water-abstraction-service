const { expect } = require('code');
const { cloneDeep } = require('lodash');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('lab').script();

const Hapi = require('hapi');

const routes = require('../../../src/modules/returns/routes');

experiment('postUploadReturnsXml', () => {
  let server;
  beforeEach(async () => {
    server = Hapi.server();

    const route = cloneDeep(routes.postUploadReturnsXml);
    route.handler = async () => 'ok';
    server.route(route);
  });

  test('calls the controller action for a valid payload', async () => {
    const url = '/water/1.0/returns/upload-xml';
    const output = await server.inject({
      method: 'POST',
      url,
      payload: {
        userName: 'test@example.com',
        fileData: '00001'
      }
    });
    expect(output.statusCode).to.be.between(199, 300);
  });

  test('returns a 400 for an invalid user name', async () => {
    const url = '/water/1.0/returns/upload-xml';
    const output = await server.inject({
      method: 'POST',
      url,
      payload: {
        userName: 123,
        fileData: '00001'
      }
    });
    expect(output.statusCode).to.equal(400);
  });

  test('returns a 400 for invalid file data', async () => {
    const url = '/water/1.0/returns/upload-xml';
    const output = await server.inject({
      method: 'POST',
      url,
      payload: {
        userName: 123,
        fileData: true
      }
    });
    expect(output.statusCode).to.equal(400);
  });
});
