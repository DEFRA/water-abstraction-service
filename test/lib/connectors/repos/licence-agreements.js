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

const repos = require('../../../../src/lib/connectors/repos');
const { LicenceAgreement } = require('../../../../src/lib/connectors/bookshelf');

experiment('lib/connectors/repos/licence-agreements', () => {
  let model, stub, result;

  beforeEach(async () => {
    model = {
      toJSON: sandbox.stub().returns([{ foo: 'bar' }])
    };
    stub = {
      fetchAll: sandbox.stub().resolves(model),
      fetch: sandbox.stub().resolves(model),
      query: sandbox.stub().returnsThis(),
      orderBy: sandbox.stub().returnsThis()
    };
    sandbox.stub(LicenceAgreement, 'forge').returns(stub);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findByLicenceRef', () => {
    experiment('when searching for all regardless of financial agreement type', () => {
      beforeEach(async () => {
        result = await repos.licenceAgreements.findByLicenceRef('test-licence-number');
      });

      test('calls model.forge', async () => {
        expect(LicenceAgreement.forge.called).to.be.true();
      });

      test('queries by licence reference', async () => {
        expect(stub.query.calledWith(
          'where', 'licence_ref', 'test-licence-number'
        )).to.be.true();
      });

      test('queries by licence agreement', async () => {
        expect(stub.query.calledWith('whereIn')).to.equal(false);
      });

      test('sorts by start date', async () => {
        expect(stub.orderBy.calledWith(
          'start_date', 'asc'
        )).to.be.true();
      });

      test('calls .fetchAll() to retrieve all matching records', async () => {
        expect(stub.fetchAll.called).to.be.true();
      });

      test('calls .toJSON() on the collection', async () => {
        expect(model.toJSON.called).to.be.true();
      });

      test('resolves with an array', async () => {
        expect(result).to.be.an.array();
      });
    });

    experiment('when searching for specific financial agreement types', () => {
      beforeEach(async () => {
        result = await repos.licenceAgreements.findByLicenceRef('test-licence-number', ['test-agreement-a', 'test-agreement-b']);
      });

      test('calls model.forge', async () => {
        expect(LicenceAgreement.forge.called).to.be.true();
      });

      test('queries by licence reference', async () => {
        expect(stub.query.calledWith(
          'where', 'licence_ref', 'test-licence-number'
        )).to.be.true();
      });

      test('queries by licence agreement', async () => {
        expect(stub.query.calledWith(
          'whereIn', 'financial_agreement_type_id', ['test-agreement-a', 'test-agreement-b']
        )).to.be.true();
      });

      test('sorts by start date', async () => {
        expect(stub.orderBy.calledWith(
          'start_date', 'asc'
        )).to.be.true();
      });

      test('calls .fetchAll() to retrieve all matching records', async () => {
        expect(stub.fetchAll.called).to.be.true();
      });

      test('calls .toJSON() on the collection', async () => {
        expect(model.toJSON.called).to.be.true();
      });

      test('resolves with an array', async () => {
        expect(result).to.be.an.array();
      });
    });
  });

  experiment('.findOne', () => {
    let result;

    experiment('when a record is found', () => {
      beforeEach(async () => {
        model.toJSON.resolves({ foo: 'bar' });
        result = await repos.licenceAgreements.findOne('test-id');
      });

      test('calls model.forge with correct id', async () => {
        const [params] = LicenceAgreement.forge.lastCall.args;
        expect(params).to.equal({ licenceAgreementId: 'test-id' });
      });

      test('calls fetch() without requiring matching record', async () => {
        const [params] = stub.fetch.lastCall.args;
        expect(params.require).to.equal(false);
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
        result = await repos.licenceAgreements.findOne('test-id');
      });

      test('resolves with null', async () => {
        expect(result).to.equal(null);
      });
    });
  });
});
