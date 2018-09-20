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

module.exports = {
  createPdf
};
