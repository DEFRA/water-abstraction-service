'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const repos = require('../../../../src/lib/connectors/repository');
const jobService = require('../../../../src/modules/billing/services/job-service');
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const { BATCH_ERROR_CODE } = require('../../../../src/lib/models/batch');

const handlePopulateBatchChargeVersionsComplete = require('../../../../src/modules/billing/jobs/populate-batch-charge-versions-complete');

experiment('modules/billing/jobs/populate-batch-charge-versions-complete', () => {
  let messageQueue;

  beforeEach(async () => {
    sandbox.stub(batchJob, 'logOnComplete');
    sandbox.stub(batchJob, 'logOnCompleteError');
    sandbox.stub(batchJob, 'failBatch');

    sandbox.stub(jobService, 'setEmptyBatch');

    sandbox.stub(repos.chargeVersions, 'findOneById');
    sandbox.stub(repos.billingBatchChargeVersionYears, 'create');

    messageQueue = {
      publish: sandbox.spy()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('when the job fails', () => {
    test('the batch is set to error and cancelled ', async () => {
      const job = {
        name: 'testing',
        data: {
          failed: true
        }
      };
      await handlePopulateBatchChargeVersionsComplete(job, messageQueue);

      const failArgs = batchJob.failBatch.lastCall.args;
      expect(failArgs[0]).to.equal(job);
      expect(failArgs[1]).to.equal(messageQueue);
      expect(failArgs[2]).to.equal(BATCH_ERROR_CODE.failedToPopulateChargeVersions);
    });
  });

  experiment('when there are no chargeVersions', () => {
    beforeEach(async () => {
      await handlePopulateBatchChargeVersionsComplete({
        data: {
          response: {
            chargeVersions: [],
            batch: {
              billing_batch_id: 'test-batch-id'
            }
          },
          request: {
            data: {
              eventId: 'test-event-id'
            }
          }
        }
      }, messageQueue);
    });

    test('no calls are made to retrieve a chargeVersion', async () => {
      expect(repos.chargeVersions.findOneById.called).to.be.false();
    });

    test('no chargeVersionYear records are created', async () => {
      expect(repos.billingBatchChargeVersionYears.create.called).to.be.false();
    });

    test('no jobs are queued', async () => {
      expect(messageQueue.publish.called).to.be.false();
    });

    test('the batch is set to complete', async () => {
      const [eventId, batchId] = jobService.setEmptyBatch.lastCall.args;
      expect(eventId).to.equal('test-event-id');
      expect(batchId).to.equal('test-batch-id');
    });
  });

  experiment('when there are chargeVersions', () => {
    experiment('for a single year batch', () => {
      beforeEach(async () => {
        repos.chargeVersions.findOneById.withArgs('valid-1').resolves({
          charge_version_id: 'valid-1',
          start_date: '2018-04-01',
          end_date: null
        });

        repos.chargeVersions.findOneById.withArgs('valid-2').resolves({
          charge_version_id: 'valid-2',
          start_date: '2018-04-01',
          end_date: '2020-03-31'
        });

        repos.chargeVersions.findOneById.withArgs('invalid-1').resolves({
          charge_version_id: 'invalid-1',
          start_date: '2016-04-01',
          end_date: '2017-03-31'
        });

        repos.billingBatchChargeVersionYears.create.callsFake(async chargeVersionYear => {
          return {
            rows: [
              {
                billing_batch_charge_version_year_id: 'test-year-id',
                charge_version_id: chargeVersionYear.charge_version_id
              }
            ]
          };
        });

        await handlePopulateBatchChargeVersionsComplete({
          data: {
            response: {
              chargeVersions: [
                { charge_version_id: 'valid-1' },
                { charge_version_id: 'valid-2' },
                { charge_version_id: 'invalid-1' }
              ],
              batch: {
                billing_batch_id: 'test-batch-id',
                from_financial_year_ending: 2019,
                to_financial_year_ending: 2019
              }
            },
            request: {
              data: {
                eventId: 'test-event-id'
              }
            }
          }
        }, messageQueue);
      });

      test('creates a version year record for the first valid charge version', async () => {
        expect(
          repos.billingBatchChargeVersionYears.create.calledWith(
            sinon.match({
              charge_version_id: 'valid-1',
              status: 'processing'
            })
          )
        ).to.be.true();
      });

      test('creates a version year record for the second valid charge version', async () => {
        expect(
          repos.billingBatchChargeVersionYears.create.calledWith(
            sinon.match({
              charge_version_id: 'valid-2',
              status: 'processing'
            })
          )
        ).to.be.true();
      });

      test('does not create a version year record for the invalid charge version', async () => {
        test('creates a version year record for the second valid charge version', async () => {
          expect(
            repos.billingBatchChargeVersionYears.create.calledWith(
              sinon.match({ charge_version_id: 'invalid-1' })
            )
          ).to.be.false();
        });
      });

      test('queues a new job for the first valid charge version', async () => {
        expect(
          messageQueue.publish.calledWith(
            sinon.match({
              name: 'billing.process-charge-version.test-batch-id',
              data: {
                eventId: 'test-event-id',
                chargeVersionYear: {
                  charge_version_id: 'valid-1'
                },
                batch: {
                  billing_batch_id: 'test-batch-id'
                }
              }
            })
          )
        ).to.be.true();
      });

      test('queues a new job for the second valid charge version', async () => {
        expect(
          messageQueue.publish.calledWith(
            sinon.match({
              name: 'billing.process-charge-version.test-batch-id',
              data: {
                eventId: 'test-event-id',
                chargeVersionYear: {
                  charge_version_id: 'valid-2'
                },
                batch: {
                  billing_batch_id: 'test-batch-id'
                }
              }
            })
          )
        ).to.be.true();
      });
    });

    experiment('for a multi year batch', () => {
      beforeEach(async () => {
        repos.chargeVersions.findOneById.withArgs('valid-1').resolves({
          charge_version_id: 'valid-1',
          start_date: '2018-04-01',
          end_date: null
        });

        repos.chargeVersions.findOneById.withArgs('valid-2').resolves({
          charge_version_id: 'valid-2',
          start_date: '2018-04-01',
          end_date: '2019-03-31'
        });

        repos.chargeVersions.findOneById.withArgs('invalid-1').resolves({
          charge_version_id: 'invalid-1',
          start_date: '2016-04-01',
          end_date: '2017-03-31'
        });

        repos.billingBatchChargeVersionYears.create.callsFake(async chargeVersionYear => {
          return {
            rows: [{
              billing_batch_charge_version_year_id: 'test-year-id',
              charge_version_id: chargeVersionYear.charge_version_id,
              financial_year_ending: chargeVersionYear.financial_year_ending
            }]
          };
        });

        await handlePopulateBatchChargeVersionsComplete({
          data: {
            response: {
              chargeVersions: [
                { charge_version_id: 'valid-1' },
                { charge_version_id: 'valid-2' },
                { charge_version_id: 'invalid-1' }
              ],
              batch: {
                billing_batch_id: 'test-batch-id',
                from_financial_year_ending: 2019,
                to_financial_year_ending: 2020
              }
            },
            request: {
              data: {
                eventId: 'test-event-id'
              }
            }
          }
        }, messageQueue);
      });

      test('creates a version year record for the first valid charge version for both years', async () => {
        expect(
          repos.billingBatchChargeVersionYears.create.calledWith(
            sinon.match({
              charge_version_id: 'valid-1',
              financial_year_ending: 2019
            })
          )
        ).to.be.true();

        expect(
          repos.billingBatchChargeVersionYears.create.calledWith(
            sinon.match({ charge_version_id: 'valid-1', financial_year_ending: 2020 })
          )
        ).to.be.true();
      });

      test('creates a version year record for the second valid charge version for the 2019 financial year', async () => {
        expect(
          repos.billingBatchChargeVersionYears.create.calledWith(
            sinon.match({ charge_version_id: 'valid-2', financial_year_ending: 2019 })
          )
        ).to.be.true();
      });

      test('does not create a version year record for the second valid charge version for the 2020 financial year', async () => {
        expect(
          repos.billingBatchChargeVersionYears.create.calledWith(
            sinon.match({ charge_version_id: 'valid-2', financial_year_ending: 2020 })
          )
        ).to.be.false();
      });

      test('does not create a version year record for the invalid charge version', async () => {
        test('creates a version year record for the second valid charge version', async () => {
          expect(
            repos.billingBatchChargeVersionYears.create.calledWith(
              sinon.match({ charge_version_id: 'invalid-1', financial_year_ending: 2019 })
            )
          ).to.be.false();

          expect(
            repos.billingBatchChargeVersionYears.create.calledWith(
              sinon.match({ charge_version_id: 'invalid-1', financial_year_ending: 2020 })
            )
          ).to.be.false();
        });
      });

      test('queues a new job for the first valid charge version', async () => {
        expect(
          messageQueue.publish.calledWith(
            sinon.match({
              name: 'billing.process-charge-version.test-batch-id',
              data: {
                eventId: 'test-event-id',
                chargeVersionYear: {
                  charge_version_id: 'valid-1',
                  financial_year_ending: 2019
                },
                batch: {
                  billing_batch_id: 'test-batch-id',
                  from_financial_year_ending: 2019,
                  to_financial_year_ending: 2020
                }
              }
            })
          )
        ).to.be.true();

        expect(
          messageQueue.publish.calledWith(
            sinon.match({
              name: 'billing.process-charge-version.test-batch-id',
              data: {
                eventId: 'test-event-id',
                chargeVersionYear: {
                  charge_version_id: 'valid-1',
                  financial_year_ending: 2020
                },
                batch: {
                  billing_batch_id: 'test-batch-id',
                  from_financial_year_ending: 2019,
                  to_financial_year_ending: 2020
                }
              }
            })
          )
        ).to.be.true();
      });

      test('queues a new job for the second valid charge version', async () => {
        expect(
          messageQueue.publish.calledWith(
            sinon.match({
              name: 'billing.process-charge-version.test-batch-id',
              data: {
                eventId: 'test-event-id',
                chargeVersionYear: {
                  charge_version_id: 'valid-2',
                  financial_year_ending: 2019
                },
                batch: {
                  billing_batch_id: 'test-batch-id',
                  from_financial_year_ending: 2019,
                  to_financial_year_ending: 2020
                }
              }
            })
          )
        ).to.be.true();

        expect(
          messageQueue.publish.calledWith(
            sinon.match({
              name: 'billing.process-charge-version.test-batch-id',
              data: {
                eventId: 'test-event-id',
                chargeVersionYear: {
                  charge_version_id: 'valid-2',
                  financial_year_ending: 2020
                },
                batch: {
                  billing_batch_id: 'test-batch-id',
                  from_financial_year_ending: 2019,
                  to_financial_year_ending: 2020
                }
              }
            })
          )
        ).to.be.false();
      });
    });
  });
});
