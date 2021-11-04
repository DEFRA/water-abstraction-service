'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const uuid = require('uuid/v4');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { ChargeCategory } = require('../../../../src/lib/connectors/bookshelf');
const repo = require('../../../../src/lib/connectors/repos/charge-categories');
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers');

experiment('lib/connectors/repos/charge-categories', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'create');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.create', () => {
    const data = { reference: 'crumpets' };

    test('delegates to helpers.update', async () => {
      await repo.create(data);
      expect(helpers.create.calledWith(
        ChargeCategory,
        data
      ));
    });
  });

  experiment('.findAll', () => {
    test('delegates to helpers.findMany', async () => {
      await repo.findAll();
      expect(helpers.findMany.calledWith(
        ChargeCategory
      ));
    });
  });

  experiment('.findOneById', () => {
    test('delegates to helpers.findMany', async () => {
      const tempGuid = uuid();
      await repo.findOneById(tempGuid);
      expect(helpers.findMany.calledWith(
        tempGuid
      ));
    });
  });
});
