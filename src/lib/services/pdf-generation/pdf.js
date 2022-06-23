'use strict'

const puppeteer = require('puppeteer')
const {
  createHtmlFromTemplate,
  createHtmlFromScheduledNotification
} = require('./html')

/**
 * Creates a PDF using the passed html string
 *
 * @param {String} html The string of html to render in a PDF
 */
const createPdf = async html => {
  const browser = await puppeteer.launch({
    args: ['--no-proxy-server']
  })
  const page = await browser.newPage()

  await page.setContent(html)

  const buffer = await page.pdf({ format: 'A4' })
  await browser.close()
  return buffer
}

/**
 * Creates a PDF using the view template and the data supplied.
 *
 * @param {String} viewPath The path to the view template (this template will
 * exist within the src/views/pdf-notifications directory).
 * @param {Object} data The data to inject into the template
 */
const createPdfFromTemplate = async (viewPath, data) => {
  const html = await createHtmlFromTemplate(viewPath, data)
  return createPdf(html)
}

/**
 * Takes a ScheduledNotification object and renders the required pdf
 *
 * @param {Object<ScheduledNotification>} scheduledNotification The ScheduledNotification
 * model object containing the messageRef and personalisation properties
 */
const createPdfFromScheduledNotification = async scheduledNotification => {
  const html = await createHtmlFromScheduledNotification(scheduledNotification)
  return createPdf(html)
}

exports.createPdf = createPdf
exports.createPdfFromScheduledNotification = createPdfFromScheduledNotification
exports.createPdfFromTemplate = createPdfFromTemplate
