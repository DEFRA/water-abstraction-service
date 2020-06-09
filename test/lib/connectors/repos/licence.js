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

const licencesRespo = require('../../../../src/lib/connectors/repos/licences');
const { Licence } = require('../../../../src/lib/connectors/bookshelf');

experiment('lib/connectors/repos/licences', () => {
  let model, stub;

  beforeEach(async () => {
    model = {
      toJSON: sandbox.stub().returns({ foo: 'bar' })
    };

    stub = {
      fetch: sandbox.stub().resolves(model)
    };
    sandbox.stub(Licence, 'forge').returns(stub);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findOne', () => {
    let result;

    experiment('when a record is found', () => {
      beforeEach(async () => {
        result = await licencesRespo.findOne('test-id');
      });

      test('calls model.forge with correct id', async () => {
        const [params] = Licence.forge.lastCall.args;
        expect(params).to.equal({ licenceId: 'test-id' });
      });

      test('calls fetch() with related models', async () => {
        const [params] = stub.fetch.lastCall.args;
        expect(params.withRelated).to.equal(['region']);
      });

      test('calls toJSON() on returned models', async () => {
        expect(model.toJSON.callCount).to.equal(1);
      });

      test('returns the result of the toJSON() call', async () => {
        expect(result).to.equal({ foo: 'bar' });
      });
    });

    experiment('when a record is not found', () => {
      beforeEach(async () => {
        stub.fetch.resolves(null);
        result = await licencesRespo.findOne('test-id');
      });

      test('resolves with null', async () => {
        expect(result).to.equal(null);
      });
    });
  });
});
