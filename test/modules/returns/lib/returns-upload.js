const returnsUpload = require('../../../../src/modules/returns/lib/returns-upload');
const s3 = require('../../../../src/lib/connectors/s3');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();

experiment('getUploadFilename', () => {
  test('uses xml extension by default', async () => {
    const filename = returnsUpload.getUploadFilename('test-id');
    expect(filename).to.equal('returns-upload/test-id.xml');
  });

  test('uses xml extension by default', async () => {
    const filename = returnsUpload.getUploadFilename('test-id', 'json');
    expect(filename).to.equal('returns-upload/test-id.json');
  });
});

experiment('getReturnsS3Object', () => {
  beforeEach(async () => {
    sandbox.stub(s3, 'getObject').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('creates the expected S3 Object key', async () => {
    await returnsUpload.getReturnsS3Object('test-event-id', 'json');
    const [key] = s3.getObject.lastCall.args;
    expect(key).to.equal('returns-upload/test-event-id.json');
  });

  test('creates the expected S3 Object key using xml by default', async () => {
    await returnsUpload.getReturnsS3Object('test-event-id');
    const [key] = s3.getObject.lastCall.args;
    expect(key).to.equal('returns-upload/test-event-id.xml');
  });
});

experiment('buildJobData', () => {
  test('uses xml for the subtype by default', async () => {
    const jobData = returnsUpload.buildJobData('test-event-id');
    expect(jobData).to.equal({
      eventId: 'test-event-id',
      subType: 'xml'
    });
  });

  test('sub type can be overridden', async () => {
    const jobData = returnsUpload.buildJobData('test-event-id', 'json');
    expect(jobData).to.equal({
      eventId: 'test-event-id',
      subType: 'json'
    });
  });
});
