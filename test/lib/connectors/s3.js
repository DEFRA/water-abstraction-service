const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const aws = require('aws-sdk');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const s3 = require('../../../src/lib/connectors/s3');
const config = require('../../../config');

const PROXY = 'http://some-proxy.example.com';

experiment('lib/connectors/s3', () => {
  beforeEach(async () => {
    sandbox.stub(config, 'proxy').value(PROXY);
    sandbox.stub(aws.config, 'update');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getS3', () => {
    experiment('when a proxy is defined', () => {
      let result;

      beforeEach(async () => {
        result = s3.getS3();
      });

      test('result is an S3 instance', async () => {
        expect(result instanceof aws.S3).to.be.true();
      });

      test('proxy is defined in AWS config', async () => {
        const [awsConfig] = aws.config.update.lastCall.args;
        expect(awsConfig.httpOptions.agent).to.be.an.object();
      });
    });
  });

  experiment('.getS3', () => {
    experiment('when a proxy is not defined', () => {
      let result;

      beforeEach(async () => {
        sandbox.stub(config, 'proxy').value(undefined);
        result = s3.getS3();
      });

      test('result is an S3 instance', async () => {
        expect(result instanceof aws.S3).to.be.true();
      });

      test('http options is not defined in AWS config', async () => {
        const [awsConfig] = aws.config.update.lastCall.args;
        expect(awsConfig.httpOptions).to.be.an.undefined();
      });
    });
  });
});
