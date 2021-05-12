const { expect } = require('@hapi/code');
const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const helpers = require('../../../src/modules/gauging-stations/helpers');

experiment('.getArraysFromCSV', () => {
  const initialCSVBody = 'title1,title2\nparam1,param2';
  let response;

  beforeEach(async () => {
    response = helpers.getArraysFromCSV(initialCSVBody);
  });

  test('returns an expected parsed array', async () => {
    expect(response).to.equal([['title1', 'title2'], ['param1', 'param2']]);
  });
});
