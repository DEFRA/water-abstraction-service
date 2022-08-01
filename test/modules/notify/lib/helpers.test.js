const Lab = require('@hapi/lab')
const lab = Lab.script()
const Code = require('@hapi/code')

const { isPdf, parseSentResponse, validateEnqueueOptions } = require('../../../../src/modules/notify/lib/helpers.js')

lab.experiment('Test isPdf', () => {
  lab.test('Should return true for PDF message ref', async () => {
    Code.expect(isPdf('pdf.return_form')).to.equal(true)
  })

  lab.test('Should not be case-sensitive', async () => {
    Code.expect(isPdf('PDF.RETURN_FORM')).to.equal(true)
  })

  lab.test('Should return false for other message ref', async () => {
    Code.expect(isPdf('security_code_letter')).to.equal(false)
  })
})

lab.experiment('Test parseSentResponse', () => {
  const notifyResponse = {
    body: {
      id: 'abc123',
      content: {
        body: 'body here'
      }
    }
  }

  lab.test('Should parse Notify response correctly', async () => {
    Code.expect(parseSentResponse(notifyResponse)).to.equal({
      status: 'sent',
      notify_id: 'abc123',
      plaintext: 'body here'
    })
  })
})

lab.experiment('Test validateEnqueueOptions', () => {
  const options = {
    messageRef: 'template.name',
    recipient: 'mail@example.com',
    personalisation: {
      name: 'John',
      lastName: 'Doe',
      subject: 'Test Message'
    },
    messageType: 'email'
  }

  lab.test('Should accept a valid configuration without ID and generate GUID ID', async () => {
    const { error, value } = validateEnqueueOptions(options)

    Code.expect(error).to.equal(undefined)
    Code.expect(value.id).to.be.a.string()
    Code.expect(value.id).to.have.length(36)
  })

  lab.test('Should accept a valid configuration with custom ID', async () => {
    const opts = {
      ...options,
      id: 'custom'
    }

    const { error, value } = validateEnqueueOptions(opts)

    Code.expect(error).to.equal(undefined)
    Code.expect(value.id).to.be.a.string()
    Code.expect(value.id).to.equal('custom')
  })

  lab.test('Should require message ref', async () => {
    const { messageRef, ...rest } = options

    const { error } = validateEnqueueOptions(rest)

    Code.expect(error.name).to.equal('ValidationError')
  })

  lab.test('Should reject invalid message type', async () => {
    const opts = {
      ...options,
      messageType: 'pidgeon'
    }

    const { error } = validateEnqueueOptions(opts)

    Code.expect(error.name).to.equal('ValidationError')
  })

  lab.test('Should require personalisation to be an object', async () => {
    const opts = {
      ...options,
      personalisation: 'Hello'
    }

    const { error } = validateEnqueueOptions(opts)
    Code.expect(error.name).to.equal('ValidationError')
  })

  lab.test('Should accept personalisation object', async () => {
    const opts = {
      ...options,
      personalisation: { name: 'John' }
    }

    const { value } = validateEnqueueOptions(opts)

    Code.expect(value.personalisation.name).to.equal('John')
  })

  lab.test('Should accept JSON as personalisation, value is converted to object', async () => {
    const opts = {
      ...options,
      personalisation: '{"name" : "John"}'
    }

    const { value } = validateEnqueueOptions(opts)
    Code.expect(value.personalisation.name).to.equal('John')
  })

  lab.test('Should accept an array of licence numbers', async () => {
    const opts = {
      ...options,
      licences: ['01/112', '01/113']
    }

    const { error } = validateEnqueueOptions(opts)

    Code.expect(error).to.equal(undefined)
  })

  lab.test('Should accept an empty array of licence numbers', async () => {
    const opts = {
      ...options,
      licences: []
    }

    const { error } = validateEnqueueOptions(opts)

    Code.expect(error).to.equal(undefined)
  })

  lab.test('Should accept a GUID individual entity IDs', async () => {
    const opts = {
      ...options,
      individualEntityId: '4e0d47c4-6de3-4ece-8e24-d0c01d0a6473'
    }

    const { error } = validateEnqueueOptions(opts)

    Code.expect(error).to.equal(undefined)
  })

  lab.test('Should accept a null individual entity ID', async () => {
    const opts = {
      ...options,
      individualEntityId: null
    }

    const { error } = validateEnqueueOptions(opts)

    Code.expect(error).to.equal(undefined)
  })

  lab.test('Should reject non-GUID individual entity ID', async () => {
    const opts = {
      ...options,
      individualEntityId: 'not-a-guid'
    }

    const { error } = validateEnqueueOptions(opts)

    Code.expect(error.name).to.equal('ValidationError')
  })

  lab.test('Should accept a GUID company entity IDs', async () => {
    const opts = {
      ...options,
      companyEntityId: '4e0d47c4-6de3-4ece-8e24-d0c01d0a6473'
    }

    const { error } = validateEnqueueOptions(opts)

    Code.expect(error).to.equal(undefined)
  })

  lab.test('Should accept a null company entity ID', async () => {
    const opts = {
      ...options,
      companyEntityId: null
    }

    const { error } = validateEnqueueOptions(opts)

    Code.expect(error).to.equal(undefined)
  })

  lab.test('Should reject non-GUID company entity ID', async () => {
    const opts = {
      ...options,
      companyEntityId: 'not-a-guid'
    }

    const { error } = validateEnqueueOptions(opts)

    Code.expect(error.name).to.equal('ValidationError')
  })

  lab.test('Should accept GUID event ID', async () => {
    const opts = {
      ...options,
      eventId: '4e0d47c4-6de3-4ece-8e24-d0c01d0a6473'
    }

    const { error } = validateEnqueueOptions(opts)

    Code.expect(error).to.equal(undefined)
  })

  lab.test('Should reject non-GUID event ID', async () => {
    const opts = {
      ...options,
      eventId: 'not-a-guid'
    }

    const { error } = validateEnqueueOptions(opts)

    Code.expect(error.name).to.equal('ValidationError')
  })

  lab.test('Should accept object metadata', async () => {
    const opts = {
      ...options,
      metadata: {
        param: 'value'
      }
    }

    const { error, value } = validateEnqueueOptions(opts)

    Code.expect(error).to.equal(undefined)
    Code.expect(value.metadata.param).to.equal('value')
  })

  lab.test('Should accept JSON-encoded object metadata', async () => {
    const opts = {
      ...options,
      metadata: '{"param": "value"}'
    }
    const { error, value } = validateEnqueueOptions(opts)

    Code.expect(error).to.equal(undefined)
    Code.expect(value.metadata.param).to.equal('value')
  })

  lab.test('Should reject non-object metadata', async () => {
    const opts = {
      ...options,
      metadata: 'not-an-object'
    }

    const { error } = validateEnqueueOptions(opts)

    Code.expect(error.name).to.equal('ValidationError')
  })
})

exports.lab = lab
