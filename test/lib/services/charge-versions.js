'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const service = require('../../../src/lib/services/service');
const licencesService = require('../../../src/lib/services/licences');
const chargeVersionService = require('../../../src/lib/services/charge-versions');
const chargeVersionMapper = require('../../../src/lib/mappers/charge-version');
const chargeVersionRepo = require('../../../src/lib/connectors/repos/charge-versions');

experiment('lib/services/charge-versions', () => {
  beforeEach(async () => {
    sandbox.stub(service, 'findOne').resolves('test');
    sandbox.stub(service, 'findMany').resolves('test');
    sandbox.stub(chargeVersionRepo, 'create').resolves({});
    sandbox.stub(licencesService, 'getLicenceById').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getChargeVersionById', () => {
    test('delegates to the service.findOne function', async () => {
      const id = uuid();
      const result = await chargeVersionService.getByChargeVersionId(id);

      expect(result).to.equal('test');

      const [chargeVersionId, fetch, mapper] = service.findOne.lastCall.args;
      expect(chargeVersionId).to.equal(id);
      expect(fetch).to.equal(chargeVersionRepo.findOne);
      expect(mapper).to.equal(chargeVersionMapper);
    });
  });

  experiment('.getByLicenceId', () => {
    let result;
    let licenceId;

    beforeEach(async () => {
      licencesService.getLicenceById.resolves({
        licenceNumber: '123/123'
      });

      licenceId = uuid();
      result = await chargeVersionService.getByLicenceId(licenceId);
    });

    test('looks up the licence ref', async () => {
      const [id] = licencesService.getLicenceById.lastCall.args;
      expect(id).to.equal(licenceId);
    });

    test('delegates to the service.findMany function using the found licence ref', async () => {
      expect(result).to.equal('test');

      const [licenceRef, fetch, mapper] = service.findMany.lastCall.args;
      expect(licenceRef).to.equal('123/123');
      expect(fetch).to.equal(chargeVersionRepo.findByLicenceRef);
      expect(mapper).to.equal(chargeVersionMapper);
    });
  });

  experiment('.getByLicenceRef', () => {
    test('delegates to the service.findMany function', async () => {
      const result = await chargeVersionService.getByLicenceRef('123/123');

      expect(result).to.equal('test');

      const [licenceRef, fetch, mapper] = service.findMany.lastCall.args;
      expect(licenceRef).to.equal('123/123');
      expect(fetch).to.equal(chargeVersionRepo.findByLicenceRef);
      expect(mapper).to.equal(chargeVersionMapper);
    });
  });
});
