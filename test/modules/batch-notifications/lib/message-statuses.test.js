const { expect } = require('@hapi/code')
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const messageStatuses =
require('../../../../src/modules/batch-notifications/lib/message-statuses')

experiment('message statuses', () => {
  test('should have the correct keys defined', async () => {
    const keys = Object.keys(messageStatuses)
    expect(keys).to.include([
      'MESSAGE_STATUS_DRAFT',
      'MESSAGE_STATUS_SENDING',
      'MESSAGE_STATUS_SENT',
      'MESSAGE_STATUS_ERROR'
    ])
  })
})
