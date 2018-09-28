const puppeteer = require('puppeteer');
const { getRenderNotification } = require('../../pdf-notifications');

/**
 * Generates a PDF from the supplied URL and returns a buffer
 * @param {String} notificationId - ID from scheduled_notification table
 * @return {Promise} resolves with PDF buffer
 */
const createPdf = async (notificationId) => {
  const browser = await puppeteer.launch({
    args: ['--no-proxy-server']
  });
  const page = await browser.newPage();

  // Create HTML and set page content in browser
  const html = await getRenderNotification(notificationId);
  await page.setContent(html);

  const buffer = await page.pdf({format: 'A4'});
  await browser.close();
  return buffer;
};

module.exports = {
  createPdf
};
