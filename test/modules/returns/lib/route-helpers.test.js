const { expect } = require('@hapi/code');
const sinon = require('sinon');
const { experiment, test, before, after } = exports.lab = require('@hapi/lab').script();

const { failAction } = require('../../../../src/modules/returns/lib/route-helpers');
const { logger } = require('../../../../src/logger');

experiment('failAction', () => {
  const request = {
    path: '/some/path',
    payload: {
      key1: 'value1',
      key2: 'value2'
    }
  };

  const error = {
    message: 'Joi error description here'
  };

  let stub;

  before(async () => {
    stub = sinon.stub(logger, 'error');
  });

  after(async () => {
    stub.restore();
  });

  test('it should throw a Boom error with relevant data', async () => {
    const func = async () => {
      return failAction(request, {}, error);
    };

    expect(func()).to.reject(Error);
    expect(stub.firstCall.args[0]).to.equal(error.message);
    expect(stub.firstCall.args[2].path).to.equal(request.path);
    expect(stub.firstCall.args[2].payload).to.equal(request.payload);
  });
});
