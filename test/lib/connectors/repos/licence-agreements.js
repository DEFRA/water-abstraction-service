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

const helpers = require('../../../../src/lib/connectors/repos/lib/helpers');
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
    sandbox.stub(helpers, 'findOne').returns();
    sandbox.stub(helpers, 'deleteOne').returns();
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
    beforeEach(async () => {
      result = await repos.licenceAgreements.findOne('test-id');
    });
    test('calls the findOne helper function with expected arguments', () => {
      const [model, key, id] = helpers.findOne.lastCall.args;
      expect(model).to.equal(LicenceAgreement);
      expect(key).to.equal('licenceAgreementId');
      expect(id).to.equal('test-id');
    });
  });

  experiment('.deleteOne', () => {
    beforeEach(async () => {
      result = await repos.licenceAgreements.deleteOne('test-id');
    });

    test('calls the deleteOne helper function with expected arguments', () => {
      const [model, key, id] = helpers.deleteOne.lastCall.args;
      expect(model).to.equal(LicenceAgreement);
      expect(key).to.equal('licenceAgreementId');
      expect(id).to.equal('test-id');
    });
  });
});
