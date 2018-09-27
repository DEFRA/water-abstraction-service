require('dotenv').config();
const Lab = require('lab');
const lab = Lab.script();
const Code = require('code');
const path = require('path');

const { createPdf } = require('../../../../src/modules/notify/lib/pdf.js');

lab.experiment('Test createPdf', () => {
  lab.test('It should render and create a PDF as a buffer from a URL', async () => {
    const url = `https://www.gov.uk`;
    const buff = await createPdf(url);
    Code.expect(buff).to.be.a.buffer();
  });
});

exports.lab = lab;
