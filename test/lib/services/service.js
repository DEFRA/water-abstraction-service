const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const service = require('../../../src/lib/services/service');

const mapper = {
  dbToModel: x => x * 2
};

experiment('lib/services/service', () => {
  experiment('.findOne', () => {
    test('fetches data using the supplied function and passes through the mapper', async () => {
      const fetchFunc = sandbox.stub().resolves(5);
      const result = await service.findOne('test-id', fetchFunc, mapper);
      expect(fetchFunc.calledWith('test-id')).to.be.true();
      expect(result).to.equal(10);
    });
  });

  experiment('.findMany', () => {
    test('fetches data using the supplied function and passes through the mapper', async () => {
      const fetchFunc = sandbox.stub().resolves([1, 2, 3]);
      const result = await service.findMany('test-id', fetchFunc, mapper);
      expect(fetchFunc.calledWith('test-id')).to.be.true();
      expect(result).to.equal([2, 4, 6]);
    });
  });

  experiment('.findAll', () => {
    test('fetches data using the supplied function and passes through the mapper', async () => {
      const fetchFunc = sandbox.stub().resolves([1, 2, 3]);
      const result = await service.findAll(fetchFunc, mapper);
      expect(result).to.equal([2, 4, 6]);
    });
  });
});
