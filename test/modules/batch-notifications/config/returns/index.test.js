const { expect } = require('@hapi/code')
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const [invitationConfig, reminderConfig] =
  require('../../../../../src/modules/batch-notifications/config/returns/index')
const { getRecipients } =
  require('../../../../../src/modules/batch-notifications/config/returns/lib/get-recipients')

experiment('returns notifications config', () => {
  experiment('return invitation config', () => {
    test('has the correct prefix', async () => {
      expect(invitationConfig.prefix).to.equal('RINV-')
    })

    test('has the correct name', async () => {
      expect(invitationConfig.name).to.equal('Returns: invitation')
    })

    test('has the correct message type', async () => {
      expect(invitationConfig.messageType).to.equal('returnInvitation')
    })

    test('uses the correct function to get recipients', async () => {
      expect(invitationConfig.getRecipients).to.equal(getRecipients)
    })

    experiment('schema', () => {
      test('can be an empty object', async () => {
        const { error } = invitationConfig.schema.validate({})
        expect(error).to.equal(undefined)
      })

      test('can contain an array of licence numbers to exclude from the notification', async () => {
        const { error } = invitationConfig.schema.validate({
          excludeLicences: ['01/123', '04/567']
        })
        expect(error).to.equal(undefined)
      })
    })
  })

  experiment('return reminder config', () => {
    test('has the correct prefix', async () => {
      expect(reminderConfig.prefix).to.equal('RREM-')
    })

    test('has the correct name', async () => {
      expect(reminderConfig.name).to.equal('Returns: reminder')
    })

    test('has the correct message type', async () => {
      expect(reminderConfig.messageType).to.equal('returnReminder')
    })

    test('uses the correct function to get recipients', async () => {
      expect(reminderConfig.getRecipients).to.equal(getRecipients)
    })

    experiment('schema', () => {
      test('can be an empty object', async () => {
        const { error } = reminderConfig.schema.validate({})
        expect(error).to.equal(undefined)
      })

      test('can contain an array of licence numbers to exclude from the notification', async () => {
        const { error } = reminderConfig.schema.validate({
          excludeLicences: ['01/123', '04/567']
        })
        expect(error).to.equal(undefined)
      })
    })
  })
})
