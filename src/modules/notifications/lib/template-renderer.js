/**
 * Combines data from various sources: task config, template params, contacts,
 * transformed licence data, and returns an array of messages to send including
 * the rendered template content
 * @module modules/notifications/task-config-loader
 */

const nunjucks = require('nunjucks')
const moment = require('moment')

nunjucks.configure({
  autoescape: false
})

class NoTemplateError extends Error {
  constructor (message) {
    super(message)
    this.name = 'NoTemplateError'
  }
}

/**
 * Returns the correct template string based on the current task config and contact
 * @param {Object} taskConfig - the task config for the current message
 * @param {Object} contact - the contact details for the current message
 * @return {String} Nunjucks template to render
 */
function getTemplate (taskConfig, contact) {
  // Choose the correct template for the message type
  const { default: defaultTemplate, letter, email, sms } = taskConfig.config.content
  const { method } = contact
  let template
  if (method === 'post') {
    template = letter || defaultTemplate
  } else if (method === 'email') {
    template = email || defaultTemplate
  } else if (method === 'sms') {
    template = sms || defaultTemplate
  } else throw new NoTemplateError(`No template found for method ${contact.method}`, taskConfig)
  return template
}

/**
 * @param {Object} taskConfig - an object of task config fata from the water service DB
 * @param {Object} params - user-supplied template variables
 * @param {Array} contacts - array of contacts with licence header data
 * @param {Object} licences - list of licences keyed by licence number
 * @param {Object} context - additional context to send to the view
 */
function renderTemplates (taskConfig, params, contacts, licences, context = {}) {
  const date = moment().format('DD MMM YYYY')

  const viewContexts = []

  return contacts.map((contact) => {
    const licenceList = contact.licences.map((licence) => {
      return licences[licence.system_external_id]
    })

    // Assemble view data for passing to Nunjucks template
    const viewContext = {
      taskConfig,
      params,
      contact,
      licences: licenceList,
      pluralLicence: licenceList.length !== 1,
      date,
      ...context,
      isPost: contact.method === 'post'
    }

    viewContexts.push(viewContext)

    // Get the correct Nunjucks template for the message type
    const template = getTemplate(taskConfig, contact)

    // Render template
    const output = nunjucks.renderString(template, viewContext)

    return {
      contact,
      output
    }
  })
}

module.exports = renderTemplates
