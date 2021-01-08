'use strict';

const {
  experiment,
  test,
  before,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const s3 = require('../../../src/lib/services/s3');
const controllers = require('../../../src/modules/reporting/controllers');

experiment('modules/reporting/controllers', () => {
  let request;
  before(async () => {
    await sandbox.stub(s3, 'getSignedUrl').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getReport', () => {
    request = {
      params: {
        reportIdentifier: 'testreport.csv'
      }
    };
    before(async () => {
      await controllers.getReport(request);
    });

    test('calls getSignedUrl with a file path', async () => {
      expect(s3.getSignedUrl.calledWith('reporting/testreport.csv.csv')).to.be.true();
    });
  });
});
