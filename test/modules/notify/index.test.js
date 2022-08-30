const Lab = require('@hapi/lab')
const lab = Lab.script()
const Code = require('@hapi/code')

const { enqueue } = require('../../../src/modules/notify/index.js')
const { logger } = require('../../../src/logger')
const sandbox = require('sinon').createSandbox()

const notify = require('../../../src/lib/notify')

lab.experiment('Test notify module', () => {
  let queueManager
  lab.before(async () => {
    queueManager = {
      register: sandbox.stub().resolves(),
      add: sandbox.stub().resolves()
    }
    sandbox.stub(logger, 'error').returns()
    sandbox.stub(logger, 'info').returns()
    sandbox.stub(notify, 'preview').returns({ body: { body: 'It has a test value of 00/00/00/00', type: 'email' }})
  })

  lab.after(async () => {
    sandbox.restore()
  })

  lab.test('Enqueue message for immediate send', async () => {
    const { data } = await enqueue(queueManager, {
      messageRef: 'unit_test_email',
      recipient: 'mail@example.com',
      licences: ['01/234'],
      personalisation: {
        test_value: '00/00/00/00'
      }
    })

    Code.expect(data.recipient).to.equal('mail@example.com')
    Code.expect(data.plaintext).to.equal('It has a test value of 00/00/00/00')
  })
})

exports.lab = lab
