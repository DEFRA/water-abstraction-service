'use strict'

const QRCode = require('qrcode-svg')
const nunjucks = require('nunjucks')

const { testMode } = require('../../../../config')
const viewHelpers = require('./view-helpers')

const env = nunjucks.configure('./src/views/pdf-notifications/', {
  noCache: testMode
})

/**
 * Renders the data in the view using Nunjucks environment
 *
 * @param {String} view - the view/template name
 * @param {Object} data - data to send to view
 * @return {Promise} resolves with rendered template, or rejects with error
 */
const createHtmlFromTemplate = (view, data) => {
  return new Promise((resolve, reject) => {
    env.render(view, data, (err, result) => {
      return err ? reject(err) : resolve(result)
    })
  })
}

/**
 * Takes a ScheduledNotification object and renders the required html
 *
 * @param {Object<ScheduledNotification>} scheduledNotification The ScheduledNotification
 * model object containing the messageRef and personalisation properties
 */
const createHtmlFromScheduledNotification = scheduledNotification => {
  const view = scheduledNotification.messageRef.replace(/^pdf\./i, '') + '.html'
  return createHtmlFromTemplate(view, { notification: scheduledNotification })
}

env.addGlobal('paginateReturnLines', viewHelpers.paginateReturnLines)
env.addGlobal('qrCode', (content, size) => {
  return new QRCode({
    content,
    width: size,
    height: size
  }).svg()
})

env.addFilter('naldRegion', viewHelpers.naldRegion)
env.addFilter('naldArea', viewHelpers.naldArea)
env.addFilter('date', viewHelpers.dateFormat)
env.addFilter('stringify', viewHelpers.stringify)

exports.createHtmlFromScheduledNotification = createHtmlFromScheduledNotification
exports.createHtmlFromTemplate = createHtmlFromTemplate
