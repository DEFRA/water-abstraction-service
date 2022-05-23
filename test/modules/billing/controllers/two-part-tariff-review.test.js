'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const Batch = require('../../../../src/lib/models/batch');
const DateRange = require('../../../../src/lib/models/date-range');
const Event = require('../../../../src/lib/models/event');

const controller = require('../../../../src/modules/billing/controllers/two-part-tariff-review');
const licencesService = require('../../../../src/modules/billing/services/licences-service');
const invoiceAccountService = require('../../../../src/lib/services/invoice-accounts-service');
const billingVolumesService = require('../../../../src/modules/billing/services/billing-volumes-service');
const chargeVersionYearsService = require('../../../../src/modules/billing/services/charge-version-year');
const batchService = require('../../../../src/modules/billing/services/batch-service');
const eventService = require('../../../../src/lib/services/events');
const { NotFoundError } = require('../../../../src/lib/errors.js');
const { BatchStatusError, TransactionStatusError } = require('../../../../src/modules/billing/lib/errors.js');
const BillingVolume = require('../../../../src/lib/connectors/bookshelf/BillingVolume');
const { default: Decimal } = require('decimal.js-light');

experiment('modules/billing/controllers/two-part-tariff-review', () => {
  let h, request, result, batch, user, event;

  beforeEach(async () => {
    user = {
      email: 'test@example.com',
      id: 1234
    };

    h = {
      response: sandbox.stub().returnsThis(),
      code: sandbox.stub()
    };

    batch = new Batch(uuid());

    request = {
      pre: {
        batch
      },
      queueManager: {
        add: sandbox.stub()
      },
      params: {
        licenceId: uuid(),
        billingVolumeId: uuid()
      },
      payload: {
        volume: 15
      },
      defra: {
        internalCallingUser: user
      },
      auth: {
        credentials: user
      }
    };

    sandbox.stub(licencesService, 'getByBatchIdForTwoPartTariffReview').resolves([{
      licenceId: 'test-licence-1'
    }, {
      licenceId: 'test-licence-2'
    }]);
    sandbox.stub(licencesService, 'deleteBatchLicence');

    sandbox.stub(billingVolumesService, 'getLicenceBillingVolumes');
    sandbox.stub(billingVolumesService, 'getBillingVolumeById');
    sandbox.stub(billingVolumesService, 'updateBillingVolume');
    sandbox.stub(billingVolumesService, 'getBillingVolumeChargePeriod').resolves(new DateRange('2021-04-01', '2022-03-31'));
    sandbox.stub(billingVolumesService, 'deleteBillingVolumeByFinancialYearEnding').resolves();
    sandbox.stub(batchService, 'approveTptBatchReview').resolves(batch);
    sandbox.stub(batchService, 'getBatchById').resolves(batch);
    sandbox.stub(invoiceAccountService, 'getByInvoiceAccountId').resolves({ company: { name: 'test company name' } });
    event = new Event(uuid());
    sandbox.stub(eventService, 'create').resolves(event);
    sandbox.stub(chargeVersionYearsService, 'deleteChargeVersionYear').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getBatchLicences', () => {
    test('returns an empty array when the batch is empty', async () => {
      request.pre.batch.status = Batch.BATCH_STATUS.empty;
      const result = await controller.getBatchLicences(request, h);
      expect(result).to.equal([]);
    });

    test('returns a 403 if the batch status is not "review"', async () => {
      request.pre.batch.status = Batch.BATCH_STATUS.processing;
      await controller.getBatchLicences(request, h);
      expect(h.code.calledWith(403)).to.be.true();
    });

    test('gets the licences for the batch if the status is "review', async () => {
      request.pre.batch.status = Batch.BATCH_STATUS.review;
      result = await controller.getBatchLicences(request, h);
      expect(licencesService.getByBatchIdForTwoPartTariffReview.calledWith(batch.id)).to.be.true();
      expect(result).to.be.an.array().length(2);
    });
  });

  experiment('.getBatchLicenceVolumes', () => {
    const billingVolumes = [
      {
        id: 'test-billing-volume-id-1',
        billingBatchId: 'test-batch-id',
        calculatedVolume: new Decimal(10),
        volume: 10.0000
      },
      {
        id: 'test-billing-volume-id-2',
        billingBatchId: 'test-batch-id',
        calculatedVolume: new Decimal(0),
        volume: 50.0000
      }
    ];
    beforeEach(async () => {
      billingVolumesService.getLicenceBillingVolumes.resolves(billingVolumes);
      billingVolumesService.getBillingVolumeChargePeriod.resolves({
        chargePeriod: new DateRange('2021-04-01', '2022-03-31'),
        invoiceAccountId: 'test-inv-acc-id'
      });
      await controller.getBatchLicenceVolumes(request, h);
    });
    test('gets the billing volumes for the specified licence ID', async () => {
      expect(billingVolumesService.getLicenceBillingVolumes.calledWith(
        batch, request.params.licenceId
      )).to.be.true();
    });
    test('gets the charge period', async () => {
      const [billingVolume] = billingVolumesService.getBillingVolumeChargePeriod.lastCall.args;
      expect(billingVolume).to.equal(billingVolumes[1]);
    });
  });

  experiment('.deleteBatchLicence', () => {
    experiment('when there are no errors', () => {
      beforeEach(async () => {
        await controller.deleteBatchLicence(request, h);
      });

      test('deletes the specified licence ID from the batch', async () => {
        expect(licencesService.deleteBatchLicence.calledWith(
          batch, request.params.licenceId
        )).to.be.true();
      });

      test('returns a 204 status code', async () => {
        expect(h.code.calledWith(204)).to.be.true();
      });
    });

    experiment('when there is an error deleting the licence', () => {
      beforeEach(async () => {
        licencesService.deleteBatchLicence.rejects(new BatchStatusError('Cannot delete licence unless batch is in "review" status'));
        result = await controller.deleteBatchLicence(request, h);
      });

      test('maps the error to a Boom error and returns', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(403);
      });
    });
  });

  experiment('.getBillingVolume', () => {
    let result;

    experiment('when there are no errors', () => {
      const billingVolume = new BillingVolume(uuid());

      beforeEach(async () => {
        billingVolumesService.getBillingVolumeById.resolves(billingVolume);
        result = await controller.getBillingVolume(request, h);
      });

      test('gets the specified billing volume by ID', async () => {
        expect(billingVolumesService.getBillingVolumeById.calledWith(
          request.params.billingVolumeId
        )).to.be.true();
      });

      test('gets the charge period', async () => {
        expect(billingVolumesService.getBillingVolumeChargePeriod.calledWith(
          billingVolume
        )).to.be.true();
      });

      test('resolves with the billing volume and charge period', async () => {
        expect(result).to.be.an.instanceOf(BillingVolume);
      });

      test('the billing volume has a charge period property', async () => {
        expect(result.chargePeriod).to.be.an.instanceOf(DateRange);
      });
    });

    experiment('when the billing volume is not found', () => {
      beforeEach(async () => {
        billingVolumesService.getBillingVolumeById.rejects(
          new NotFoundError('Billing volume not found')
        );
        result = await controller.getBillingVolume(request, h);
      });

      test('maps the error to a Boom error and returns', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
      });
    });
  });

  experiment('.deleteBatchLicenceBillingVolumes', () => {
    const licenceId = uuid();
    const batchId = uuid();
    const deleteBatchLicenceBillingVolumesRequest = {
      queueManager: {
        add: sandbox.stub()
      },
      params: {
        licenceId,
        batchId,
        financialYearEnding: 2020
      },
      defra: {
        internalCallingUser: user
      },
      auth: {
        credentials: user
      }
    };
    experiment('when there are no errors', () => {
      beforeEach(async () => {
        batch.status = 'review';
        batchService.getBatchById.resolves(batch);
        await controller.deleteBatchLicenceBillingVolumes(deleteBatchLicenceBillingVolumesRequest, h);
      });

      test('gets the batch and asserts that the batch is in review', async () => {
        expect(batchService.getBatchById.calledWith(deleteBatchLicenceBillingVolumesRequest.params.batchId));
      });

      test('calls the billing Volumes service method deleteBillingVolumeByFinancialYearEnding', async () => {
        expect(billingVolumesService.deleteBillingVolumeByFinancialYearEnding.calledWith(
          deleteBatchLicenceBillingVolumesRequest.params.batchId,
          deleteBatchLicenceBillingVolumesRequest.params.licenceId,
          deleteBatchLicenceBillingVolumesRequest.params.financialYearEnding
        )).to.be.true();
      });

      test('calls the BBCVY service method deleteChargeVersionYear', async () => {
        expect(chargeVersionYearsService.deleteChargeVersionYear.calledWith(
          deleteBatchLicenceBillingVolumesRequest.params.batchId,
          deleteBatchLicenceBillingVolumesRequest.params.licenceId,
          deleteBatchLicenceBillingVolumesRequest.params.financialYearEnding
        )).to.be.true();
      });
    });
  });

  experiment('.patchBillingVolume', () => {
    experiment('when there are no errors', () => {
      beforeEach(async () => {
        await controller.patchBillingVolume(request, h);
      });

      test('updates the specified billing volume by ID', async () => {
        expect(billingVolumesService.updateBillingVolume.calledWith(
          request.params.billingVolumeId, request.payload.volume, request.defra.internalCallingUser
        )).to.be.true();
      });
    });

    experiment('when the billing volume is not found', () => {
      beforeEach(async () => {
        billingVolumesService.updateBillingVolume.rejects(
          new NotFoundError('Billing volume not found')
        );
        result = await controller.patchBillingVolume(request, h);
      });

      test('maps the error to a Boom error and returns', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
      });
    });
  });

  experiment('.postApproveReviewBatch', () => {
    experiment('review is approved succesfully', () => {
      beforeEach(async () => {
        result = await controller.postApproveReviewBatch(request, h);
      });

      test('calls the batchService to approve review', async () => {
        expect(
          batchService.approveTptBatchReview.calledWith(batch)
        ).to.be.true();
      });

      test('calls the event service to create new event', async () => {
        const [savedEvent] = eventService.create.lastCall.args;
        expect(savedEvent).to.be.an.instanceOf(Event);
        expect(savedEvent.type).to.equal('billing-batch:approve-review');
        expect(savedEvent.subtype).to.be.null();
        expect(savedEvent.issuer).to.equal(user.email);
        expect(savedEvent.metadata).to.equal({ batch });
        expect(savedEvent.status).to.equal('processing');
      });

      test('publishes a new job to the message queue with the event id', async () => {
        const [jobName, batchId] = request.queueManager.add.lastCall.args;
        expect(jobName).to.equal('billing.process-charge-versions');
        expect(batchId).to.equal(batch.id);
      });

      test('the response contains the event and batch', async () => {
        const { data } = result;
        expect(data.event.id).to.equal(event.id);
        expect(data.batch).to.equal(batch);
      });

      test('the response contains a URL to the event', async () => {
        const { data } = result;
        expect(data.url).to.equal(`/water/1.0/event/${event.id}`);
      });
    });

    experiment('when the batchService throws a TransactionStatusError', () => {
      let response;
      beforeEach(async () => {
        const error = new TransactionStatusError('uh-oh');
        batchService.approveTptBatchReview.rejects(error);
        response = await controller.postApproveReviewBatch(request, h);
      });

      test('no event is created', async () => {
        expect(eventService.create.called).to.be.false();
      });

      test('no job is published', async () => {
        expect(request.queueManager.add.called).to.be.false();
      });

      test('a Boom badRequest error is returned containing the error message', async () => {
        expect(response.isBoom).to.be.true();
        expect(response.output.statusCode).to.equal(403);
        expect(response.message).to.equal('uh-oh');
      });
    });

    experiment('when there is an unexpected error', () => {
      beforeEach(async () => {
        eventService.create.rejects(new Error('event error'));
      });

      test('the error is rethrown', async () => {
        const func = () => controller.postApproveReviewBatch(request, h);
        expect(func()).to.reject();
      });
    });
  });
});
