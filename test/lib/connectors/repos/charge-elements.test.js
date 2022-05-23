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

const { ChargeElement } = require('../../../../src/lib/connectors/bookshelf');
const repo = require('../../../../src/lib/connectors/repos/charge-elements');
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers');

experiment('lib/connectors/repos/charge-elements', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'create');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.create', () => {
    const data = { status: 'current' };

    test('delegates to helpers.update', async () => {
      await repo.create(data);
      expect(helpers.create.calledWith(
        ChargeElement,
        data
      ));
    });
  });
});
