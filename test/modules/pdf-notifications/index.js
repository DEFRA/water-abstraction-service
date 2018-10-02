const Lab = require('lab');
const lab = Lab.script();
const Code = require('code');

const helpers = require('../../../src/modules/pdf-notifications/index.js');

lab.experiment('Test getViewPath', () => {
  lab.test('The function should return the path to the relevant view given a message ref', async () => {
    Code.expect(helpers.getViewPath('pdf.some-view')).to.equal('some-view.html');
  });
});

exports.lab = lab;
