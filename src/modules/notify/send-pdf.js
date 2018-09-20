const { getPdfNotifyKey } = require('./helpers');
const NotifyClient = require('notifications-node-client').NotifyClient;
const notifyClient = new NotifyClient(getPdfNotifyKey(process.env));
const puppeteer = require('puppeteer');

/**
 * Generates a PDF from the supplied URL and returns a buffer
 * @param {String} url
 * @return {Promise} resolves with PDF buffer
 */
const createPdf = async (url) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({Authorization: process.env.JWT_TOKEN});
  await page.goto(url, {waitUntil: 'networkidle2'});
  const buffer = await page.pdf({format: 'A4'});
  await browser.close();
  return buffer;
};

/**
 * Sends a PDF message.  The message is rendered with Nunjucks as HTML
 * then captured as a PDF and sent with Notify
 */
const sendPdfMessage = async (data) => {
  // The local URL on the water service which renders the required HTML
  // content for PDF
  const pdfContentUrl = `${process.env.WATER_URI}/pdf-notifications/render/${data.id}`;
  const pdf = await createPdf(pdfContentUrl);

  return notifyClient.sendPrecompiledLetter(
    data.id,
    pdf
  );
};

module.exports = {
  sendPdfMessage,
  createPdf
};
