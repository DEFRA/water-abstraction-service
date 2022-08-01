const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const { expect } = require('@hapi/code')
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const repos = require('../../../src/lib/connectors/repos')
const applicationStateService = require('../../../src/lib/services/application-state')

experiment('lib/services/application-state', () => {
  beforeEach(async () => {
    sandbox.stub(repos.applicationState, 'findOneByKey')
    sandbox.stub(repos.applicationState, 'update')
    sandbox.stub(repos.applicationState, 'create')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.get', () => {
    let result

    experiment('when a row is found', () => {
      beforeEach(async () => {
        repos.applicationState.findOneByKey.resolves({
          data: {
            etag: 'test-etag'
          }
        })
        result = await applicationStateService.get('test-key')
      })

      test('.findOneByKey is called with correct key', async () => {
        expect(repos.applicationState.findOneByKey.calledWith('test-key')).to.be.true()
      })

      test('resolves with the value of the entity', async () => {
        expect(result).to.equal({
          data: {
            etag: 'test-etag'
          }
        })
      })
    })

    experiment('when a row is not found', () => {
      beforeEach(async () => {
        repos.applicationState.findOneByKey.resolves(null)
        result = await applicationStateService.get('test-key')
      })

      test('resolves with null', async () => {
        expect(result).to.equal(null)
      })
    })
  })

  experiment('.save', () => {
    experiment('when a row with the supplied key already exists', () => {
      beforeEach(async () => {
        repos.applicationState.findOneByKey.resolves({
          applicationStateId: 'test-id'
        })
        await applicationStateService.save('test-key', { etag: 'test-etag' })
      })

      test('.findOneByKey is called with correct key', async () => {
        expect(repos.applicationState.findOneByKey.calledWith('test-key')).to.be.true()
      })

      test('calls the repo .update() method', async () => {
        expect(repos.applicationState.update.calledWith(
          'test-id', { data: { etag: 'test-etag' } }
        )).to.be.true()
      })
    })

    experiment('when a row with the supplied key does not exist', () => {
      beforeEach(async () => {
        repos.applicationState.findOneByKey.resolves(null)
        await applicationStateService.save('test-key', { etag: 'test-etag' })
      })

      test('.findOneByKey is called with correct key', async () => {
        expect(repos.applicationState.findOneByKey.calledWith('test-key')).to.be.true()
      })

      test('calls the repo .create() method', async () => {
        expect(repos.applicationState.create.calledWith(
          { key: 'test-key', data: { etag: 'test-etag' } }
        )).to.be.true()
      })
    })
  })
})
