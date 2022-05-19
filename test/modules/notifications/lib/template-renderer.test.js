const Lab = require('@hapi/lab')
const lab = exports.lab = Lab.script()
const { expect } = require('@hapi/code')

const renderTemplates = require('../../../../src/modules/notifications/lib/template-renderer')

lab.experiment('Plurals', () => {
  const getContacts = multiLicence => {
    const contact = { method: 'post' }
    contact.licences = multiLicence ? ['one', 'two'] : ['one']
    return [contact]
  }
  const licences = { one: {}, two: {} }
  const template = '{{ \'Plural\' if pluralLicence }}{{ \'Singular\' if pluralLicence == false }}'
  const task = {
    config: {
      content: { default: template }
    }
  }

  lab.test('When one licence the pluralLicence value is false', async () => {
    const rendered = renderTemplates(task, {}, getContacts(false), licences)
    expect(rendered[0].output).to.equal('Singular')
  })

  lab.test('When zero licences the pluralLicence value is true', async () => {
    const contacts = getContacts()
    contacts[0].licences = []

    const rendered = renderTemplates(task, {}, contacts, {})
    expect(rendered[0].output).to.equal('Plural')
  })

  lab.test('When two licences the pluralLicence value is true', async () => {
    const rendered = renderTemplates(task, {}, getContacts(true), licences)
    expect(rendered[0].output).to.equal('Plural')
  })
})

lab.experiment('isPost', () => {
  const getContacts = method => {
    const contact = { method }
    contact.licences = ['one']
    return [contact]
  }
  const licences = { one: {} }
  const template = '{{ \'Post\' if isPost }}{{ \'Not Post\' if isPost == false }}'
  const task = {
    config: {
      content: { default: template }
    }
  }

  lab.test('Renders specific text for a post contact method', async () => {
    const rendered = renderTemplates(task, {}, getContacts('post'), licences)
    expect(rendered[0].output).to.equal('Post')
  })

  lab.test('Renders specific text if not a post contact method', async () => {
    const rendered = renderTemplates(task, {}, getContacts('sms'), licences)
    expect(rendered[0].output).to.equal('Not Post')
  })
})

exports.lab = lab
