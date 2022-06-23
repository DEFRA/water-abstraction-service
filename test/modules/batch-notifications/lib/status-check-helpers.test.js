const { expect } = require('@hapi/code')
const moment = require('moment')
const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const {
  getNextCheckTime,
  getNextCheckCount
} = require('../../../../src/modules/batch-notifications/lib/status-check-helpers')

experiment('batch notifications status check helpers', () => {
  let message

  experiment('getNextCheckTime', () => {
    experiment('for letters', () => {
      beforeEach(async () => {
        message = {
          message_type: 'letter',
          send_after: '2019-04-12 11:00:00',
          status_checks: null
        }
      })

      test('first additional status check is 12 hours after sending', () => {
        const result = getNextCheckTime(message)
        expect(result).to.startWith('2019-04-12T23:00:00')
      })

      test('second additional status check is 24 hours after sending', () => {
        const msg = { ...message, status_checks: 1 }
        const result = getNextCheckTime(msg)
        expect(result).to.startWith('2019-04-13T11:00:00')
      })

      test('third additional status check is 36 hours after sending', () => {
        const msg = { ...message, status_checks: 2 }
        const result = getNextCheckTime(msg)
        expect(result).to.startWith('2019-04-13T23:00:00')
      })
    })

    experiment('for emails', () => {
      beforeEach(async () => {
        message = {
          message_type: 'email',
          send_after: '2019-04-12 11:00:00',
          status_checks: null
        }
      })

      test('first additional status check is 1 minute after sending', () => {
        const result = getNextCheckTime(message)
        expect(result).to.startWith('2019-04-12T11:01:00')
      })

      test('second additional status check is 4 minutes after sending', () => {
        const msg = { ...message, status_checks: 1 }
        const result = getNextCheckTime(msg)
        expect(result).to.startWith('2019-04-12T11:04:00')
      })

      test('third additional status check is 9 minutes after sending', () => {
        const msg = { ...message, status_checks: 2 }
        const result = getNextCheckTime(msg)
        expect(result).to.startWith('2019-04-12T11:09:00')
      })
    })

    experiment('when send_after is null', () => {
      test('send_after is considered to be now', async () => {
        const now = moment()
        const message = {
          message_type: 'email',
          send_after: null,
          status_checks: null
        }
        const result = getNextCheckTime(message, now)
        expect(result).to.equal(now.add(1, 'minute').format())
      })
    })
  })

  experiment('getNextCheckCount', () => {
    beforeEach(async () => {
      message = {
        message_type: 'email',
        send_after: '2019-04-12 11:00:00',
        status_checks: null
      }
    })

    test('if status_checks is null, next count is 1', async () => {
      expect(getNextCheckCount(message)).to.equal(1)
    })

    test('returns status_checks + 1', async () => {
      const msg = { ...message, status_checks: 0 }
      expect(getNextCheckCount(msg)).to.equal(1)
      const msg2 = { ...message, status_checks: 1 }
      expect(getNextCheckCount(msg2)).to.equal(2)
    })
  })
})
