const { expect } = require('@hapi/code')
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const helpers = require('../../../../src/modules/change-email/lib/helpers')
const Event = require('../../../../src/lib/models/event.js')

experiment('createEventObject', () => {
  test('it creates a new event model instance', () => {
    const result = helpers.createEventObject(
      'old@example.co.uk', '0b082764-39df-41a8-8c61-11ea395da7e2', 'new@domain.com', '1234'
    )

    expect(result).to.be.an.instanceOf(Event)
    expect(result.type).to.equal('user-account')
    expect(result.subtype).to.equal('email-change')
    expect(result.issuer).to.equal('old@example.co.uk')
    expect(result.entities).to.equal([{ entityId: '0b082764-39df-41a8-8c61-11ea395da7e2' }])
    expect(result.metadata).to.equal({
      oldEmail: 'old@example.co.uk', newEmail: 'new@domain.com', userId: '1234'
    })
    expect(result.status).to.equal('completed')
  })
})
