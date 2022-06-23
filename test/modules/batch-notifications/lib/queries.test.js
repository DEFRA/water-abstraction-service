const { expect } = require('@hapi/code')
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { pool } = require('../../../../src/lib/connectors/db')

const { MESSAGE_STATUS_SENT, MESSAGE_STATUS_SENDING } =
require('../../../../src/modules/batch-notifications/lib/message-statuses')

const { EVENT_STATUS_SENDING } =
require('../../../../src/modules/batch-notifications/lib/event-statuses')

const queries =
require('../../../../src/modules/batch-notifications/lib/queries')

experiment('queries', () => {
  const data = [{ foo: 'bar' }]
  const eventId = 'event_id'

  beforeEach(async () => {
    sandbox.stub(pool, 'query').resolves({ rows: data })
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('getSendingMessageBatch', () => {
    test('passes a string query to pool.query', async () => {
      await queries.getSendingMessageBatch()
      const [query] = pool.query.lastCall.args
      expect(query).to.be.a.string()
    })

    test('passes expected parameters to pool.query', async () => {
      await queries.getSendingMessageBatch()
      const [, params] = pool.query.lastCall.args
      expect(params).to.equal([MESSAGE_STATUS_SENDING])
    })

    test('resolves with the data returned from the query', async () => {
      const result = await queries.getSendingMessageBatch()
      expect(result).to.equal(data)
    })
  })

  experiment('getSendingEvents', () => {
    test('passes a string query to pool.query', async () => {
      await queries.getSendingEvents()
      const [query] = pool.query.lastCall.args
      expect(query).to.be.a.string()
    })

    test('passes expected parameters to pool.query', async () => {
      await queries.getSendingEvents()
      const [, params] = pool.query.lastCall.args
      expect(params).to.equal([EVENT_STATUS_SENDING])
    })

    test('resolves with the data returned from the query', async () => {
      const result = await queries.getSendingEvents()
      expect(result).to.equal(data)
    })
  })

  experiment('getMessageStatuses', () => {
    test('passes a string query to pool.query', async () => {
      await queries.getMessageStatuses(eventId)
      const [query] = pool.query.lastCall.args
      expect(query).to.be.a.string()
    })

    test('passes expected parameters to pool.query', async () => {
      await queries.getMessageStatuses(eventId)
      const [, params] = pool.query.lastCall.args
      expect(params).to.equal([eventId])
    })

    test('resolves with the data returned from the query', async () => {
      const result = await queries.getMessageStatuses()
      expect(result).to.equal(data)
    })
  })

  experiment('getNotifyStatusChecks', () => {
    test('passes a string query to pool.query', async () => {
      await queries.getNotifyStatusChecks(eventId)
      const [query] = pool.query.lastCall.args
      expect(query).to.be.a.string()
    })

    test('passes expected parameters to pool.query', async () => {
      await queries.getNotifyStatusChecks(eventId)
      const [, params] = pool.query.lastCall.args
      expect(params).to.equal([MESSAGE_STATUS_SENT])
    })

    test('resolves with the data returned from the query', async () => {
      const result = await queries.getNotifyStatusChecks()
      expect(result).to.equal(data)
    })
  })
})
