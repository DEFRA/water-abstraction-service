'use strict'

// Test framework dependencies
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

// Things we need to stub
const notify = require('../../../src/lib/notify')

// Thing under test
const { enqueue } = require('../../../src/modules/notify/index.js')

experiment('Test notify module (index.js)', () => {
  afterEach(async () => {
    sandbox.restore()
  })

  experiment('enqueue()', () => {
    let queueManager

    beforeEach(async () => {
      queueManager = {
        register: sandbox.stub().resolves(),
        add: sandbox.stub().resolves()
      }

      sandbox.stub(notify, 'preview').returns({ body: { body: 'It has a test value of 00/00/00/00', type: 'email' } })
    })

    test('queues an email message for immediate sending', async () => {
      const { data } = await enqueue(queueManager, {
        messageRef: 'unit_test_email',
        recipient: 'mail@example.com',
        licences: ['01/234'],
        personalisation: {
          test_value: '00/00/00/00'
        }
      })

      expect(data.recipient).to.equal('mail@example.com')
      expect(data.plaintext).to.equal('It has a test value of 00/00/00/00')
    })
  })

})
