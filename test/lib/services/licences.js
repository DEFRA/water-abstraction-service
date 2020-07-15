'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const sandbox = require('sinon').createSandbox();

const licencesService = require('../../../src/lib/services/licences');
const repos = require('../../../src/lib/connectors/repos');

// Models
const Licence = require('../../../src/lib/models/licence');
const LicenceVersion = require('../../../src/lib/models/licence-version');

const data = {
  dbRow: {
    licenceId: '6e4b0cb8-7d37-4119-be3b-855c6a26b3be',
    licenceRef: '01/123/ABC',
    isWaterUndertaker: false,
    regionId: 'ef627969-9636-4d9c-abc6-ad42f64ec340',
    regionName: 'Anglian',
    chargeRegionId: 'A',
    naldRegionId: 1,
    startDate: '2019-01-01',
    expiredDate: null,
    lapsedDate: null,
    revokedDate: null,
    regions: {
      historicalAreaCode: 'ABC',
      regionalChargeArea: 'Anglian'
    },
    region: {
      regionId: 'ef627969-9636-4d9c-abc6-ad42f64ec340',
      name: 'Anglian',
      displayName: 'Anglian',
      chargeRegionId: 'A',
      naldRegionId: 1
    }
  }
};

experiment('src/lib/services/licences', () => {
  beforeEach(async () => {
    sandbox.stub(repos.licences, 'findOne');
    sandbox.stub(repos.licenceVersions, 'findByLicenceId');
    sandbox.stub(repos.licenceVersions, 'findOne');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getLicenceById', () => {
    let result;

    experiment('when the licence is found', () => {
      beforeEach(async () => {
        repos.licences.findOne.resolves(data.dbRow);
        result = await licencesService.getLicenceById(data.dbRow.licenceId);
      });

      test('calls repos.licences.findOne() with supplied licence ID', async () => {
        const [id] = repos.licences.findOne.lastCall.args;
        expect(id).to.equal(data.dbRow.licenceId);
      });

      test('returns licence instance', async () => {
        expect(result instanceof Licence).to.be.true();
      });
    });

    experiment('when the licence is not found', () => {
      beforeEach(async () => {
        repos.licences.findOne.resolves(null);
        result = await licencesService.getLicenceById(data.dbRow.licenceId);
      });

      test('resolves with null', async () => {
        expect(result).to.equal(null);
      });
    });
  });

  experiment('.getLicenceVersions', () => {
    experiment('when there are no versions returned from the repository', () => {
      test('an empty array is returned by the service', async () => {
        repos.licenceVersions.findByLicenceId.resolves([]);
        const result = await licencesService.getLicenceVersions(uuid());

        expect(result).to.equal([]);
      });
    });

    experiment('when versions are returned from the repository', () => {
      test('the results are mapped to LicenceVersion models', async () => {
        const licenceId = uuid();

        repos.licenceVersions.findByLicenceId.resolves([
          {
            status: 'superseded',
            endDate: '2010-10-10',
            startDate: '2010-01-01',
            externalId: '1:100:100:0',
            dateUpdated: '2020-01-01 10:10:10.000000',
            dateCreated: '2020-01-01 10:10:10.000000',
            licenceId,
            licenceVersionId: '17c45db7-aeaa-4c2e-bd58-584696b56681',
            issue: 100,
            increment: 0
          },
          {
            status: 'current',
            endDate: null,
            startDate: '2010-01-01',
            externalId: '1:100:100:1',
            dateUpdated: '2020-01-01 10:10:10.000000',
            dateCreated: '2020-01-01 10:10:10.000000',
            licenceId,
            licenceVersionId: '85b98b0e-6d75-4c26-ada2-079a86fe9701',
            issue: 100,
            increment: 1
          }
        ]);
        const result = await licencesService.getLicenceVersions(uuid());

        expect(result.length).to.equal(2);
        expect(result[0].id).to.equal('17c45db7-aeaa-4c2e-bd58-584696b56681');
        expect(result[0]).to.be.an.instanceOf(LicenceVersion);
        expect(result[1].id).to.equal('85b98b0e-6d75-4c26-ada2-079a86fe9701');
        expect(result[1]).to.be.an.instanceOf(LicenceVersion);
      });
    });
  });

  experiment('.getLicenceVersionById', () => {
    let licenceVersion;
    let licenceVersionId;

    experiment('when no licence version is found for the id', () => {
      beforeEach(async () => {
        licenceVersionId = uuid();
        repos.licenceVersions.findOne.resolves(null);
        licenceVersion = await licencesService.getLicenceVersionById(licenceVersionId);
      });

      test('null is returned', async () => {
        expect(licenceVersion).to.equal(null);
      });

      test('the expected call to the repository layer is made', async () => {
        const [id] = repos.licenceVersions.findOne.lastCall.args;
        expect(id).to.equal(licenceVersionId);
      });
    });

    experiment('when a licence version is found for the id', () => {
      beforeEach(async () => {
        licenceVersionId = uuid();
        repos.licenceVersions.findOne.resolves({
          status: 'superseded',
          endDate: '2001-11-01',
          startDate: '2001-05-01',
          externalId: '1:1:100:1',
          dateUpdated: '2001-01-01 10:10:10.000000',
          dateCreated: '2001-01-01 10:10:10.000000',
          licenceId: uuid(),
          licenceVersionId,
          issue: 100,
          increment: 1
        });
        licenceVersion = await licencesService.getLicenceVersionById(licenceVersionId);
      });

      test('the expected call to the repository layer is made', async () => {
        const [id] = repos.licenceVersions.findOne.lastCall.args;
        expect(id).to.equal(licenceVersionId);
      });

      test('the licence version is returned in a model instance', async () => {
        expect(licenceVersion).to.be.an.instanceOf(LicenceVersion);
        expect(licenceVersion.id).to.equal(licenceVersionId);
      });
    });
  });
});
