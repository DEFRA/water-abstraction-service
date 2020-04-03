'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const Region = require('../../../../src/lib/connectors/bookshelf/Region');
const repo = require('../../../../src/lib/connectors/repos/regions');

experiment('lib/connectors/repos/regions', () => {
  let model, stub;

  beforeEach(async () => {
    sandbox.stub(Region, 'fetchAll').resolves({
      toJSON: () => ([
        { regionId: 'test-region-id-1' },
        { regionId: 'test-region-id-2' }
      ])
    });

    model = {
      toJSON: sandbox.stub().returns({ regionId: 'test-region-id-1' })
    };

    stub = {
      fetch: sandbox.stub().resolves(model)
    };
    sandbox.stub(Region, 'forge').returns(stub);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.find', () => {
    test('finds all the regions via the model', async () => {
      await repo.find();
      expect(Region.fetchAll.called).to.be.true();
    });

    test('returns the JSON from of the response', async () => {
      const regions = await repo.find();
      expect(regions[0].regionId).to.equal('test-region-id-1');
      expect(regions[1].regionId).to.equal('test-region-id-2');
    });
  });

  experiment('.findOne', () => {
    let result;

    beforeEach(async () => {
      result = await repo.findOne('test-id');
    });

    test('calls model.forge with correct id', async () => {
      const [params] = Region.forge.lastCall.args;
      expect(params).to.equal({ regionId: 'test-id' });
    });

    test('calls fetch()', async () => {
      expect(stub.fetch.called).to.be.true();
    });

    test('calls toJSON() on returned model', async () => {
      expect(model.toJSON.callCount).to.equal(1);
    });

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ regionId: 'test-region-id-1' });
    });
  });
});
