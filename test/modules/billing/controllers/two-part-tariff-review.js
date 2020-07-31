'use strict';

/*
experiment('.patchTransactionBillingVolume', () => {
    let request, result;
    const createRequest = volume => ({
      defra: {
        internalCallingUser: {
          id: 1234,
          email: 'test@example.com'
        }
      },
      params: { transactionId: 'test-transaction-id' },
      payload: { volume }
    });

    beforeEach(async () => {
      request = createRequest(20);
      result = await controller.patchTransactionBillingVolume(request, h);
    });

    test('the transactions service is called to get the transaction with related data', async () => {
      expect(
        transactionsService.getById.calledWith(request.params.transactionId)
      ).to.be.true();
    });

    experiment('when the transaction data is found', async () => {
      test('the billing volumes service is called to update the billing volume', async () => {
        const [chargeElementId, batch, volume, user] = billingVolumesService.updateBillingVolume.lastCall.args;

        expect(chargeElementId).to.equal(transaction.chargeElement.id);
        expect(batch).to.equal(tptBatch);
        expect(volume).to.equal(request.payload.volume);
        expect(user).to.equal(request.defra.internalCallingUser);
      });

      test('the transaction is returned', async () => {
        const relevantTransaction = get(tptBatch, 'invoices[0].invoiceLicences[0].transactions[0]');
        const { transaction } = result;
        expect(transaction).to.equal(relevantTransaction);
      });

      test('the updated billing volume is returned', async () => {
        const { updatedBillingVolume } = result;
        expect(updatedBillingVolume).to.equal(billingVolume);
      });

      test('a Boom bad request error is thrown if an error occurs', async () => {
        const errMsg = 'oh no, something went wrong';
        billingVolumesService.updateBillingVolume.rejects(new Error(errMsg));
        try {
          await controller.patchTransactionBillingVolume(request, h);
        } catch (err) {
          expect(err.isBoom).to.be.true();
          expect(err.message).to.equal(errMsg);
          expect(err.output.statusCode).to.equal(400);
        }
      });
    });
    experiment('when the transaction data is not found', async () => {
      test('throws Boom not found error', async () => {
        transactionsService.getById.resolves();
        try {
          await controller.patchTransactionBillingVolume(request, h);
        } catch (err) {
          expect(err.isBoom).to.be.true();
          expect(err.output.statusCode).to.equal(404);
          expect(err.message).to.equal('No transaction (00112233-4455-6677-8899-aabbccddeeff) found');
        }
      });
    });
  });
  */

/*

experiment('.postApproveReviewBatch', () => {
  let request, batch, internalCallingUser, response;

  beforeEach(async () => {
    internalCallingUser = {
      email: 'test@example.com',
      id: 1234
    };

    batch = new Batch('33333333-3333-3333-3333-333333333333');

    request = {
      defra: { internalCallingUser },
      pre: { batch },
      messageQueue: {
        publish: sandbox.stub().resolves()
      }
    };
  });

  experiment('review is approved succesfully', () => {
    beforeEach(async () => {
      response = await controller.postApproveReviewBatch(request, h);
    });

    test('calls the batchService to approve review', async () => {
      expect(
        batchService.approveTptBatchReview.calledWith(batch)
      ).to.be.true();
    });

    test('calls the billingVolumeService to approve volumes', async () => {
      expect(
        billingVolumesService.approveVolumesForBatch.calledWith(batch)
      ).to.be.true();
    });

    test('calls the event service to create new event', async () => {
      const [savedEvent] = eventService.create.lastCall.args;
      expect(savedEvent).to.be.an.instanceOf(Event);
      expect(savedEvent.type).to.equal('billing-batch:approve-review');
      expect(savedEvent.subtype).to.be.null();
      expect(savedEvent.issuer).to.equal(internalCallingUser.email);
      expect(savedEvent.metadata).to.equal({ batch: processingBatch });
      expect(savedEvent.status).to.equal('processing');
    });

    test('publishes a new job to the message queue with the event id', async () => {
      const [message] = request.messageQueue.publish.lastCall.args;
      expect(message.data.eventId).to.equal('11111111-1111-1111-1111-111111111111');
      expect(message.data.batch).to.equal(processingBatch);
    });

    test('the response contains the event and batch', async () => {
      const { data } = response;
      expect(data.event.id).to.equal('11111111-1111-1111-1111-111111111111');
      expect(data.batch).to.equal(processingBatch);
    });

    test('the response contains a URL to the event', async () => {
      const { data } = response;
      expect(data.url).to.equal('/water/1.0/event/11111111-1111-1111-1111-111111111111');
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
      expect(request.messageQueue.publish.called).to.be.false();
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
*/

/*
  experiment('.getBatchLicences', () => {
    const createBatchStatusRequest = batchStatus => ({
      pre: {
        batch: new Batch().fromHash({
          status: batchStatus
        })
      }
    });

    experiment('when a batch has a processing state', () => {
      let request;

      beforeEach(async () => {
        request = createBatchStatusRequest(BATCH_STATUS.processing);
        await controller.getBatchLicences(request, h);
      });

      test('a 403 is returned', async () => {
        const [code] = hapiResponseStub.code.lastCall.args;
        expect(code).to.equal(403);
      });

      test('no attempt is made to get the underlying data', async () => {
        expect(invoiceLicenceService.getLicencesWithTransactionStatusesForBatch.called).to.be.false();
      });
    });

    experiment('when a batch has an error state', () => {
      let request;

      beforeEach(async () => {
        request = createBatchStatusRequest(BATCH_STATUS.error);
        await controller.getBatchLicences(request, h);
      });

      test('a 403 is returned', async () => {
        const [code] = hapiResponseStub.code.lastCall.args;
        expect(code).to.equal(403);
      });

      test('no attempt is made to get the underlying data', async () => {
        expect(invoiceLicenceService.getLicencesWithTransactionStatusesForBatch.called).to.be.false();
      });
    });

    experiment('when a batch has an empty state', () => {
      let request;
      let response;

      beforeEach(async () => {
        request = createBatchStatusRequest(BATCH_STATUS.empty);
        response = await controller.getBatchLicences(request, h);
      });

      test('an empty array is returned', async () => {
        expect(response).to.equal([]);
      });

      test('no attempt is made to get the underlying data', async () => {
        expect(invoiceLicenceService.getLicencesWithTransactionStatusesForBatch.called).to.be.false();
      });
    });

    experiment('when a batch is in a state to return data', () => {
      const validStatuses = [
        BATCH_STATUS.sent,
        BATCH_STATUS.ready,
        BATCH_STATUS.review
      ];

      validStatuses.forEach(status => {
        test(`the expected data is returned for a ${status} batch`, async () => {
          const fakeResponse = [{ id: 1 }, { id: 2 }];
          invoiceLicenceService.getLicencesWithTransactionStatusesForBatch.resolves(fakeResponse);

          const request = createBatchStatusRequest(status);
          const response = await controller.getBatchLicences(request, h);

          expect(response).to.equal(fakeResponse);
        });
      });
    });
  });
  */
