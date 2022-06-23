const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const aws = require('aws-sdk')

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const s3 = require('../../../src/lib/connectors/s3')
const config = require('../../../config')

const PROXY = 'http://some-proxy.example.com'

const S3_CREDENTIALS = {
  accessKeyId: 'key-id',
  secretAccessKey: 'a-secret-key',
  region: 'some-region',
  bucket: 'bucket-name'
}

experiment('lib/services/s3', () => {
  beforeEach(async () => {
    sandbox.stub(config, 'proxy').value(PROXY)
    sandbox.stub(config, 's3').value(S3_CREDENTIALS)
    sandbox.stub(aws.config, 'update')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('._getS3Options', () => {
    experiment('when a proxy is defined', () => {
      let result

      beforeEach(async () => {
        result = s3._getS3Options()
      })

      test('result is an object', async () => {
        expect(result).to.be.an.object()
      })

      test('proxy agent is defined', async () => {
        expect(result.httpOptions.agent).to.be.an.object()
      })

      test('bucket region is defined', async () => {
        expect(result.region).to.equal(S3_CREDENTIALS.region)
      })

      test('aws credentials are defined', async () => {
        expect(result.accessKeyId).to.equal(S3_CREDENTIALS.accessKeyId)
        expect(result.secretAccessKey).to.equal(S3_CREDENTIALS.secretAccessKey)
      })
    })

    experiment('when a proxy is not defined', () => {
      let result

      beforeEach(async () => {
        sandbox.stub(config, 'proxy').value(undefined)
        result = s3._getS3Options()
      })

      test('result is an object', async () => {
        expect(result).to.be.an.object()
      })

      test('proxy agent is not defined', async () => {
        expect(result.httpOptions).to.be.undefined()
      })

      test('bucket region is defined', async () => {
        expect(result.region).to.equal(S3_CREDENTIALS.region)
      })

      test('aws credentials are defined', async () => {
        expect(result.accessKeyId).to.equal(S3_CREDENTIALS.accessKeyId)
        expect(result.secretAccessKey).to.equal(S3_CREDENTIALS.secretAccessKey)
      })
    })
  })
})
