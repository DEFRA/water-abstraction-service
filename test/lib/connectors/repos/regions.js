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
  beforeEach(async () => {
    sandbox.stub(Region, 'fetchAll').resolves({
      toJSON: () => ([
        { regionId: 'test-region-id-1' },
        { regionId: 'test-region-id-2' }
      ])
    });
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
});
