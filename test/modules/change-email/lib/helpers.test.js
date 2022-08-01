const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const helpers = require('../../../../src/modules/change-email/lib/helpers')
const event = require('../../../../src/lib/event')

const guidRegex = /[\d|\w]{8}-[\d|\w]{4}-[\d|\w]{4}-[\d|\w]{4}-[\d|\w]{12}/

experiment('createEventObject', () => {
  beforeEach(() => {
    sandbox.stub(event, 'create')
  })

  afterEach(async () => sandbox.restore())

  test('it calls event.create with the expected arguments', () => {
    helpers.createEventObject('test-username', 'test-id', 'teset-email@domain.com', '1234')
    const [args] = event.create.lastCall.args
    expect(args.eventId).to.match(guidRegex)
    expect(args.issuer).to.equal('test-username')
    expect(args.entities).to.equal(['test-id'])
    expect(args.metadata.oldEmail).to.equal('test-username')
  })
})
