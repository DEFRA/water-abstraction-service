'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');

const routes = require('../../../src/modules/charge-versions/routes');
const testHelpers = require('../../test-helpers');

const makeGet = url => ({ method: 'GET', url });
const makePost = (url, payload) => ({
  method: 'POST',
  url,
  payload
});

experiment('modules/charge-versions/routes', () => {
  experiment('.getDefaultChargesForLicenceVersion', () => {
    let server;
    let uuid;

    beforeEach(async () => {
      uuid = '62e87677-0e02-4006-8adb-4347125f2a12';
      server = testHelpers.createServerForRoute(routes.getDefaultChargesForLicenceVersion);
    });

    test('accepts a uuid for the licence version id', async () => {
      const request = makeGet(`/water/1.0/charge-versions/default/${uuid}`);
      const response = await server.inject(request);

      expect(response.statusCode).to.equal(200);
    });

    test('returns a bad request code if the licence version id is not a uuid', async () => {
      const request = makeGet('/water/1.0/charge-versions/default/123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  experiment('.postChargeVersion', () => {
    let payload;
    let server;
    let path;

    beforeEach(async () => {
      path = '/water/1.0/charge-versions';
      payload = {
        licenceNumber: '123/123',
        versionNumber: 1,
        startDate: '2000-01-01',
        endDate: '2001-01-01',
        status: 'current',
        apportionment: true,
        billedUpToDate: '2001-01-01',
        regionCode: 1,
        companyId: uuid(),
        invoiceAccountId: uuid(),
        scheme: 'alcs'
      };

      server = testHelpers.createServerForRoute(routes.postChargeVersion);
    });

    test('returns the 200 for the valid payload', async () => {
      const request = makePost(path, payload);
      const response = await server.inject(request);

      expect(response.statusCode).to.equal(200);
    });

    experiment('licenceNumber', () => {
      test('is required', async () => {
        delete payload.licenceNumber;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });
    });

    experiment('versionNumber', () => {
      test('is required', async () => {
        delete payload.versionNumber;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });

      test('cannot be negative', async () => {
        payload.versionNumber = -123;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });

      test('cannot be a string', async () => {
        payload.versionNumber = 'water';
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });
    });

    experiment('startDate', () => {
      test('is required', async () => {
        delete payload.startDate;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });

      test('must be a date', async () => {
        payload.startDate = 'start of the year';
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });
    });

    experiment('endDate', () => {
      test('is optional', async () => {
        delete payload.endDate;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(200);
      });

      test('can be null', async () => {
        payload.endDate = null;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(200);
      });

      test('must be a date', async () => {
        payload.endDate = 'start of the year';
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });
    });

    experiment('status', () => {
      test('is required', async () => {
        delete payload.status;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });
    });

    experiment('scheme', () => {
      test('is required', async () => {
        delete payload.scheme;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });
    });

    experiment('apportionment', () => {
      test('is optional', async () => {
        delete payload.apportionment;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(200);
      });

      test('must be a boolean', async () => {
        payload.apportionment = 'carrots';
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });
    });

    experiment('billedUpToDate', () => {
      test('is optional', async () => {
        delete payload.billedUpToDate;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(200);
        expect(response.request.payload.billedUpToDate).to.equal(null);
      });

      test('can be null', async () => {
        payload.billedUpToDate = null;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(200);
      });

      test('must be a date', async () => {
        payload.billedUpToDate = 'turnips';
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });
    });

    experiment('regionCode', () => {
      test('is required', async () => {
        delete payload.regionCode;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });

      test('must be positive', async () => {
        payload.regionCode = -123;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });

      test('must be an integer', async () => {
        payload.regionCode = 1.23;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });
    });

    experiment('companyId', () => {
      test('is required', async () => {
        delete payload.companyId;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });

      test('must be a GUID', async () => {
        payload.companyId = 123;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });
    });

    experiment('invoiceAccountId', () => {
      test('is required', async () => {
        delete payload.invoiceAccountId;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });

      test('must be a GUID', async () => {
        payload.invoiceAccountId = 123;
        const request = makePost(path, payload);
        const response = await server.inject(request);

        expect(response.statusCode).to.equal(400);
      });
    });
  });
});
