const { expect } = require('@hapi/code')
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const eventStatuses =
require('../../../../src/modules/batch-notifications/lib/event-statuses')

experiment('event statuses', () => {
  test('should have the correct keys defined', async () => {
    const keys = Object.keys(eventStatuses)
    expect(keys).to.include([
      'EVENT_STATUS_PROCESSING',
      'EVENT_STATUS_PROCESSED',
      'EVENT_STATUS_SENDING',
      'EVENT_STATUS_COMPLETED',
      'EVENT_STATUS_ERROR'
    ])
  })
})
