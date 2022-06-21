'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const helpers = require('../../../../../src/lib/connectors/repos/lib/helpers');

experiment('lib/connectors/repos/lib/helpers', () => {
  experiment('.findOne', () => {
    let result;
    let model;

    beforeEach(async () => {
      result = {
        toJSON: sandbox.spy()
      };
      model = {
        forge: sandbox.stub().returnsThis(),
        fetch: sandbox.stub().resolves(result)
      };

      await helpers.findOne(model, 'testKey', 'test-id');
    });

    test('calls forge on the model with the id', async () => {
      const [idFilter] = model.forge.lastCall.args;
      expect(idFilter).to.equal({
        testKey: 'test-id'
      });
    });

    test('fetches the data', async () => {
      const [idFilter] = model.forge.lastCall.args;
      expect(idFilter).to.equal({
        testKey: 'test-id'
      });
    });

    test('returns the entity as JSON when found', async () => {
      expect(result.toJSON.called).to.equal(true);
    });

    test('returns null if no data found', async () => {
      model.fetch.resolves(null);
      const data = await helpers.findOne(model, 'testKey', 'test-id');
      expect(data).to.equal(null);
    });

    test('can add relations', async () => {
      await helpers.findOne(model, 'testKey', 'test-id', ['one', 'two']);
      const [options] = model.fetch.lastCall.args;
      expect(options.withRelated).to.equal(['one', 'two']);
    });

    test('will not throw if no entity found', async () => {
      const [options] = model.fetch.lastCall.args;
      expect(options.require).to.equal(false);
    });
  });

  experiment('.create', () => {
    let result;
    let model;

    beforeEach(async () => {
      result = {
        toJSON: sandbox.spy()
      };
      model = {
        forge: sandbox.stub().returnsThis(),
        save: sandbox.stub().resolves(result)
      };

      await helpers.create(model, {
        day: 'Friday'
      });
    });

    test('calls forge on the model with the data', async () => {
      const [data] = model.forge.lastCall.args;
      expect(data).to.equal({
        day: 'Friday'
      });
    });

    test('returns the entity as JSON', async () => {
      expect(result.toJSON.called).to.equal(true);
    });
  });

  experiment('.findMany', () => {
    let result;
    let model;

    beforeEach(async () => {
      result = {
        toJSON: sandbox.spy()
      };
      model = {
        forge: sandbox.stub().returnsThis(),
        where: sandbox.stub().returnsThis(),
        fetchAll: sandbox.stub().resolves(result)
      };

      await helpers.findMany(model, { testKey: 'test-id' });
    });

    test('filters the result', async () => {
      const [idFilter] = model.where.lastCall.args;
      expect(idFilter).to.equal({
        testKey: 'test-id'
      });
    });

    test('fetches all relevant data', async () => {
      expect(model.fetchAll.called).to.be.true();
    });

    test('will not throw if no entity found', async () => {
      const [options] = model.fetchAll.lastCall.args;
      expect(options.require).to.equal(false);
    });

    test('returns the entity as JSON', async () => {
      expect(result.toJSON.called).to.equal(true);
    });
  });

  experiment('.deleteOne', () => {
    let model;

    beforeEach(async () => {
      model = {
        forge: sandbox.stub().returnsThis(),
        destroy: sandbox.stub().resolves()
      };

      await helpers.deleteOne(model, 'test-id', 'test-value');
    });

    test('calls forge on the model', async () => {
      expect(model.forge.called).to.equal(true);
      expect(model.forge.calledWith({ 'test-id': 'test-value' })).to.be.true();
    });

    test('deletes the data', async () => {
      expect(model.destroy.called).to.be.true();
    });
  });

  experiment('.deleteTestData', () => {
    let model;

    beforeEach(async () => {
      model = {
        forge: sandbox.stub().returnsThis(),
        where: sandbox.stub().returnsThis(),
        destroy: sandbox.stub().resolves()
      };

      await helpers.deleteTestData(model);
    });

    test('calls forge on the model', async () => {
      expect(model.forge.called).to.equal(true);
    });

    test('filters where is_test is true', async () => {
      const [where] = model.where.lastCall.args;
      expect(where).to.equal({ is_test: true });
    });

    test('deletes the data but does not require a match', async () => {
      const [destroy] = model.destroy.lastCall.args;
      expect(destroy).to.equal({ require: false });
    });
  });

  experiment('.update', () => {
    let result;
    let model;

    beforeEach(async () => {
      result = {
        toJSON: sandbox.spy()
      };
      model = {
        forge: sandbox.stub().returnsThis(),
        save: sandbox.stub().resolves(result)
      };

      await helpers.update(model, 'id', 'test-id', {
        day: 'Friday'
      });
    });

    test('calls forge on the model with the correct id', async () => {
      const [data] = model.forge.lastCall.args;
      expect(data).to.equal({
        id: 'test-id'
      });
    });

    test('calls save on the model with the correct data', async () => {
      const [data] = model.save.lastCall.args;
      expect(data).to.equal({
        day: 'Friday'
      });
    });

    test('returns the entity as JSON', async () => {
      expect(result.toJSON.called).to.equal(true);
    });
  });

  experiment('.deleteOne', () => {
    let model;

    beforeEach(async () => {
      model = {
        forge: sandbox.stub().returnsThis(),
        destroy: sandbox.stub()
      };

      await helpers.deleteOne(model, 'id', 'test-id');
    });

    test('calls forge on the model with the correct id', async () => {
      const [data] = model.forge.lastCall.args;
      expect(data).to.equal({
        id: 'test-id'
      });
    });

    test('calls destroy on the model', async () => {
      expect(model.destroy.called).to.be.true();
    });
  });

  experiment('.findManyWithPaging', () => {
    let result;
    let model;
    let response;

    beforeEach(async () => {
      result = {
        toJSON: sandbox.spy(),
        pagination: {
          page: 1,
          pageSize: 100,
          rowCount: 243
        }
      };
      model = {
        forge: sandbox.stub().returnsThis(),
        where: sandbox.stub().returnsThis(),
        fetchPage: sandbox.stub().resolves(result)
      };
      // conditions = {}, withRelated = [], page = 1, pageSize = 10
      response = await helpers.findManyWithPaging(model, { testKey: 'test-id' }, ['relatedModel'], 2, 100);
    });

    test('filters the result', async () => {
      const [idFilter] = model.where.lastCall.args;
      expect(idFilter).to.equal({
        testKey: 'test-id'
      });
    });

    test('fetches all relevant data woth fetchPage', async () => {
      expect(model.fetchPage.called).to.be.true();
    });

    test('will not throw if no entity found', async () => {
      const [options] = model.fetchPage.lastCall.args;
      expect(options.page).to.equal(2);
      expect(options.pageSize).to.equal(100);
    });

    test('will not throw if no entity found', async () => {
      expect(response.pagination).to.equal({
        page: 1,
        perPage: 100,
        totalRows: 243
      });
    });

    test('returns the entity as JSON', async () => {
      expect(result.toJSON.called).to.equal(true);
    });
  });
});
