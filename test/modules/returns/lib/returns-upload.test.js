const returnsUpload = require('../../../../src/modules/returns/lib/returns-upload')
const s3 = require('../../../../src/lib/services/s3')

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { expect } = require('@hapi/code')
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()

experiment('modules/returns/lib/returns-upload', () => {
  experiment('.getUploadFilename', () => {
    test('uses csv extension by default', async () => {
      const filename = returnsUpload.getUploadFilename('test-id')
      expect(filename).to.equal('returns-upload/test-id.csv')
    })

    test('uses given extension if provided', async () => {
      const filename = returnsUpload.getUploadFilename('test-id', 'json')
      expect(filename).to.equal('returns-upload/test-id.json')
    })
  })

  experiment('.getReturnsS3Object', () => {
    beforeEach(async () => {
      sandbox.stub(s3, 'getObject').resolves({})
    })

    afterEach(async () => {
      sandbox.restore()
    })

    test('creates the expected S3 Object key', async () => {
      await returnsUpload.getReturnsS3Object('test-event-id', 'json')
      const [key] = s3.getObject.lastCall.args
      expect(key).to.equal('returns-upload/test-event-id.json')
    })

    test('creates the expected S3 Object key using csv by default', async () => {
      await returnsUpload.getReturnsS3Object('test-event-id')
      const [key] = s3.getObject.lastCall.args
      expect(key).to.equal('returns-upload/test-event-id.csv')
    })
  })

  experiment('.buildJobData', () => {
    test('includes all data passed in', async () => {
      const jobData = returnsUpload.buildJobData({ eventId: 'test-event-id', foo: 'bar' })
      expect(jobData).to.includes({
        eventId: 'test-event-id',
        foo: 'bar'
      })
    })

    test('uses csv for the subtype by default', async () => {
      const jobData = returnsUpload.buildJobData({ eventId: 'test-event-id' })
      expect(jobData).to.equal({
        eventId: 'test-event-id',
        subtype: 'csv'
      })
    })

    test('sub type can be overridden', async () => {
      const jobData = returnsUpload.buildJobData({ eventId: 'test-event-id', subtype: 'json' })
      expect(jobData).to.equal({
        eventId: 'test-event-id',
        subtype: 'json'
      })
    })
  })

  experiment('.s3ObjectToJson', () => {
    test('returns the expected object', async () => {
      const ret = {
        id: 'return-id',
        lines: [
          { id: 'line-id' }
        ]
      }

      const s3Object = {
        Body: Buffer.from(JSON.stringify(ret), 'utf-8')
      }

      const json = returnsUpload.s3ObjectToJson(s3Object)
      expect(json).to.equal(ret)
    })
  })
})
