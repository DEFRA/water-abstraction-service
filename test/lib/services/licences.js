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
const { INCLUDE_IN_SUPPLEMENTARY_BILLING } = require('../../../src/lib/models/constants');
const LicenceAgreement = require('../../../src/lib/models/licence-agreement');

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
    sandbox.stub(repos.licences, 'findByLicenceRef');
    sandbox.stub(repos.licences, 'updateIncludeLicenceInSupplementaryBilling');
    sandbox.stub(repos.licences, 'updateIncludeInSupplementaryBillingStatusForBatch');
    sandbox.stub(repos.licences, 'update');
    sandbox.stub(repos.licenceVersions, 'findByLicenceId');
    sandbox.stub(repos.licenceVersions, 'findOne');
    sandbox.stub(repos.licenceAgreements, 'findOne');
    sandbox.stub(repos.licenceAgreements, 'findByLicenceRef');
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

  experiment('.getLicenceByLicenceRef', () => {
    let result;

    experiment('when the licence is found', () => {
      beforeEach(async () => {
        repos.licences.findByLicenceRef.resolves([data.dbRow]);

        result = await licencesService.getLicenceByLicenceRef(
          data.dbRow.licenceRef,
          data.dbRow.region.naldRegionId
        );
      });

      test('calls repos.licences.findByLicenceRef() with supplied licence ref', async () => {
        const [licenceRef] = repos.licences.findByLicenceRef.lastCall.args;
        expect(licenceRef).to.equal(data.dbRow.licenceRef);
      });

      test('returns licence instance', async () => {
        expect(result instanceof Licence).to.be.true();
      });
    });

    experiment('when the licence is not found', () => {
      beforeEach(async () => {
        repos.licences.findByLicenceRef.resolves([]);

        result = await licencesService.getLicenceByLicenceRef(
          data.dbRow.licenceRef,
          data.dbRow.region.naldRegionId
        );
      });

      test('resolves with null', async () => {
        expect(result).to.equal(null);
      });
    });

    experiment('when the licence is not found for the region', () => {
      beforeEach(async () => {
        repos.licences.findByLicenceRef.resolves([data.dbRow]);

        result = await licencesService.getLicenceByLicenceRef(
          data.dbRow.licenceRef,
          '00000000-0000-0000-0000-000000001111'
        );
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

  experiment('.updateIncludeInSupplementaryBillingStatus', () => {
    test('passes the data to the repo', async () => {
      const licenceIds = ['one', 'two'];
      const from = INCLUDE_IN_SUPPLEMENTARY_BILLING.yes;
      const to = INCLUDE_IN_SUPPLEMENTARY_BILLING.no;

      await licencesService.updateIncludeInSupplementaryBillingStatus(from, to, ...licenceIds);

      const [firstLicenceId, firstFrom, firstTo] = repos.licences.updateIncludeLicenceInSupplementaryBilling.firstCall.args;
      const [secondLicenceId, secondFrom, secondTo] = repos.licences.updateIncludeLicenceInSupplementaryBilling.lastCall.args;

      expect(firstFrom).to.equal(from);
      expect(firstTo).to.equal(to);
      expect(firstLicenceId).to.equal(licenceIds[0]);

      expect(secondFrom).to.equal(from);
      expect(secondTo).to.equal(to);
      expect(secondLicenceId).to.equal(licenceIds[1]);
    });
  });

  experiment('.updateIncludeInSupplementaryBillingStatusForUnsentBatch', () => {
    beforeEach(async () => {
      await licencesService.updateIncludeInSupplementaryBillingStatusForUnsentBatch('test-batch-id');
    });

    test('passes the correct batch id to the repo', async () => {
      const [batchId] = repos.licences.updateIncludeInSupplementaryBillingStatusForBatch.lastCall.args;
      expect(batchId).to.equal('test-batch-id');
    });

    test('updates the status from reprocess to yes', async () => {
      const [, from, to] = repos.licences.updateIncludeInSupplementaryBillingStatusForBatch.lastCall.args;
      expect(from).to.equal(INCLUDE_IN_SUPPLEMENTARY_BILLING.reprocess);
      expect(to).to.equal(INCLUDE_IN_SUPPLEMENTARY_BILLING.yes);
    });
  });

  experiment('.updateIncludeInSupplementaryBillingStatusForSentBatch', () => {
    beforeEach(async () => {
      await licencesService.updateIncludeInSupplementaryBillingStatusForSentBatch('test-batch-id');
    });

    test('initially updates the status from yes to no', async () => {
      const [batchId, from, to] = repos.licences.updateIncludeInSupplementaryBillingStatusForBatch.firstCall.args;
      expect(batchId).to.equal('test-batch-id');
      expect(from).to.equal(INCLUDE_IN_SUPPLEMENTARY_BILLING.yes);
      expect(to).to.equal(INCLUDE_IN_SUPPLEMENTARY_BILLING.no);
    });

    test('then updates the status from reprocess to yes', async () => {
      const [batchId, from, to] = repos.licences.updateIncludeInSupplementaryBillingStatusForBatch.lastCall.args;
      expect(batchId).to.equal('test-batch-id');
      expect(from).to.equal(INCLUDE_IN_SUPPLEMENTARY_BILLING.reprocess);
      expect(to).to.equal(INCLUDE_IN_SUPPLEMENTARY_BILLING.yes);
    });
  });

  experiment('.getLicenceAgreementsByLicenceRef', () => {
    experiment('when there are no agreements returned from the repository', () => {
      test('an empty array is returned by the service', async () => {
        repos.licenceAgreements.findByLicenceRef.resolves([]);
        const result = await licencesService.getLicenceAgreementsByLicenceRef('123/123');

        expect(result).to.equal([]);
      });
    });

    experiment('when agreements are returned from the repository', () => {
      test('the results are mapped to LicenceAgreement models', async () => {
        const licenceNumber = '123/123';

        repos.licenceAgreements.findByLicenceRef.resolves([
          {
            licenceAgreementId: '00000000-0000-0000-0000-000000000001',
            licenceRef: licenceNumber,
            financialAgreementTypeId: 'S127',
            startDate: '2000-01-01',
            endDate: null,
            dateSigned: null
          },
          {
            licenceAgreementId: '00000000-0000-0000-0000-000000000002',
            licenceRef: licenceNumber,
            financialAgreementTypeId: 'S130U',
            startDate: '2001-01-01',
            endDate: '2002-01-01',
            dateSigned: null
          }
        ]);
        const result = await licencesService.getLicenceAgreementsByLicenceRef(licenceNumber);

        expect(result.length).to.equal(2);

        expect(result[0]).to.be.an.instanceOf(LicenceAgreement);
        expect(result[0].id).to.equal('00000000-0000-0000-0000-000000000001');
        expect(result[0].dateRange.startDate).to.equal('2000-01-01');
        expect(result[0].dateRange.endDate).to.equal(null);
        expect(result[0].agreement.code).to.equal('S127');

        expect(result[1]).to.be.an.instanceOf(LicenceAgreement);
        expect(result[1].id).to.equal('00000000-0000-0000-0000-000000000002');
        expect(result[1].dateRange.startDate).to.equal('2001-01-01');
        expect(result[1].dateRange.endDate).to.equal('2002-01-01');
        expect(result[1].agreement.code).to.equal('S130U');
      });
    });
  });

  experiment('.getLicenceAgreementById', () => {
    let licenceAgreement;
    let licenceAgreementId;

    experiment('when no licence agreement is found for the id', () => {
      beforeEach(async () => {
        licenceAgreementId = uuid();
        repos.licenceAgreements.findOne.resolves(null);
        licenceAgreement = await licencesService.getLicenceAgreementById(licenceAgreementId);
      });

      test('null is returned', async () => {
        expect(licenceAgreement).to.equal(null);
      });

      test('the expected call to the repository layer is made', async () => {
        const [id] = repos.licenceAgreements.findOne.lastCall.args;
        expect(id).to.equal(licenceAgreementId);
      });
    });

    experiment('when a licence agreement is found for the id', () => {
      beforeEach(async () => {
        licenceAgreementId = uuid();
        repos.licenceAgreements.findOne.resolves({
          licenceAgreementId,
          licenceRef: '123/123',
          financialAgreementTypeId: 'S127',
          startDate: '2000-01-01',
          endDate: null,
          dateSigned: null
        });
        licenceAgreement = await licencesService.getLicenceAgreementById(licenceAgreementId);
      });

      test('the expected call to the repository layer is made', async () => {
        const [id] = repos.licenceAgreements.findOne.lastCall.args;
        expect(id).to.equal(licenceAgreementId);
      });

      test('the licence version is returned in a model instance', async () => {
        expect(licenceAgreement).to.be.an.instanceOf(LicenceAgreement);
        expect(licenceAgreement.id).to.equal(licenceAgreementId);
      });
    });
  });

  experiment('.flagForSupplementaryBilling', () => {
    const licenceId = 'test-id';

    beforeEach(async () => {
      await licencesService.flagForSupplementaryBilling(licenceId);
    });

    test('calls the .update method on the repo', async () => {
      expect(repos.licences.update.calledWith(
        licenceId,
        { includeInSupplementaryBilling: 'yes' }
      )).to.be.true();
    });
  });
});
